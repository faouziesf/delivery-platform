const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    package_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipient_data: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { name, phone, address }
    },
    delegation_from: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'delegations',
        key: 'id'
      }
    },
    delegation_to: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'delegations',
        key: 'id'
      }
    },
    content_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cod_amount: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false
    },
    return_fee: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'CREATED', 'AVAILABLE', 'ACCEPTED', 'PICKED_UP',
        'DELIVERED', 'PAID', 'REFUSED', 'RETURNED', 
        'UNAVAILABLE', 'VERIFIED', 'CANCELLED'
      ),
      defaultValue: 'CREATED'
    },
    assigned_deliverer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    comments: {
      type: DataTypes.TEXT
    },
    delivery_attempts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    qr_code: {
      type: DataTypes.STRING // Généré automatiquement
    }
  });

  // Hook pour générer le code du colis
  Package.beforeCreate(async (package) => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    package.package_code = `PKG-${date}-${random}`;
  });

  return Package;
};
