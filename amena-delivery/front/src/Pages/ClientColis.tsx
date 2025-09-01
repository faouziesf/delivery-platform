// src/pages/ClientColis.tsx
import React from 'react';

const ClientColis: React.FC = () => {
  return (
    <div>
      <h1>Mes Colis</h1>
      {/* Mock list of colis */}
      <ul>
        <li>Colis #1 - En cours</li>
        <li>Colis #2 - Livré</li>
      </ul>
      <button>Créer Nouveau Colis</button>
    </div>
  );
};

export default ClientColis;