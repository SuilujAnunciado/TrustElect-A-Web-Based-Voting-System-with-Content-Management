const multer = require('multer');
const path = require('path');
const fs = require('fs');

<<<<<<< HEAD
const baseUploadDir = path.join(__dirname, '../../uploads');
const imagesUploadDir = path.join(baseUploadDir, 'images');

=======
// Define upload directories
const baseUploadDir = path.join(__dirname, '../../uploads');
const imagesUploadDir = path.join(baseUploadDir, 'images');

// Ensure upload directories exist
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
[baseUploadDir, imagesUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

<<<<<<< HEAD
=======

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'student-bg-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
<<<<<<< HEAD
=======
  // Accept images only
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
<<<<<<< HEAD
    fileSize: 5 * 1024 * 1024 
=======
    fileSize: 5 * 1024 * 1024 // 5 MB limit
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  }
});

module.exports = upload; 