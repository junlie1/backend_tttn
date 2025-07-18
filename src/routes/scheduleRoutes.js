const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { validateScheduleData } = require('../middleware/scheduleValidation');

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getSchedule);
router.get('/app/:id', scheduleController.getScheduleApp);
router.post('/', validateScheduleData, scheduleController.createSchedule);
router.put('/:id', validateScheduleData, scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);
router.patch('/update-time', scheduleController.updateTimeSchedule);

module.exports = router;
