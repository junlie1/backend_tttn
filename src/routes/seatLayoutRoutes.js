const express = require('express');
const router = express.Router();
const seatLayoutController = require('../controllers/seatLayoutController');

router.get('/:seatLayoutId', seatLayoutController.getSeatLayoutById);
router.post('/createSeatlayout', seatLayoutController.createSeatlayout);

module.exports = router;