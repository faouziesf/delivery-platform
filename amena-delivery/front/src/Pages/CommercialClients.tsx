// src/pages/CommercialClients.tsx
import React from 'react';

const CommercialClients: React.FC = () => {
  return (
    <div>
      <h1>Nouveau Client</h1>
      <form>
        <label>Nom:</label><input />
        <label>Entreprise:</label><input />
        <label>Fiscal:</label><input />
        <label>CIN:</label><input />
        <label>Livré DT:</label><input />
        <label>Retour DT:</label><input />
        <button>Upload Docs</button>
        <button>Créer Compte</button>
      </form>
    </div>
  );
};

export default CommercialClients;