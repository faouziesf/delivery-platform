// models/WithdrawalRequest.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: 0.001
      }
    },
    method: {
      type: DataTypes.ENUM('BANK_TRANSFER', 'CASH_DELIVERY'),
      allowNull: false
    },
    bank_details: {
      type: DataTypes.JSON // IBAN, bank name, etc.
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    commercial_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deliverer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    delivery_receipt_code: {
      type: DataTypes.STRING // Code-barres unique
    },
    processed_at: {
      type: DataTypes.DATE
    },
    notes: {
      type: DataTypes.TEXT
    }
  });

  return WithdrawalRequest;
};