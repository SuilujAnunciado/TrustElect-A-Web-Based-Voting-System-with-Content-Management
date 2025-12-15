const multer = require('multer');
const path = require('path');
const fs = require('fs');

<<<<<<< HEAD

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/candidates';
=======
// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/candidates';
    // Create directory if it doesn't exist
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
<<<<<<< HEAD
=======
    // Generate unique filename with timestamp and random number
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'candidate-' + uniqueSuffix + path.extname(file.originalname));
  }
});

<<<<<<< HEAD
=======
// File filter to only allow image files
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

<<<<<<< HEAD
=======
// Create multer instance with configuration
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const candidateUploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
<<<<<<< HEAD
    fileSize: 2 * 1024 * 1024 
=======
    fileSize: 2 * 1024 * 1024 // 2MB limit
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  }
});

module.exports = { candidateUploadMiddleware }; 