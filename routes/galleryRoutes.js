const express = require('express');
const checkLogin = require('../src/checkLogin');
const router = express.Router();

router.use(checkLogin.isLogin);

const {
    galleryHome,
    myGalleryPage,
    galleryPage,
    editPhoto,
    editPhotoPost
} = require('../controllers/galleryControllers');

router.route('/').get(galleryHome);
router.route('/my').get(myGalleryPage);

router.route('/my/edit/:id')
    .get(editPhoto)
    .post(editPhotoPost);

router.route('/:page').get(galleryPage);

module.exports = router;