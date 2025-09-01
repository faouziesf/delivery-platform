// middleware/roleCheck.js
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Permissions insuffisantes',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

const checkOwnership = (resourceField = 'user_id') => {
  return (req, res, next) => {
    // Pour les superviseurs, bypass la vérification de propriété
    if (req.user.role === 'SUPERVISOR') {
      return next();
    }

    // Pour les commerciaux, accès aux ressources qu'ils gèrent
    if (req.user.role === 'COMMERCIAL') {
      // Logique spécifique selon le contexte
      return next();
    }

    // Pour les autres, vérifier la propriété
    const resourceUserId = req.body[resourceField] || req.params[resourceField] || req.query[resourceField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Ressource non autorisée'
      });
    }

    next();
  };
};

module.exports = { checkRole, checkOwnership };