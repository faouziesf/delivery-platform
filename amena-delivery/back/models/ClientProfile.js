// models/ClientProfile.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientProfile = sequelize.define('ClientProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    shop_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fiscal_number: {
      type: DataTypes.STRING
    },
    business_sector: {
      type: DataTypes.STRING
    },
    identity_document: {
      type: DataTypes.TEXT // JSON pour stocker les documents
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    offer_delivery_price: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    offer_return_price: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    account_status: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'SUSPENDED'),
      defaultValue: 'PENDING'
    },
    verified_at: {
      type: DataTypes.DATE
    },
    verified_by_commercial_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });

  return ClientProfile;
};