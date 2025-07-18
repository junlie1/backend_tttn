const express = require('express');
const driverController = require('../controllers/driverController');
const router = express.Router();

router.get('/getAllDriver', driverController.getAllDriver);
router.post('/assignSchedule', driverController.assignSchedule);
router.post('/completeSchedule', driverController.completeSchedule);
router.get('/assignedSchedule/:id', driverController.getAssignedSchedule);
router.post('/startSchedule', driverController.startSchedule);
router.get('/history/:driverId', driverController.getScheduleHistory);
router.delete('/:id', driverController.deleteDriverById);
router.get('/:id', driverController.getDriverById);
router.put('/:id', driverController.updateDriver);

module.exports = router;


module.exports = router;