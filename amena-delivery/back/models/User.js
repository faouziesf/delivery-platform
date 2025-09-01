// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('CLIENT', 'DELIVERER', 'COMMERCIAL', 'SUPERVISOR'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[0-9+\-\s()]+$/
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE
    },
    refresh_token: {
      type: DataTypes.TEXT
    }
  });

  // Hash password avant sauvegarde
  User.beforeCreate(async (user) => {
    if (user.password) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  });

  // Méthode pour vérifier le mot de passe
  User.prototype.checkPassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
