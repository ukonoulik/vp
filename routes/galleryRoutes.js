const express = require('express');
const router = express.Router();
const checkLogin = require('../src/checkLogin');
const {gallery} = require('../controllers/galleryPhotoUploadControllers');

router.get('/', gallery);

module.exports = router;
