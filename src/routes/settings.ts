import express from 'express';
import {
  getPublicSettings,
  getSettings,
  updateSettings
} from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public storefront/runtime settings. Returns only non-sensitive settings.
router.get('/public', getPublicSettings);

// Admin routes (protected)
router.get('/', authenticateToken, requireAdmin, getSettings);
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router; 
