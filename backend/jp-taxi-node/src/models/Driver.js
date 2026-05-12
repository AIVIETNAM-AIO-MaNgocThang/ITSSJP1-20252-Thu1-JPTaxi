const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define('Driver', {
    driver_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    phone: DataTypes.STRING,
    license_number: DataTypes.STRING,
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 5.0 },
    status: { 
        type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'), 
        defaultValue: 'OFFLINE' 
    }
}, { tableName: 'driver', timestamps: false });

module.exports = Driver;