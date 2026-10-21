const express = require('express');
const multer = require('multer'); 

const router = express.Router();

const upload = multer({dest: './public/gallery/orig/'});

//kasutatavad kontrollerid
const {
	galleryPhotoUpload,
	galleryPhotoUploadPost
} = require('../controllers/galleryPhotoUploadControllers');

router.route('/').get(galleryPhotoUpload);

router.route('/').post(upload.single('photoInput'), galleryPhotoUploadPost);

module.exports = router;