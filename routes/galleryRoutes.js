const express = require('express');
//sisselogimise kontrolli vahevara
const checkLogin = require('../src/checkLogin');

const router = express.Router();
//kontrollin sisselogimist
router.use(checkLogin.isLogin);

//kasutatavad kontrollerid
const {
	galleryHome,
	myGalleryPage,
	galleryPage
	} = require('../controllers/galleryControllers');

router.route('/').get(galleryHome);

router.route('/my').get(myGalleryPage);

router.route('/:page').get(galleryPage)

module.exports = router;