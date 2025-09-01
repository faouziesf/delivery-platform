// src/pages/Login.tsx
import React, { useState } from 'react';
import '../styles/Login.css';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (selectedRole) {
      setIsLoading(true);
      // Simulation d'une requête de connexion
      await new Promise(resolve => setTimeout(resolve, 1000));
      onLogin(selectedRole);
      setIsLoading(false);
    }
  };

  const roles = [
    { 
      value: 'client', 
      label: 'Client', 
      icon: '👤',
      description: 'Accès client'
    },
    { 
      value: 'livreur', 
      label: 'Livreur', 
      icon: '🚚',
      description: 'Interface livraison'
    },
    { 
      value: 'commercial', 
      label: 'Commercial', 
      icon: '💼',
      description: 'Gestion commerciale'
    },
    { 
      value: 'superviseur', 
      label: 'Superviseur', 
      icon: '👨‍💼',
      description: 'Administration'
    }
  ];

  return (
    <div className="login-container">
      {/* Éléments décoratifs de fond */}
      <div className="background-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-card">
        {/* En-tête avec logo */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">Sélectionnez votre rôle pour continuer</p>
        </div>

        {/* Sélection des rôles */}
        <div className="role-selection">
          <label className="role-label">Choisissez votre rôle</label>
          <div className="roles-grid">
            {roles.map((role) => (
              <div
                key={role.value}
                className={`role-card ${selectedRole === role.value ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.value)}
              >
                <div className="role-icon">{role.icon}</div>
                <div className="role-info">
                  <div className="role-name">{role.label}</div>
                  <div className="role-desc">{role.description}</div>
                </div>
                {selectedRole === role.value && (
                  <div className="selected-indicator">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de connexion */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || isLoading}
          className={`login-button ${selectedRole && !isLoading ? 'enabled' : 'disabled'}`}
        >
          {isLoading ? (
            <div className="login-loading">
              <div className="spinner"></div>
              <span>Connexion en cours...</span>
            </div>
          ) : (
            <div className="login-content">
              <span>Se connecter</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </button>

        {/* Pied de page */}
        <div className="login-footer">
          <p>
            Besoin d'aide ? 
            <a href="#" className="support-link">Contactez le support</a>
          </p>
        </div>
      </div>

      {/* Badge de sécurité */}
      <div className="security-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Connexion sécurisée SSL</span>
      </div>
    </div>
  );
};

export default Login;