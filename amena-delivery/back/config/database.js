// config/database.js
require('dotenv').config();

const config = {
  development: {
    dialect: 'sqlite',
    storage: './database/amena_delivery.db',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'amena_delivery',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: false, // Désactivé en production
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timezone: '+01:00' // Tunisie
    },
    timezone: '+01:00'
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = {
  ...config[environment],
  environment
};

// config/jwt.js
module.exports = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'amena_delivery_access_secret_2024',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'amena_delivery_refresh_secret_2024',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // Options de signature
  options: {
    issuer: 'amena-delivery',
    audience: 'amena-delivery-users',
    algorithm: 'HS256'
  }
};

// .env (exemple)
/*
NODE_ENV=development

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database Production (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=amena_delivery
DB_USER=root
DB_PASSWORD=yourpassword

# Logs
LOG_LEVEL=info
LOG_FILE=logs/amena-delivery.log

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Business Logic
COD_PROCESSING_TIME=22:00
AUTOMATIC_PAYMENT_TIMEZONE=Africa/Tunis
*/