const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Đăng ký (Create trong CRUD)
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newCustomer = await Customer.create({
            first_name, last_name, email, 
            password_hash: hashedPassword, phone
        });
        
        res.status(201).json({ message: "Đăng ký thành công", user: newCustomer });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. Đăng nhập (API Quan trọng 1)
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await Customer.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: "Email hoặc mật khẩu sai" });
    }

    const token = jwt.sign({ id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email: user.email, name: user.first_name } });
};

// 3. Lấy thông tin (Read trong CRUD)
exports.getProfile = async (req, res) => {
    const user = await Customer.findByPk(req.user.id);
    res.json(user);
};