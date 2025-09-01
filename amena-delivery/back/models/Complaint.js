const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Complaint = sequelize.define('Complaint', {
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
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'COD_CHANGE', 'DELIVERY_DELAY', 'RETURN_REQUEST',
        'RETURN_DELAY', 'RESCHEDULE', 'FOURTH_ATTEMPT', 'OTHER'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      defaultValue: 'OPEN'
    },
    commercial_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolution: {
      type: DataTypes.TEXT
    },
    urgent_priority: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resolved_at: {
      type: DataTypes.DATE
    }
  });

  return Complaint;
};