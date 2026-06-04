import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env';

// Configuration from env
cloudinary.config({
  cloud_name: env.cloudinaryCloudName || 'demo',
  api_key: env.cloudinaryApiKey || 'demo',
  api_secret: env.cloudinaryApiSecret || 'demo'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'just-us-memories',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

export const upload = multer({ storage: storage });
export { cloudinary };
