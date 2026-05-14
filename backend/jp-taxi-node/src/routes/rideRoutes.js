const express = require('express');
const router = express.Router();
const ride = require('../controllers/rideController');

// API nghiệp vụ cốt lõi của ứng dụng Taxi
router.post('/estimate', ride.calculateEstimate);

module.exports = router;