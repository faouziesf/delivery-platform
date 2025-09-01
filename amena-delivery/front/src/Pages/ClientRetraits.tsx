// src/pages/ClientRetraits.tsx
import React from 'react';

const ClientRetraits: React.FC = () => {
  return (
    <div>
      <h1>Retraits</h1>
      <form>
        <label>Montant:</label>
        <input type="number" />
        <select>
          <option>Virement Bancaire</option>
          <option>Livraison Espèces</option>
        </select>
        <button>Soumettre</button>
      </form>
    </div>
  );
};

export default ClientRetraits;