const express = require('express');
const router = express.Router();

const routeRoutes = require('./routeRoutes');
const busTypeRoutes = require('./busTypeRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const busRoutes = require('./busRoutes');
const seatLayoutRoutes = require('./seatLayoutRoutes');
const paymentRoutes = require('./paymentRoutes');
const userRoutes = require('./userRoutes');
const historyRoutes = require('./historyRoutes');
const driverRoutes = require('./driverRoutes');

// Mount các routes
router.use('/routes', routeRoutes);
router.use('/bus-types', busTypeRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/buses', busRoutes);
router.use('/seat-layout', seatLayoutRoutes);
router.use('/payment', paymentRoutes);
router.use('/user', userRoutes);
router.use('/history', historyRoutes);
router.use('/driver', driverRoutes);

module.exports = router;
