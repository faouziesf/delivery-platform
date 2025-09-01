// src/pages/LivreurLivraisons.tsx
import React from 'react';

const LivreurLivraisons: React.FC = () => {
  return (
    <div>
      <h1>Livraisons</h1>
      <div className="livraison-card">
        <p>Colis #1234 - Ahmed Boutique</p>
        <p>📍 Rue Habib, Tunis</p>
        <p>💰 COD: 45.00 DT</p>
        <button>Scan Livré</button>
        <button>Non Dispo</button>
        <button>Appeler Commercial</button>
      </div>
    </div>
  );
};

export default LivreurLivraisons;