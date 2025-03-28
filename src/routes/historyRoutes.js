const express = require('express');
const historyController = require('../controllers/historyController');
const router = express.Router();

router.get('/', historyController.getAllHistory);
router.get('/:customerId', historyController.getHistoryByCustomerId);

module.exports = router;