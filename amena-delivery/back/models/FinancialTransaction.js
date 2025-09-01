// models/FinancialTransaction.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancialTransaction = sequelize.define('FinancialTransaction', {
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
    wallet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'DEBIT', 'CREDIT', 'PENDING', 'COD_COLLECTION', 
        'DELIVERY_FEE', 'RETURN_FEE', 'WALLET_EMPTYING',
        'CLIENT_FUND_ADDITION', 'WITHDRAWAL'
      ),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false
    },
    package_id: {
      type: DataTypes.UUID,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    sequence_number: {
      type: DataTypes.INTEGER,
      autoIncrement: true
    },
    wallet_balance_before: {
      type: DataTypes.DECIMAL(10, 3)
    },
    wallet_balance_after: {
      type: DataTypes.DECIMAL(10, 3)
    },
    checksum: {
      type: DataTypes.STRING // Hash pour vérifier l'intégrité
    },
    completed_at: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSON // Données supplémentaires
    }
  });

  return FinancialTransaction;
};