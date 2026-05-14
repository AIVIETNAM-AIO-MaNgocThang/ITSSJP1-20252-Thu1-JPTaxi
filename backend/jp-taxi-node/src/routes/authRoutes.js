const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Tách riêng luồng đăng ký/đăng nhập
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;