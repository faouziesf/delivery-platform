// src/pages/ClientWallet.tsx
import React from 'react';

const ClientWallet: React.FC = () => {
  return (
    <div>
      <h1>Wallet</h1>
      <p>Solde: 245.50 DT</p>
      {/* Historique */}
      <ul>
        <li>+50 DT - COD Colis #123</li>
      </ul>
    </div>
  );
};

export default ClientWallet;