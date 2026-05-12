const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// Lấy danh sách tất cả tài xế
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.findAll({ attributes: { exclude: ['password_hash'] } });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách tất cả khách hàng
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({ attributes: { exclude: ['password_hash'] } });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa một tài xế (Admin quyền lực)
exports.deleteDriver = async (req, res) => {
    try {
        await Driver.destroy({ where: { driver_id: req.params.id } });
        res.json({ message: "Đã xóa tài xế thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};