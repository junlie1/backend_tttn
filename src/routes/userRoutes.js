const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUser);
router.get('/:customerId', userController.getUserById);
router.patch('/update/:customerId', userController.updateUserById);

module.exports = router;