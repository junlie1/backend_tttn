const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
// const paymentController = require('../controllers/paymentControllerFixBug');

router.post("/create_payment_url", paymentController.createPaymentUrl);
router.get("/vnpay_return", paymentController.vnpayReturn);

module.exports = router;
