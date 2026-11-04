const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({
    dest: process.env.UPLOAD_ORIGINAL_PATH || './public/gallery/orig/',
    fileFilter: (req, file, cb) => cb(null, file.mimetype === 'image/jpeg')
});

const {galleryPhotoUpload, galleryPhotoUploadPost} = require('../controllers/galleryPhotoUploadControllers');

router.get('/', galleryPhotoUpload);
router.post('/', upload.single('photoInput'), galleryPhotoUploadPost);

module.exports = router;
