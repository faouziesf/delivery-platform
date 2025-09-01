// middleware/auth.js
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const logger = require('../utils/logger');

// Vérification du token JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Token d\'accès requis',
                code: 'NO_TOKEN'
            });
        }

        // Vérification du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'amena-delivery-secret-key');
        
        // Récupération des informations utilisateur
        const user = await database.query(
            'SELECT id, email, role, name, phone, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user || user.length === 0) {
            return res.status(401).json({
                error: 'Utilisateur non trouvé',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user[0].is_active) {
            return res.status(401).json({
                error: 'Compte utilisateur désactivé',
                code: 'ACCOUNT_DISABLED'
            });
        }

        // Ajout des informations utilisateur à la requête
        req.user = {
            id: user[0].id,
            email: user[0].email,
            role: user[0].role,
            name: user[0].name,
            phone: user[0].phone
        };

        // Mise à jour de la dernière connexion
        await database.query(
            'UPDATE users SET last_login = ? WHERE id = ?',
            [new Date(), user[0].id]
        );

        // Log de l'action
        await logUserAction(req.user.id, req.user.role, 'TOKEN_VERIFIED', req);

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Token invalide',
                code: 'INVALID_TOKEN'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expiré',
                code: 'EXPIRED_TOKEN'
            });
        }

        logger.error('Erreur d\'authentification:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware de vérification des rôles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentification requise',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Privilèges insuffisants',
                code: 'INSUFFICIENT_PRIVILEGES',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
};

// Middleware pour vérifier les permissions spécifiques
const requirePermission = (permission) => {
    const rolePermissions = {
        SUPERVISOR: [
            'manage_users', 'manage_delegations', 'view_all_packages', 
            'modify_cod', 'manage_wallets', 'view_reports', 'system_admin'
        ],
        COMMERCIAL: [
            'create_clients', 'modify_cod', 'manage_complaints', 
            'manage_withdrawals', 'manage_deliverer_wallets', 'view_reports'
        ],
        DELIVERER: [
            'view_packages', 'update_package_status', 'scan_packages',
            'view_wallet', 'deliver_payments'
        ],
        CLIENT: [
            'create_packages', 'view_own_packages', 'create_complaints',
            'request_withdrawals', 'view_wallet'
        ]
    };

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentification requise',
                code: 'AUTH_REQUIRED'
            });
        }

        const userPermissions = rolePermissions[req.user.role] || [];
        
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                error: 'Permission non accordée',
                code: 'PERMISSION_DENIED',
                required: permission,
                role: req.user.role
            });
        }

        next();
    };
};

// Log des actions utilisateur
const logUserAction = async (userId, userRole, actionType, req, additionalData = {}) => {
    try {
        const logData = {
            user_id: userId,
            user_role: userRole,
            action_type: actionType,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent'),
            additional_data: JSON.stringify({
                url: req.originalUrl,
                method: req.method,
                ...additionalData
            })
        };

        await database.query(`
            INSERT INTO action_logs (user_id, user_role, action_type, ip_address, user_agent, additional_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [logData.user_id, logData.user_role, logData.action_type, 
            logData.ip_address, logData.user_agent, logData.additional_data]);

    } catch (error) {
        logger.error('Erreur lors du logging:', error);
    }
};

// Middleware pour vérifier si l'utilisateur peut accéder à un colis spécifique
const canAccessPackage = async (req, res, next) => {
    try {
        const packageId = req.params.id || req.params.packageId;
        const user = req.user;

        if (!packageId) {
            return res.status(400).json({
                error: 'ID du colis requis',
                code: 'PACKAGE_ID_REQUIRED'
            });
        }

        // Superviseur et Commercial ont accès à tous les colis
        if (['SUPERVISOR', 'COMMERCIAL'].includes(user.role)) {
            return next();
        }

        // Vérification pour Client et Livreur
        let query = '';
        let params = [];

        if (user.role === 'CLIENT') {
            query = 'SELECT id FROM packages WHERE id = ? AND sender_id = ?';
            params = [packageId, user.id];
        } else if (user.role === 'DELIVERER') {
            query = `
                SELECT p.id FROM packages p
                LEFT JOIN package_assignments pa ON p.id = pa.package_id
                WHERE p.id = ? AND (pa.deliverer_id = ? OR p.status = 'AVAILABLE')
            `;
            params = [packageId, user.id];
        }

        const result = await database.query(query, params);

        if (!result || result.length === 0) {
            return res.status(403).json({
                error: 'Accès non autorisé à ce colis',
                code: 'PACKAGE_ACCESS_DENIED'
            });
        }

        next();
    } catch (error) {
        logger.error('Erreur vérification accès colis:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Génération de token JWT
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'amena-delivery-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'amena-delivery',
        audience: 'amena-delivery-app'
    });
};

// Génération de refresh token
const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'amena-delivery-refresh-secret', {
        expiresIn: '7d',
        issuer: 'amena-delivery'
    });
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    canAccessPackage,
    logUserAction,
    generateToken,
    generateRefreshToken
};