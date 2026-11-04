const express = require('express');
const router = express.Router();
const {gallery} = require('../controllers/galleryPhotoUploadControllers');

router.get('/', gallery);

module.exports = router;
