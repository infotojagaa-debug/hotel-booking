const multer = require('multer');
const path = require('path');
const fs = require('fs');

// The Root Project directory is two levels up from 'backend/utils/'
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure the root uploads directory exists!
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg, .webp and .jpeg format allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
});

module.exports = upload;
