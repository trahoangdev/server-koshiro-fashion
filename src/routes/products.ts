import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  searchProducts,
  uploadProductImages,
  deleteProductImages
} from '../controllers/productController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadProductImages as uploadMiddleware, handleUploadError } from '../middleware/upload';
import { productLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validations/productValidation';

const router = express.Router();

// Public routes with rate limiting
router.get('/', productLimiter, getProducts);
router.get('/featured', productLimiter, getFeaturedProducts);
router.get('/search', productLimiter, searchProducts);
router.get('/:id', productLimiter, getProduct);

// Admin routes (protected)
// Note: validate(createProductSchema) is placed AFTER parsing multipart/form-data because req.body is populated by multer
router.post('/', authenticateToken, requireAdmin, uploadMiddleware.array('images', 10), handleUploadError, validate(createProductSchema), createProduct);
router.put('/:id', authenticateToken, requireAdmin, validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

// Image management routes
router.post('/upload-images', authenticateToken, requireAdmin, uploadMiddleware.array('images', 10), handleUploadError, uploadProductImages);
router.delete('/delete-images', authenticateToken, requireAdmin, deleteProductImages);

export default router; 