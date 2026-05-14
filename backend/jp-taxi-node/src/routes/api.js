//Định nghĩa Route

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/auth');
const adminController = require('../controllers/adminController');
// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

// Ride Routes
router.post('/estimate', rideController.calculateEstimate);

// Quản lý Driver (Chỉ Admin mới được gọi các API này)
router.get('/admin/drivers', authMiddleware, adminController.getAllDrivers);
router.get('/admin/customers', authMiddleware, adminController.getAllCustomers);
router.delete('/admin/driver/:id', authMiddleware, adminController.deleteDriver);


module.exports = router;