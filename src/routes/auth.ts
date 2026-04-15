import express from 'express';
import { register, login, adminLogin, getProfile, updateProfile, forgotPassword, resetPassword, changePassword, deleteAccount } from '../controllers/authController';
import { googleLogin, facebookLogin } from '../controllers/oauthController';
import { getUserAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    adminLoginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    updateProfileSchema
} from '../validations/authValidation';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);
router.post('/google', authLimiter, googleLogin);
router.post('/facebook', authLimiter, facebookLogin);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), changePassword);
router.delete('/account', authenticateToken, deleteAccount);

// Address routes
router.get('/addresses', authenticateToken, getUserAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.put('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);
router.put('/addresses/:id/default', authenticateToken, setDefaultAddress);

export default router; 
