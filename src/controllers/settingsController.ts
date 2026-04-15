import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/auth';
import { Settings } from '../models/Settings';

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();

  // If no settings exist, create default settings
  if (!settings) {
    settings = new Settings();
    await settings.save();
  }

  return settings;
};

// Get public settings used by storefront/runtime UI.
export const getPublicSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getOrCreateSettings();

  res.json({
    _id: settings._id,
    websiteName: settings.websiteName,
    websiteDescription: settings.websiteDescription,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    address: settings.address,
    timezone: settings.timezone,
    currency: settings.currency,
    language: settings.language,
    emailNotifications: settings.emailNotifications,
    orderNotifications: settings.orderNotifications,
    stockNotifications: settings.stockNotifications,
    customerNotifications: settings.customerNotifications,
    adminNotifications: settings.adminNotifications,
    sessionTimeout: settings.sessionTimeout,
    passwordMinLength: settings.passwordMinLength,
    requireTwoFactor: settings.requireTwoFactor,
    maxLoginAttempts: settings.maxLoginAttempts,
    enableCaptcha: settings.enableCaptcha,
    stripeEnabled: settings.stripeEnabled,
    paypalEnabled: settings.paypalEnabled,
    cashOnDelivery: settings.cashOnDelivery,
    bankTransfer: settings.bankTransfer,
    freeShippingThreshold: settings.freeShippingThreshold,
    defaultShippingCost: settings.defaultShippingCost,
    enableTracking: settings.enableTracking,
    shippingZones: settings.shippingZones,
    theme: settings.theme,
    primaryColor: settings.primaryColor,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    enableDarkMode: settings.enableDarkMode,
    maintenanceMode: settings.maintenanceMode,
    debugMode: settings.debugMode,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  });
});

// Get system settings
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getOrCreateSettings();

  res.json(settings);
});

// Update system settings
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    // General Settings
    websiteName,
    websiteDescription,
    contactEmail,
    contactPhone,
    address,
    timezone,
    currency,
    language,

    // Notification Settings
    emailNotifications,
    orderNotifications,
    stockNotifications,
    customerNotifications,
    adminNotifications,

    // Security Settings
    sessionTimeout,
    passwordMinLength,
    requireTwoFactor,
    maxLoginAttempts,
    enableCaptcha,

    // Payment Settings
    stripeEnabled,
    paypalEnabled,
    cashOnDelivery,
    bankTransfer,

    // Shipping Settings
    freeShippingThreshold,
    defaultShippingCost,
    enableTracking,
    shippingZones,

    // Appearance Settings
    theme,
    primaryColor,
    logoUrl,
    faviconUrl,

    // System Settings (legacy)
    enableDarkMode,
    maintenanceMode,
    debugMode
  } = req.body;

  let settings = await Settings.findOne();

  if (!settings) {
    settings = new Settings();
  }

  // Update General Settings
  if (websiteName !== undefined) settings.websiteName = websiteName;
  if (websiteDescription !== undefined) settings.websiteDescription = websiteDescription;
  if (contactEmail !== undefined) settings.contactEmail = contactEmail;
  if (contactPhone !== undefined) settings.contactPhone = contactPhone;
  if (address !== undefined) settings.address = address;
  if (timezone !== undefined) settings.timezone = timezone;
  if (currency !== undefined) settings.currency = currency;
  if (language !== undefined) settings.language = language;

  // Update Notification Settings
  if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
  if (orderNotifications !== undefined) settings.orderNotifications = orderNotifications;
  if (stockNotifications !== undefined) settings.stockNotifications = stockNotifications;
  if (customerNotifications !== undefined) settings.customerNotifications = customerNotifications;
  if (adminNotifications !== undefined) settings.adminNotifications = adminNotifications;

  // Update Security Settings
  if (sessionTimeout !== undefined) settings.sessionTimeout = sessionTimeout;
  if (passwordMinLength !== undefined) settings.passwordMinLength = passwordMinLength;
  if (requireTwoFactor !== undefined) settings.requireTwoFactor = requireTwoFactor;
  if (maxLoginAttempts !== undefined) settings.maxLoginAttempts = maxLoginAttempts;
  if (enableCaptcha !== undefined) settings.enableCaptcha = enableCaptcha;

  // Update Payment Settings
  if (stripeEnabled !== undefined) settings.stripeEnabled = stripeEnabled;
  if (paypalEnabled !== undefined) settings.paypalEnabled = paypalEnabled;
  if (cashOnDelivery !== undefined) settings.cashOnDelivery = cashOnDelivery;
  if (bankTransfer !== undefined) settings.bankTransfer = bankTransfer;

  // Update Shipping Settings
  if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;
  if (defaultShippingCost !== undefined) settings.defaultShippingCost = defaultShippingCost;
  if (enableTracking !== undefined) settings.enableTracking = enableTracking;
  if (shippingZones !== undefined && Array.isArray(shippingZones)) {
    settings.shippingZones = shippingZones;
  }

  // Update Appearance Settings
  if (theme !== undefined) settings.theme = theme;
  if (primaryColor !== undefined) settings.primaryColor = primaryColor;
  if (logoUrl !== undefined) settings.logoUrl = logoUrl;

  if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
  if (req.body.banners !== undefined) settings.banners = req.body.banners;

  // Update System Settings (legacy)
  if (enableDarkMode !== undefined) settings.enableDarkMode = enableDarkMode;
  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
  if (debugMode !== undefined) settings.debugMode = debugMode;

  await settings.save();

  res.json(settings);
});
