const express = require('express');
const router = express.Router();
const busTypeController = require('../controllers/busTypeController');

router.post('/', busTypeController.createBusType);
router.get('/', busTypeController.getBusTypes);
router.get('/:id', busTypeController.getBusType);

module.exports = router;
