//File chạy chính

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const apiRoutes = require('./routes/api');

const Customer = require('./models/Customer');
const Driver = require('./models/Driver');
const Admin = require('./models/Admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
    console.log("Database connected!");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});