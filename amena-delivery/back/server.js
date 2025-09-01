// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import des modules personnalisés
const database = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const packageRoutes = require('./routes/packages');
const walletRoutes = require('./routes/wallets');
const complaintRoutes = require('./routes/complaints');
const delegationRoutes = require('./routes/delegations');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// ================================================
// MIDDLEWARES DE SÉCURITÉ
// ================================================

// Helmet pour sécuriser les headers HTTP
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting - Protection DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: {
        error: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite les tentatives de connexion
    message: {
        error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000', // React dev
            'http://localhost:5173', // Vite dev
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par la politique CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression des réponses
app.use(compression());

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Servir les fichiers statiques (uploads, reçus, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

// ================================================
// ROUTES API
// ================================================

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Routes d'authentification (avec rate limiting spécial)
app.use('/api/auth', authLimiter, authRoutes);

// Routes protégées
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/packages', authMiddleware, packageRoutes);
app.use('/api/wallets', authMiddleware, walletRoutes);
app.use('/api/complaints', authMiddleware, complaintRoutes);
app.use('/api/delegations', authMiddleware, delegationRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Route pour servir le frontend en production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'front', 'dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'front', 'dist', 'index.html'));
    });
}

// ================================================
// GESTION DES ERREURS
// ================================================

// Route 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method
    });
});

// Middleware de gestion d'erreurs global
app.use(errorHandler);

// ================================================
// DÉMARRAGE DU SERVEUR
// ================================================

async function startServer() {
    try {
        // Connexion à la base de données
        await database.connect();
        
        // Vérification/création du schéma de base
        if (process.env.AUTO_MIGRATE === 'true') {
            await database.migrate();
            await database.seed();
        }

        // Démarrage du serveur
        const server = app.listen(PORT, () => {
            console.log(`
🚀 Serveur Amena Delivery démarré avec succès !
📊 Port: ${PORT}
🌍 Environnement: ${process.env.NODE_ENV || 'development'}
🗄️  Base de données: ${database.isMySQL ? 'MySQL' : 'SQLite'}
📋 API Documentation: http://localhost:${PORT}/api/health
            `);
        });

        // Gestion gracieuse de l'arrêt
        process.on('SIGTERM', async () => {
            console.log('🛑 Arrêt du serveur en cours...');
            server.close(async () => {
                await database.close();
                console.log('✅ Serveur arrêté proprement');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('🛑 Interruption reçue, arrêt du serveur...');
            server.close(async () => {
                await database.close();
                console.log('✅ Serveur arrêté proprement');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    process.exit(1);
});

// Démarrage
if (require.main === module) {
    startServer();
}

module.exports = app;