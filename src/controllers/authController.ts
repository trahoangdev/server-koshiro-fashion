import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../services/emailService';
import { User } from '../models/User';
import Role, { IRole } from '../models/Role';
import { Settings } from '../models/Settings';
import { asyncHandler, errors } from '../utils/errorHandler';
import { logger } from '../lib/logger';

const JWT_SECRET: string = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}


import { UserRole } from '../constants/roles';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Get password minimum length from settings
  const settings = await Settings.findOne();
  const passwordMinLength = settings?.passwordMinLength || 8;

  // Validate password length
  if (password && password.length < passwordMinLength) {
    return res.status(400).json({
      message: `Password must be at least ${passwordMinLength} characters long`
    });
  }

  // Get or create Customer role
  let customerRole = await Role.findOne({ name: UserRole.CUSTOMER });
  if (!customerRole) {
    customerRole = new Role({
      name: UserRole.CUSTOMER,
      nameEn: UserRole.CUSTOMER,
      nameJa: '顧客',
      description: 'Standard customer access',
      descriptionEn: 'Standard customer access',
      descriptionJa: '標準的な顧客アクセス',
      level: 10,
      isSystem: true,
      isActive: true,
      permissions: []
    });
    await customerRole.save();
  }

  // Create new user with Customer role
  const user = new User({
    email,
    password,
    name,
    phone,
    address,
    role: customerRole._id
  });

  await user.save();

  // Populate role for response
  await user.populate('role');

  // Get user role name
  const userRole = typeof user.role === 'string' ? user.role : (user.role as unknown as IRole)?.name || 'Customer';

  // Get session timeout from settings (in minutes, default to 7 days = 10080 minutes)
  const sessionSettings = await Settings.findOne();
  const sessionTimeoutMinutes = sessionSettings?.sessionTimeout || 10080; // Default 7 days
  let expiresIn: string;
  if (sessionTimeoutMinutes < 60) {
    expiresIn = `${sessionTimeoutMinutes}m`;
  } else if (sessionTimeoutMinutes < 1440) {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 60)}h`;
  } else {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 1440)}d`;
  }

  // Generate JWT token
  // @ts-expect-error - expiresIn accepts string format like "7d", "30m", etc.
  const signOptions: SignOptions = { expiresIn };
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: userRole, name: user.name },
    JWT_SECRET,
    signOptions
  );

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.name);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: userRole
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();

  // Get max login attempts from settings
  const loginSettings = await Settings.findOne();
  const maxLoginAttempts = loginSettings?.maxLoginAttempts || 5;
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Find user by email and populate role
  const user = await User.findOne({ email: normalizedEmail }).populate('role');
  if (!user) {
    logger.debug('Login attempt failed: User not found', { email: normalizedEmail });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  logger.debug('Login attempt: User found', { email: normalizedEmail, userId: user._id, status: user.status });

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
    return res.status(429).json({
      message: `Account is temporarily locked. Please try again in ${minutesLeft} minute(s).`
    });
  }

  // Reset lockout if expired
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    user.lockedUntil = undefined;
    user.loginAttempts = 0;
  }

  // Reset login attempts if reset time has passed (1 hour)
  if (user.loginAttemptsResetAt && user.loginAttemptsResetAt <= new Date()) {
    user.loginAttempts = 0;
    user.loginAttemptsResetAt = undefined;
  }

  // Check password
  try {
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Set reset time if not set (1 hour from now)
      if (!user.loginAttemptsResetAt) {
        user.loginAttemptsResetAt = new Date(Date.now() + 60 * 60 * 1000);
      }

      // Lock account if max attempts reached
      if (user.loginAttempts >= maxLoginAttempts) {
        user.lockedUntil = new Date(Date.now() + lockoutDuration);
        await user.save();
        logger.debug('Login attempt failed: Account locked', {
          email: normalizedEmail,
          userId: user._id,
          attempts: user.loginAttempts,
          lockedUntil: user.lockedUntil
        });
        return res.status(429).json({
          message: `Too many failed login attempts. Account locked for 30 minutes.`
        });
      }

      await user.save();

      logger.debug('Login attempt failed: Invalid password', {
        email: normalizedEmail,
        userId: user._id,
        attempts: user.loginAttempts,
        maxAttempts: maxLoginAttempts,
        passwordHashLength: user.password?.length || 0
      });
      return res.status(401).json({
        message: `Invalid credentials. ${maxLoginAttempts - user.loginAttempts} attempt(s) remaining.`
      });
    }
    logger.debug('Login attempt: Password validated successfully', { email: normalizedEmail, userId: user._id });

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.loginAttemptsResetAt = undefined;
    user.lockedUntil = undefined;
  } catch (error) {
    logger.error('Password comparison error', error);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({ message: 'Account is not active' });
  }

  // Update last active
  user.lastActive = new Date();
  await user.save();

  // Get user role name
  const userRole = typeof user.role === 'string' ? user.role : (user.role as unknown as IRole)?.name || UserRole.CUSTOMER;

  // Get session timeout from settings (already loaded above for maxLoginAttempts)
  const sessionTimeoutMinutes = loginSettings?.sessionTimeout || 10080; // Default 7 days
  let expiresIn: string;
  if (sessionTimeoutMinutes < 60) {
    expiresIn = `${sessionTimeoutMinutes}m`;
  } else if (sessionTimeoutMinutes < 1440) {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 60)}h`;
  } else {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 1440)}d`;
  }

  // Generate JWT token
  // @ts-expect-error - expiresIn accepts string format like "7d", "30m", etc.
  const signOptions: SignOptions = { expiresIn };
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: userRole, name: user.name },
    JWT_SECRET,
    signOptions
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: userRole
    }
  });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find admin user by email and populate role
  const user = await User.findOne({ email }).populate('role');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user has admin role
  const userRole = typeof user.role === 'string' ? user.role : (user.role as unknown as IRole)?.name;
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({ message: 'Account is not active' });
  }

  // Update last active
  user.lastActive = new Date();
  await user.save();

  // Get session timeout from settings (in minutes, default to 7 days = 10080 minutes)
  const adminSessionSettings = await Settings.findOne();
  const sessionTimeoutMinutes = adminSessionSettings?.sessionTimeout || 10080; // Default 7 days
  let expiresIn: string;
  if (sessionTimeoutMinutes < 60) {
    expiresIn = `${sessionTimeoutMinutes}m`;
  } else if (sessionTimeoutMinutes < 1440) {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 60)}h`;
  } else {
    expiresIn = `${Math.floor(sessionTimeoutMinutes / 1440)}d`;
  }

  // Generate JWT token
  // @ts-ignore
  const signOptions: SignOptions = { expiresIn };
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: userRole, name: user.name },
    JWT_SECRET,
    signOptions
  );

  res.json({
    message: 'Admin login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: userRole
    }
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const user = await User.findById(userId).select('-password').populate('role');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Get user role name
  const userRole = typeof user.role === 'string' ? user.role : (user.role as unknown as IRole)?.name || UserRole.CUSTOMER;

  res.json({
    user: {
      ...user.toObject(),
      role: userRole
    }
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { name, phone, address, preferences } = req.body;

  // Find user and update allowed fields
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update allowed fields
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  // Update preferences if provided
  if (preferences !== undefined) {
    if (!user.preferences) {
      user.preferences = {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        language: 'en',
        currency: 'USD'
      };
    }

    if (preferences.language !== undefined) user.preferences.language = preferences.language;
    if (preferences.currency !== undefined) user.preferences.currency = preferences.currency;
    if (preferences.emailNotifications !== undefined) user.preferences.emailNotifications = preferences.emailNotifications;
    if (preferences.smsNotifications !== undefined) user.preferences.smsNotifications = preferences.smsNotifications;
    if (preferences.marketingEmails !== undefined) user.preferences.marketingEmails = preferences.marketingEmails;

    // Update notification preferences if provided
    if (preferences.notificationPreferences !== undefined) {
      // Ensure notificationPreferences exists with all required fields
      if (!user.preferences.notificationPreferences) {
        // ... initialize if null (omitted for brevity, assume schema validation or detailed logic in actual code if needed, but here we can just merge or use existing logic)
        // Actually, let's keep the detailed initialization logic as it was good for robustness
        user.preferences.notificationPreferences = {
          email: {
            orderUpdates: true,
            promotions: true,
            newsletters: false,
            productRecommendations: true
          },
          push: {
            orderUpdates: true,
            promotions: false,
            backInStock: true,
            priceDrops: true
          },
          sms: {
            orderUpdates: false,
            promotions: false
          }
        };
      }

      // ... (rest of the detailed update logic for notificationPreferences) ...
      // I will simplify this block by copying the original logic but removing the outer try-catch

      // Ensure notificationPreferences exists with all required fields
      if (!user.preferences.notificationPreferences || !user.preferences.notificationPreferences.email || !user.preferences.notificationPreferences.push || !user.preferences.notificationPreferences.sms) {
        user.preferences.notificationPreferences = {
          email: {
            orderUpdates: true,
            promotions: true,
            newsletters: false,
            productRecommendations: true
          },
          push: {
            orderUpdates: true,
            promotions: false,
            backInStock: true,
            priceDrops: true
          },
          sms: {
            orderUpdates: false,
            promotions: false
          }
        };
      }

      const notificationPrefs = user.preferences.notificationPreferences;

      // Ensure email object exists
      if (!notificationPrefs.email) {
        notificationPrefs.email = {
          orderUpdates: true,
          promotions: true,
          newsletters: false,
          productRecommendations: true
        };
      }

      // Ensure push object exists
      if (!notificationPrefs.push) {
        notificationPrefs.push = {
          orderUpdates: true,
          promotions: false,
          backInStock: true,
          priceDrops: true
        };
      }

      // Ensure sms object exists
      if (!notificationPrefs.sms) {
        notificationPrefs.sms = {
          orderUpdates: false,
          promotions: false
        };
      }

      // Update email preferences
      if (preferences.notificationPreferences.email) {
        const emailPrefs = preferences.notificationPreferences.email;
        if (emailPrefs.orderUpdates !== undefined) notificationPrefs.email.orderUpdates = emailPrefs.orderUpdates;
        if (emailPrefs.promotions !== undefined) notificationPrefs.email.promotions = emailPrefs.promotions;
        if (emailPrefs.newsletters !== undefined) notificationPrefs.email.newsletters = emailPrefs.newsletters;
        if (emailPrefs.productRecommendations !== undefined) notificationPrefs.email.productRecommendations = emailPrefs.productRecommendations;
      }

      // Update push preferences
      if (preferences.notificationPreferences.push) {
        const pushPrefs = preferences.notificationPreferences.push;
        if (pushPrefs.orderUpdates !== undefined) notificationPrefs.push.orderUpdates = pushPrefs.orderUpdates;
        if (pushPrefs.promotions !== undefined) notificationPrefs.push.promotions = pushPrefs.promotions;
        if (pushPrefs.backInStock !== undefined) notificationPrefs.push.backInStock = pushPrefs.backInStock;
        if (pushPrefs.priceDrops !== undefined) notificationPrefs.push.priceDrops = pushPrefs.priceDrops;
      }

      // Update SMS preferences
      if (preferences.notificationPreferences.sms) {
        const smsPrefs = preferences.notificationPreferences.sms;
        if (smsPrefs.orderUpdates !== undefined) notificationPrefs.sms.orderUpdates = smsPrefs.orderUpdates;
        if (smsPrefs.promotions !== undefined) notificationPrefs.sms.promotions = smsPrefs.promotions;
      }
    }
  }

  await user.save();

  // Populate role for response
  await user.populate('role');
  const userRole = typeof user.role === 'string' ? user.role : (user.role as unknown as IRole)?.name || UserRole.CUSTOMER;

  // Return updated user without password
  const userResponse = {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    role: userRole,
    preferences: user.preferences
  };

  res.json({
    message: 'Profile updated successfully',
    user: userResponse
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Save reset token to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Send email. If delivery cannot be queued, do not leave a usable reset token behind.
  try {
    await emailService.sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw error;
  }

  res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Find user by reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  // Get password minimum length from settings
  const settings = await Settings.findOne();
  const passwordMinLength = settings?.passwordMinLength || 8;

  // Validate password length
  if (newPassword.length < passwordMinLength) {
    return res.status(400).json({
      message: `New password must be at least ${passwordMinLength} characters long`
    });
  }

  // Set new password (pre-save hook will automatically hash it)
  user.password = newPassword;

  // Clear reset token
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ message: 'Password has been reset successfully' });
});

// Change password (for authenticated users)
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { currentPassword, newPassword } = req.body;

  // Get password minimum length from settings
  const passwordSettings = await Settings.findOne();
  const passwordMinLength = passwordSettings?.passwordMinLength || 8;

  // Validate password length
  if (newPassword.length < passwordMinLength) {
    return res.status(400).json({
      message: `New password must be at least ${passwordMinLength} characters long`
    });
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  // Set new password (pre-save hook will automatically hash it)
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

// Delete account (for authenticated users)
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required to delete account' });
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Password is incorrect' });
  }

  // Delete user
  await User.findByIdAndDelete(userId);

  res.json({ message: 'Account deleted successfully' });
}); 
