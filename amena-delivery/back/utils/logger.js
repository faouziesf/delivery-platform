// utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Création du dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration des formats de log
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        if (stack) {
            return `${timestamp} [${level}] ${message}\n${stack}`;
        }
        return `${timestamp} [${level}] ${message}`;
    })
);

// Configuration du logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'amena-delivery-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 10,
            tailable: true
        }),

        // Fichier spécifique pour les erreurs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5,
            tailable: true
        }),

        // Fichier pour les transactions financières (audit)
        new winston.transports.File({
            filename: path.join(logsDir, 'financial.log'),
            level: 'info',
            maxsize: 100 * 1024 * 1024, // 100MB
            maxFiles: 20,
            tailable: true
        })
    ]
});

// Ajout de la console en développement
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Logger spécialisé pour les transactions financières
const financialLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'amena-delivery-financial',
        type: 'financial_transaction'
    },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'financial.log'),
            maxsize: 100 * 1024 * 1024, // 100MB
            maxFiles: 50, // Conservation longue pour audit
            tailable: true
        })
    ]
});

// Logger pour les actions utilisateur (audit de sécurité)
const auditLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'amena-delivery-audit',
        type: 'user_action'
    },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            maxsize: 100 * 1024 * 1024, // 100MB
            maxFiles: 30,
            tailable: true
        })
    ]
});

// Stream pour Morgan (logging des requêtes HTTP)
const stream = {
    write: (message) => {
        logger.info(message.trim(), { type: 'http_request' });
    }
};

// Fonctions utilitaires
const logFinancialTransaction = (transactionData) => {
    financialLogger.info('Transaction financière', {
        ...transactionData,
        timestamp: new Date().toISOString()
    });
};

const logUserAction = (actionData) => {
    auditLogger.info('Action utilisateur', {
        ...actionData,
        timestamp: new Date().toISOString()
    });
};

const logSecurityEvent = (eventData) => {
    logger.warn('Événement de sécurité', {
        ...eventData,
        timestamp: new Date().toISOString(),
        type: 'security_event'
    });
};

const logSystemError = (error, context = {}) => {
    logger.error('Erreur système', {
        message: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
        type: 'system_error'
    });
};

const logRecoveryAttempt = (recoveryData) => {
    logger.warn('Tentative de récupération', {
        ...recoveryData,
        timestamp: new Date().toISOString(),
        type: 'recovery_attempt'
    });
};

// Méthodes de notification pour erreurs critiques
const notifyCriticalError = (error, context = {}) => {
    logSystemError(error, { ...context, severity: 'critical' });
    
    // En production, on pourrait envoyer une notification Slack, email, etc.
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implémenter notification d'urgence
        console.error('🚨 ERREUR CRITIQUE:', error.message);
    }
};

// Nettoyage automatique des anciens logs
const cleanupLogs = () => {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    const now = Date.now();
    
    fs.readdir(logsDir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            logger.info(`Ancien fichier de log supprimé: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// Nettoyage automatique quotidien
if (process.env.NODE_ENV === 'production') {
    setInterval(cleanupLogs, 24 * 60 * 60 * 1000); // 24h
}

module.exports = {
    logger,
    financialLogger,
    auditLogger,
    stream,
    logFinancialTransaction,
    logUserAction,
    logSecurityEvent,
    logSystemError,
    logRecoveryAttempt,
    notifyCriticalError
};