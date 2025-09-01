// models/DeliveryAttempt.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeliveryAttempt = sequelize.define('DeliveryAttempt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    package_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    deliverer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    result: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'REFUSED', 'UNAVAILABLE'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    location_attempted: {
      type: DataTypes.JSON // GPS coordinates
    },
    attempt_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  return DeliveryAttempt;
};