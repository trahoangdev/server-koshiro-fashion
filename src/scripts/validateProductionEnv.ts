import dotenv from 'dotenv';
import { env } from '../config/env';

dotenv.config();

const requiredProductionVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missing = requiredProductionVars.filter((name) => {
  const value = process.env[name];
  return !value || value.trim().length === 0 || value.includes('your-');
});

const errors: string[] = [];

if (env.NODE_ENV !== 'production') {
  errors.push('NODE_ENV must be production for production env validation');
}

if (missing.length > 0) {
  errors.push(`Missing required production env vars: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET must be at least 32 characters in production');
}

const frontendUrls = [process.env.FRONTEND_URL, process.env.PRODUCTION_FRONTEND_URL].filter(Boolean) as string[];
for (const url of frontendUrls) {
  if (!/^https:\/\//.test(url)) {
    errors.push(`${url} must use https:// in production`);
  }
}

if (process.env.TRUST_PROXY === 'true') {
  errors.push('TRUST_PROXY must be a concrete hop count or false; do not use true');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Production server env check passed');
