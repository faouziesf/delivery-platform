const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PackageStatusHistory = sequelize.define('PackageStatusHistory', {
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
    previous_status: {
      type: DataTypes.STRING
    },
    new_status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    ip_address: {
      type: DataTypes.STRING
    },
    user_agent: {
      type: DataTypes.TEXT
    }
  });

  return PackageStatusHistory;
};
