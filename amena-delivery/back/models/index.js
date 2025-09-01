// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

// Import des modèles
const User = require('./User')(sequelize);
const ClientProfile = require('./ClientProfile')(sequelize);
const Delegation = require('./Delegation')(sequelize);
const Package = require('./Package')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const FinancialTransaction = require('./FinancialTransaction')(sequelize);
const PackageStatusHistory = require('./PackageStatusHistory')(sequelize);
const DeliveryAttempt = require('./DeliveryAttempt')(sequelize);
const Complaint = require('./Complaint')(sequelize);
const WithdrawalRequest = require('./WithdrawalRequest')(sequelize);
const ActionLog = require('./ActionLog')(sequelize);
const Notification = require('./Notification')(sequelize);

// Associations
// User associations
User.hasOne(ClientProfile, { foreignKey: 'user_id', as: 'clientProfile' });
User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
User.hasMany(Package, { foreignKey: 'sender_id', as: 'sentPackages' });
User.hasMany(FinancialTransaction, { foreignKey: 'user_id', as: 'transactions' });
User.hasMany(ActionLog, { foreignKey: 'user_id', as: 'actions' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// ClientProfile associations
ClientProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ClientProfile.belongsTo(User, { foreignKey: 'verified_by_commercial_id', as: 'verifiedBy' });
ClientProfile.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

// Delegation associations
Delegation.belongsTo(User, { foreignKey: 'created_by_supervisor_id', as: 'createdBy' });
Delegation.hasMany(Package, { foreignKey: 'delegation_from', as: 'packagesFrom' });
Delegation.hasMany(Package, { foreignKey: 'delegation_to', as: 'packagesTo' });

// Package associations
Package.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Package.belongsTo(User, { foreignKey: 'assigned_deliverer_id', as: 'assignedDeliverer' });
Package.belongsTo(Delegation, { foreignKey: 'delegation_from', as: 'fromDelegation' });
Package.belongsTo(Delegation, { foreignKey: 'delegation_to', as: 'toDelegation' });
Package.hasMany(PackageStatusHistory, { foreignKey: 'package_id', as: 'statusHistory' });
Package.hasMany(DeliveryAttempt, { foreignKey: 'package_id', as: 'deliveryAttempts' });
Package.hasMany(Complaint, { foreignKey: 'package_id', as: 'complaints' });
Package.hasMany(FinancialTransaction, { foreignKey: 'package_id', as: 'transactions' });

// Wallet associations
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Wallet.hasMany(FinancialTransaction, { foreignKey: 'wallet_id', as: 'transactions' });

// FinancialTransaction associations
FinancialTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
FinancialTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
FinancialTransaction.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// PackageStatusHistory associations
PackageStatusHistory.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
PackageStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

// DeliveryAttempt associations
DeliveryAttempt.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
DeliveryAttempt.belongsTo(User, { foreignKey: 'deliverer_id', as: 'deliverer' });

// Complaint associations
Complaint.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Complaint.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Complaint.belongsTo(User, { foreignKey: 'commercial_id', as: 'commercial' });

// WithdrawalRequest associations
WithdrawalRequest.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'commercial_id', as: 'commercial' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'deliverer_id', as: 'deliverer' });

// ActionLog associations
ActionLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  ClientProfile,
  Delegation,
  Package,
  Wallet,
  FinancialTransaction,
  PackageStatusHistory,
  DeliveryAttempt,
  Complaint,
  WithdrawalRequest,
  ActionLog,
  Notification
};
