// middleware/errorHandler.js
const { logSystemError, notifyCriticalError } = require('../utils/logger');

// Types d'erreurs personnalisées
class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.field = field;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Non authentifié') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Non autorisé') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Ressource non trouvée') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

class BusinessLogicError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'BusinessLogicError';
        this.statusCode = 422;
        this.code = code;
    }
}

class FinancialTransactionError extends Error {
    constructor(message, transactionId = null) {
        super(message);
        this.name = 'FinancialTransactionError';
        this.statusCode = 500;
        this.transactionId = transactionId;
        this.critical = true;
    }
}

// Middleware principal de gestion d'erreurs
const errorHandler = (error, req, res, next) => {
    // Extraction des informations d'erreur
    const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
        timestamp: new Date().toISOString()
    };

    // Détermination du code de statut
    let statusCode = error.statusCode || 500;
    let errorResponse = {
        error: error.message || 'Erreur interne du serveur',
        code: error.code || error.name || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    };

    // Gestion spécifique par type d'erreur
    switch (error.name) {
        case 'ValidationError':
            statusCode = 400;
            errorResponse = {
                error: 'Erreur de validation',
                message: error.message,
                field: error.field,
                code: 'VALIDATION_ERROR'
            };
            logSystemError(error, { ...errorInfo, severity: 'low' });
            break;

        case 'AuthenticationError':
        case 'JsonWebTokenError':
        case 'TokenExpiredError':
            statusCode = 401;
            errorResponse = {
                error: 'Erreur d\'authentification',
                message: error.message,
                code: 'AUTH_ERROR'
            };
            logSystemError(error, { ...errorInfo, severity: 'medium' });
            break;

        case 'AuthorizationError':
            statusCode = 403;
            errorResponse = {
                error: 'Accès non autorisé',
                message: error.message,
                code: 'ACCESS_DENIED'
            };
            logSystemError(error, { ...errorInfo, severity: 'medium' });
            break;

        case 'NotFoundError':
            statusCode = 404;
            errorResponse = {
                error: 'Ressource non trouvée',
                message: error.message,
                code: 'NOT_FOUND'
            };
            logSystemError(error, { ...errorInfo, severity: 'low' });
            break;

        case 'ConflictError':
            statusCode = 409;
            errorResponse = {
                error: 'Conflit de données',
                message: error.message,
                code: 'DATA_CONFLICT'
            };
            logSystemError(error, { ...errorInfo, severity: 'medium' });
            break;

        case 'BusinessLogicError':
            statusCode = 422;
            errorResponse = {
                error: 'Erreur de logique métier',
                message: error.message,
                code: error.code || 'BUSINESS_LOGIC_ERROR'
            };
            logSystemError(error, { ...errorInfo, severity: 'medium' });
            break;

        case 'FinancialTransactionError':
            statusCode = 500;
            errorResponse = {
                error: 'Erreur de transaction financière',
                message: 'Une erreur critique est survenue lors de la transaction',
                code: 'FINANCIAL_ERROR',
                transactionId: error.transactionId
            };
            notifyCriticalError(error, { ...errorInfo, severity: 'critical' });
            break;

        // Erreurs de base de données
        case 'SQLITE_CONSTRAINT':
        case 'ER_DUP_ENTRY':
            statusCode = 409;
            errorResponse = {
                error: 'Contrainte de base de données violée',
                message: 'Cette opération viole une contrainte de données',
                code: 'DB_CONSTRAINT_VIOLATION'
            };
            logSystemError(error, { ...errorInfo, severity: 'medium' });
            break;

        case 'SQLITE_BUSY':
        case 'ER_LOCK_WAIT_TIMEOUT':
            statusCode = 503;
            errorResponse = {
                error: 'Service temporairement indisponible',
                message: 'Réessayez dans quelques instants',
                code: 'SERVICE_BUSY'
            };
            logSystemError(error, { ...errorInfo, severity: 'high' });
            break;

        // Erreurs multer (upload de fichiers)
        case 'MulterError':
            statusCode = 400;
            let multerMessage = 'Erreur lors de l\'upload';
            if (error.code === 'LIMIT_FILE_SIZE') {
                multerMessage = 'Fichier trop volumineux';
            } else if (error.code === 'LIMIT_FILE_COUNT') {
                multerMessage = 'Trop de fichiers';
            }
            errorResponse = {
                error: multerMessage,
                code: error.code
            };
            logSystemError(error, { ...errorInfo, severity: 'low' });
            break;

        // Erreur par défaut
        default:
            statusCode = 500;
            errorResponse = {
                error: 'Erreur interne du serveur',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur inattendue est survenue',
                code: 'INTERNAL_ERROR'
            };
            
            // Log critique pour erreurs inconnues
            notifyCriticalError(error, { ...errorInfo, severity: 'critical' });
            break;
    }

    // Ajout d'informations de debug en développement
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = errorInfo;
    }

    // Envoi de la réponse
    res.status(statusCode).json(errorResponse);
};

// Wrapper pour les fonctions async (évite try/catch répétitifs)
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Fonction pour créer des erreurs de validation
const createValidationError = (message, field = null) => {
    return new ValidationError(message, field);
};

// Fonction pour valider les données d'entrée
const validateInput = (data, schema) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Vérification required
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push({ field, message: `${field} est requis` });
            continue;
        }

        // Si la valeur est vide et non requise, on passe
        if (!value && !rules.required) continue;

        // Vérification type
        if (rules.type) {
            const expectedType = rules.type;
            const actualType = typeof value;
            
            if (expectedType === 'number' && isNaN(Number(value))) {
                errors.push({ field, message: `${field} doit être un nombre` });
                continue;
            }
            
            if (expectedType !== 'number' && actualType !== expectedType) {
                errors.push({ field, message: `${field} doit être de type ${expectedType}` });
                continue;
            }
        }

        // Vérification longueur
        if (rules.minLength && value.length < rules.minLength) {
            errors.push({ field, message: `${field} doit contenir au moins ${rules.minLength} caractères` });
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push({ field, message: `${field} ne peut pas dépasser ${rules.maxLength} caractères` });
        }

        // Vérification regex
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({ field, message: rules.message || `${field} n'a pas le format requis` });
        }

        // Vérification valeurs autorisées
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push({ field, message: `${field} doit être l'une des valeurs: ${rules.enum.join(', ')}` });
        }
    }

    if (errors.length > 0) {
        const error = new ValidationError('Erreurs de validation');
        error.fields = errors;
        throw error;
    }
};

module.exports = {
    errorHandler,
    asyncHandler,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    BusinessLogicError,
    FinancialTransactionError,
    createValidationError,
    validateInput
};