const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const cron = require('node-cron');
const { processAutomaticPayments, recoverPendingTransactions } = require('./utils/automaticProcessing');

const PORT = process.env.PORT || 3001;

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    logger.info('✅ Connexion à la base de données établie');

    // Synchronisation des modèles (development uniquement)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Modèles synchronisés');
    }

    // Démarrage du serveur
    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      
      // Jobs automatiques
      setupCronJobs();
    });

  } catch (error) {
    logger.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
}

// Configuration des tâches automatiques
function setupCronJobs() {
  // Traitement automatique des paiements à 22h00 tous les jours
  cron.schedule('0 22 * * *', async () => {
    logger.info('🕙 Démarrage du traitement automatique 22h00');
    try {
      await processAutomaticPayments();
      logger.info('✅ Traitement automatique 22h00 terminé');
    } catch (error) {
      logger.error('❌ Erreur traitement automatique 22h00:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Tunis"
  });

  // Récupération des transactions en attente toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await recoverPendingTransactions();
    } catch (error) {
      logger.error('❌ Erreur récupération transactions:', error);
    }
  });

  logger.info('⏰ Jobs automatiques configurés');
}

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`📡 Signal ${signal} reçu, arrêt en cours...`);
  
  try {
    await sequelize.close();
    logger.info('✅ Connexion base de données fermée');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Rejection non gérée:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Démarrage
startServer();