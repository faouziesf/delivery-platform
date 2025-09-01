// src/components/Sidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Login.css';

interface SidebarProps {
  role: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  let menuItems = [];

  if (role === 'client') {
    menuItems = [
      { path: '/dashboard', label: '📊 Dashboard' },
      { path: '/colis', label: '📦 Mes Colis [3]' },
      { path: '/wallet', label: '💰 Wallet' },
      { path: '/reclamations', label: '🚨 Réclamations [1]' },
      { path: '/retraits', label: '📤 Retraits' },
    ];
  } else if (role === 'livreur') {
    menuItems = [
      { path: '/pickups', label: '📦 Pickups Disponibles' },
      { path: '/mes-pickups', label: '📦 Mes Pickups' },
      { path: '/livraisons', label: '🚚 Livraisons' },
      { path: '/retours', label: '↩️ Retours' },
      { path: '/paiements', label: '💰 Paiements' },
      { path: '/wallet', label: '💰 Mon Wallet' },
    ];
  } else if (role === 'commercial') {
    menuItems = [
      { path: '/dashboard', label: '📊 Dashboard' },
      { path: '/clients', label: '👥 Clients' },
      { path: '/reclamations', label: '🚨 Réclam [7]' },
      { path: '/wallets', label: '💰 Wallets' },
      { path: '/retraits', label: '📤 Retraits' },
      { path: '/livreurs', label: '🚚 Livreurs' },
      { path: '/rapports', label: '📊 Rapports' },
    ];
  } else if (role === 'superviseur') {
    menuItems = [
      { path: '/dashboard', label: '📊 Dashboard' },
      // Add more
    ];
  }

  return (
    <aside className="sidebar">
      {menuItems.map((item) => (
        <Link key={item.path} to={item.path} className="menu-item">
          {item.label}
        </Link>
      ))}
    </aside>
  );
};

export default Sidebar;