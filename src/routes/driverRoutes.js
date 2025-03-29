const express = require('express');
const driverController = require('../controllers/driverController');
const router = express.Router();

router.get('/getAllDriver', driverController.getAllDriver);
router.post('/assignSchedule', driverController.getAllDriver);

module.exports = router;