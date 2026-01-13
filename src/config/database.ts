import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../lib/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async (): Promise<void> => {
  if (!MONGODB_URI) {
    logger.error('❌ MONGODB_URI environment variable is not defined');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
};
