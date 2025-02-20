const express = require('express');
const router = express.Router();

const routeRoutes = require('./routeRoutes');
const busTypeRoutes = require('./busTypeRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const busRoutes = require('./busRoutes');
const seatLayoutRoutes = require('./seatLayoutRoutes');

// Mount các routes
router.use('/routes', routeRoutes);
router.use('/bus-types', busTypeRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/buses', busRoutes);
router.use('/seat-layout', seatLayoutRoutes)

module.exports = router;
