import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadOptions } from '../config/cloudinary';

interface FileInfo {
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
}

/**
 * Multer configuration for local temp storage.
 * Controllers upload these files through CloudinaryService, then the service removes temp files.
 */
const uploadTempDir = path.join(process.cwd(), 'uploads', 'temp');
const ensureUploadDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createDiskStorage = (subfolder: string) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const destination = path.join(uploadTempDir, subfolder);
    ensureUploadDir(destination);
    cb(null, destination);
  },
  filename: (_req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const storage = createDiskStorage('general');

/**
 * Default multer configuration
 */
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: uploadOptions.max_file_size, // 10MB
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

/**
 * Product images upload configuration
 */
const productStorage = createDiskStorage('products');

export const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: uploadOptions.max_file_size,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed for products`));
    }
  },
});

/**
 * Category images upload configuration
 */
const categoryStorage = createDiskStorage('categories');

export const uploadCategoryImages = multer({
  storage: categoryStorage,
  limits: {
    fileSize: uploadOptions.max_file_size,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed for categories`));
    }
  },
});

/**
 * Avatar upload configuration
 */
const avatarStorage = createDiskStorage('avatars');

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed for avatars`));
    }
  },
});

/**
 * Banner upload configuration
 */
const bannerStorage = createDiskStorage('banners');

export const uploadBanner = multer({
  storage: bannerStorage,
  limits: {
    fileSize: uploadOptions.max_file_size,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed for banners`));
    }
  },
});

/**
 * Error handling middleware for multer
 */
export const handleUploadError = (
  error: Error | multer.MulterError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files.',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          code: 'UNEXPECTED_FILE'
        });
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts.',
          code: 'TOO_MANY_PARTS'
        });
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: 'Field name too long.',
          code: 'FIELD_NAME_TOO_LONG'
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Field value too long.',
          code: 'FIELD_VALUE_TOO_LONG'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields.',
          code: 'TOO_MANY_FIELDS'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Log unexpected errors
  console.error('Unexpected upload error:', error);
  
  next(error);
};

/**
 * Helper function to extract file information
 */
export const extractFileInfo = (file: Express.Multer.File): FileInfo => {
  return {
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    filename: file.filename,
  };
};

/**
 * Helper function to extract multiple files information
 */
export const extractFilesInfo = (files: Express.Multer.File[]): FileInfo[] => {
  return files.map(file => extractFileInfo(file));
};

/**
 * Helper function to validate file type
 */
export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

/**
 * Helper function to validate file size
 */
export const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Helper function to get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Helper function to generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(originalName);
  return `${timestamp}_${random}.${extension}`;
}
