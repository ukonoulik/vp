const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visitsControllers');

router.get('/', ctrl.visits);
router.route('/regvisit')
    .get(ctrl.regvisit)
    .post(ctrl.regvisitPost);

module.exports = router;
