const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reservationId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    contenu: { type: DataTypes.TEXT, allowNull: false },
    lu: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: 'messages',
    timestamps: true
});

module.exports = Message;