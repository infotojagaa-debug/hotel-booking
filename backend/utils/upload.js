const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'elite-stays-hotels',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
});

module.exports = upload;
