const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// --- IMPORT CÁC ROUTE MODULES ---
const authRoutes = require('./routes/authRoutes');      // Phần 2: Auth
const rideRoutes = require('./routes/rideRoutes');      // Phần 3: Ride API
const managementRoutes = require('./routes/managementRoutes'); // Phần 1: CRUD Management

// Import Models để Sequelize nhận diện và đồng bộ bảng
const Customer = require('./models/Customer');
const Driver = require('./models/Driver');
const Admin = require('./models/Admin');

const app = express();

// Middleware cấu hình
app.use(cors());
app.use(express.json());

// --- KHAI BÁO CÁC ENDPOINT THEO 3 PHẦN RÕ RÀNG ---

// [Phần 2]: Xác thực và Đăng nhập (Authentication)
// Các API sẽ có dạng: /api/auth/login, /api/auth/register
app.use('/api/auth', authRoutes);

// [Phần 3]: Xử lý nghiệp vụ chuyến đi và tính cước (Ride Services)
// Các API sẽ có dạng: /api/ride/estimate
app.use('/api/ride', rideRoutes);

// [Phần 1]: Chức năng quản trị và CRUD (Management)
// Các API sẽ có dạng: /api/manage/customers, /api/manage/drivers
app.use('/api/manage', managementRoutes);

// --- KẾT NỐI DATABASE VÀ CHẠY SERVER ---
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }) // 'alter: true' giúp cập nhật bảng nếu bạn thay đổi Model
    .then(() => {
        console.log("✅ Database connected & synchronized!");
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on: http://localhost:${PORT}`);
            console.log(`📌 Auth APIs: http://localhost:${PORT}/api/auth`);
            console.log(`📌 Ride APIs: http://localhost:${PORT}/api/ride`);
            console.log(`📌 Management APIs: http://localhost:${PORT}/api/manage`);
        });
    })
    .catch(err => {
        console.error("❌ Unable to connect to the database:", err);
    });