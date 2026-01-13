import express from 'express';
import {
  getOrders,
  getUserOrders,
  getOrder,
  createOrder,
  createGuestOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  trackOrder,
  trackOrderByEmail
} from '../controllers/orderController';
import { authenticateToken, requireAdmin, requireCustomer, requireCustomerOrAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, createGuestOrderSchema, updateOrderStatusSchema } from '../validations/orderValidation';

const router = express.Router();

// Public routes
router.get('/track/:orderNumber', trackOrder);
router.get('/track-email/:email', trackOrderByEmail);
router.post('/guest', validate(createGuestOrderSchema), createGuestOrder); // Guest order (no authentication)

// Customer routes (protected)
router.get('/my-orders', authenticateToken, requireCustomer, getUserOrders);
router.get('/my-orders/:id', authenticateToken, requireCustomer, getOrder);
router.post('/', authenticateToken, requireCustomer, validate(createOrderSchema), createOrder);
router.put('/:id/cancel', authenticateToken, requireCustomerOrAdmin, cancelOrder);

// Admin routes (protected)
router.get('/', authenticateToken, requireAdmin, getOrders);
router.get('/stats', authenticateToken, requireAdmin, getOrderStats);
router.get('/:id', authenticateToken, requireAdmin, getOrder);
router.post('/admin', authenticateToken, requireAdmin, validate(createOrderSchema), createOrder);
router.put('/:id', authenticateToken, requireAdmin, updateOrder); // Can add generic update schema if needed
router.put('/:id/status', authenticateToken, requireAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

export default router; 