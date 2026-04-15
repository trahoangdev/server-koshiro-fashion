import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import CloudinaryService from '../services/cloudinaryService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const videoUploadDir = path.resolve(process.cwd(), 'uploads', 'videos');

fs.mkdirSync(videoUploadDir, { recursive: true });

const cleanupFiles = (files: Express.Multer.File[] = []) => {
  files.forEach((file) => {
    if (file.path) {
      fs.promises.unlink(file.path).catch(() => {
        // Ignore cleanup failures; upload result is already determined.
      });
    }
  });
};

router.use(authenticateToken);
router.use(requireAdmin);

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Video upload endpoint
router.post('/videos', videoUpload.array('videos', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No video files provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadResult = await CloudinaryService.uploadProductVideos(files);
    cleanupFiles(files);
    
    if (uploadResult.success && uploadResult.data) {
      res.json({
        success: true,
        data: uploadResult.data,
        message: `${uploadResult.data.length} video(s) uploaded successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to upload videos',
        errors: uploadResult.errors
      });
    }
  } catch (error) {
    cleanupFiles(Array.isArray(req.files) ? req.files as Express.Multer.File[] : []);
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during video upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Single video upload endpoint
router.post('/video', videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const uploadResult = await CloudinaryService.uploadVideo(req.file);
    cleanupFiles([req.file]);
    
    if (uploadResult.success && uploadResult.data) {
      res.json({
        success: true,
        data: uploadResult.data,
        message: 'Video uploaded successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to upload video',
        error: uploadResult.error
      });
    }
  } catch (error) {
    if (req.file) {
      cleanupFiles([req.file]);
    }
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during video upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
