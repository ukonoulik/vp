const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eestifilmControllers');

router.get('/', ctrl.eestifilm);

router.get('/film_inimesed', ctrl.eestifilmInimesed);
router.route('/lisa_film_inimesed')
    .get(ctrl.eestifilmInimesedLisa)
    .post(ctrl.eestifilmInimesedLisaPost);

router.get('/filmid', ctrl.filmid);
router.route('/lisa_filmid')
    .get(ctrl.filmidLisa)
    .post(ctrl.filmidLisaPost);

router.get('/ametid', ctrl.ametid);
router.route('/lisa_ametid')
    .get(ctrl.ametidLisa)
    .post(ctrl.ametidLisaPost);

// Filmi, inimese ja ameti vahelised seosed
router.get('/seosed', ctrl.seosed);
router.route('/lisa_seos')
    .get(ctrl.seosLisa)
    .post(ctrl.seosLisaPost);

module.exports = router;
