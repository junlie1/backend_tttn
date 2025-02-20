const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// Tạo xe mới
router.post('/', busController.createBus);

// Lấy danh sách xe
router.get('/', busController.getBuses);

// Lấy chi tiết xe
router.get('/:id', busController.getBus);

// Cập nhật xe
router.put('/:id', busController.updateBus);

// Xóa xe
router.delete('/:id', busController.deleteBus);

module.exports = router;
