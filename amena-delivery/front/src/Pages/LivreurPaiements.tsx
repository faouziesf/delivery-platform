// src/pages/LivreurPaiements.tsx
import React from 'react';

const LivreurPaiements: React.FC = () => {
  return (
    <div>
      <h1>Paiements Clients</h1>
      <div>
        <p>Client: Salma Gharbi</p>
        <p>📍 Avenue Bourguiba, Sfax</p>
        <p>💵 150.00 DT</p>
        <button>Imprimer Bon</button>
        <button>Scanner</button>
      </div>
    </div>
  );
};

export default LivreurPaiements;