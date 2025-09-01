// src/pages/ClientDashboard.tsx
import React from 'react';
import '../Styles/ClientDashbord.css';

const ClientDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>👋 Bonjour Ahmed</h1>
      <p>💰 Wallet: 245.50</p>
      <p>⏳ Attente: 89.00</p>
      <p>📦 Cours: 3</p>
      <p>✅ Livrés: 12</p>
      <button>Nouveau Colis</button>
    </div>
  );
};

export default ClientDashboard;