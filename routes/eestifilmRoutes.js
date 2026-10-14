const express = require('express');
const router = express.Router();

//kasutatavad kontrollerid
const {
	eestifilm,
	eestifilmInimesed,
	eestifilmInimesedLisa,
	eestifilmInimesedLisaPost,
	filmid,
	filmidLisa,
	filmidLisaPost,
	ametid,
	ametidLisa,
	ametidLisaPost
} = require('../controllers/eestifilmControllers');

router.route('/').get(eestifilm);

router.route('/film_inimesed').get(eestifilmInimesed);

router.route('/lisa_film_inimesed').get(eestifilmInimesedLisa);

router.route('/lisa_film_inimesed').post(eestifilmInimesedLisaPost);

router.route('/filmid').get(filmid);

router.route('/lisa_filmid').get(filmidLisa);

router.route('/lisa_filmid').post(filmidLisaPost);

router.route('/ametid').get(ametid);

router.route('/lisa_ametid').get(ametidLisa);

router.route('/lisa_ametid').post(ametidLisaPost);

module.exports = router;