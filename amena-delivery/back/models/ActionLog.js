// models/ActionLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActionLog = sequelize.define('ActionLog', {
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
    user_role: {
      type: DataTypes.ENUM('CLIENT', 'DELIVERER', 'COMMERCIAL', 'SUPERVISOR'),
      allowNull: false
    },
    action_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING // 'PACKAGE', 'USER', 'WALLET', etc.
    },
    target_id: {
      type: DataTypes.UUID
    },
    old_value: {
      type: DataTypes.JSON
    },
    new_value: {
      type: DataTypes.JSON
    },
    ip_address: {
      type: DataTypes.STRING
    },
    user_agent: {
      type: DataTypes.TEXT
    },
    additional_data: {
      type: DataTypes.JSON
    }
  });

  return ActionLog;
};