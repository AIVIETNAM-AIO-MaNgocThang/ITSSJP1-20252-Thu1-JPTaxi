const express = require('express');
const router = express.Router();
const manage = require('../controllers/managementController');
const auth = require('../middleware/authMiddleware');

// Nhóm các API CRUD vào prefix /manage để POT dễ thấy
router.get('/customers', auth, manage.getAllCustomers);
router.get('/drivers', auth, manage.getAllDrivers);
router.delete('/driver/:id', auth, manage.deleteDriver);
router.put('/customer/:id', auth, manage.updateCustomer);

module.exports = router;