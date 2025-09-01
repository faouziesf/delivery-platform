// models/Wallet.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    balance: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    pending_amount: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    last_transaction_id: {
      type: DataTypes.UUID,
      references: {
        model: 'financial_transactions',
        key: 'id'
      }
    },
    last_emptied_at: {
      type: DataTypes.DATE // Pour les livreurs
    },
    last_emptied_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });

  return Wallet;
};
