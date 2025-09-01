// src/components/Navbar.tsx
import React from 'react';
import '../styles/Navbar.css';

interface NavbarProps {
  role: string;
}

const Navbar: React.FC<NavbarProps> = ({ role }) => {
  return (
    <nav className="navbar">
      <div className="logo">DeliveryApp</div>
      <div className="notifications">🔔 3</div>
      <div className="profile">👤 {role.charAt(0).toUpperCase() + role.slice(1)}</div>
    </nav>
  );
};

export default Navbar;