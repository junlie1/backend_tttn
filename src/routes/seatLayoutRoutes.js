const express = require('express');
const router = express.Router();
const seatLayoutController = require('../controllers/seatLayoutController');

router.get('/:seatLayoutId', seatLayoutController.getSeatLayoutById);

module.exports = router;