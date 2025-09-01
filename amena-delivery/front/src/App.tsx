// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/SideBar';
import ClientDashboard from './pages/ClientDashbord';
import ClientColis from './pages/ClientColis';
import ClientWallet from './pages/ClientWallet';
import ClientReclamations from './pages/ClientReclamations';
import ClientRetraits from './pages/ClientRetraits';
import LivreurPickups from './pages/LivreurPickups';
import LivreurMesPickups from './pages/LivreurMesPickups';
import LivreurLivraisons from './pages/LivreurLivraisons';
import LivreurRetours from './pages/LivreurRetours';
import LivreurPaiements from './pages/LivreurPaiements';
import LivreurWallet from './pages/LivreurWallet';
import CommercialClients from './pages/CommercialClients';
import CommercialReclamations from './pages/CommercialReclamations';
import CommercialWallets from './pages/CommercialWallets';
import CommercialRetraits from './pages/CommercialRetraits';
import CommercialLivreurs from './pages/CommercialLivreurs';
import CommercialRapports from './pages/CommercialRapports';
import SuperviseurDashboard from './pages/SuperviseurDashboard';
import Login from './Pages/Login';

const App: React.FC = () => {
  const [role, setRole] = useState<string | null>(null); // 'client', 'livreur', 'commercial', 'superviseur'

  if (!role) {
    return <Login onLogin={setRole} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar role={role} />
        <div className="content">
          <Sidebar role={role} />
          <main>
            <Routes>
              {/* Client Routes */}
              {role === 'client' && (
                <>
                  <Route path="/dashboard" element={<ClientDashboard />} />
                  <Route path="/colis" element={<ClientColis />} />
                  <Route path="/wallet" element={<ClientWallet />} />
                  <Route path="/reclamations" element={<ClientReclamations />} />
                  <Route path="/retraits" element={<ClientRetraits />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}

              {/* Livreur Routes */}
              {role === 'livreur' && (
                <>
                  <Route path="/pickups" element={<LivreurPickups />} />
                  <Route path="/mes-pickups" element={<LivreurMesPickups />} />
                  <Route path="/livraisons" element={<LivreurLivraisons />} />
                  <Route path="/retours" element={<LivreurRetours />} />
                  <Route path="/paiements" element={<LivreurPaiements />} />
                  <Route path="/wallet" element={<LivreurWallet />} />
                  <Route path="*" element={<Navigate to="/pickups" />} />
                </>
              )}

              {/* Commercial Routes */}
              {role === 'commercial' && (
                <>
                  <Route path="/dashboard" element={<ClientDashboard />} /> {/* Reuse or custom */}
                  <Route path="/clients" element={<CommercialClients />} />
                  <Route path="/reclamations" element={<CommercialReclamations />} />
                  <Route path="/wallets" element={<CommercialWallets />} />
                  <Route path="/retraits" element={<CommercialRetraits />} />
                  <Route path="/livreurs" element={<CommercialLivreurs />} />
                  <Route path="/rapports" element={<CommercialRapports />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}

              {/* Superviseur Routes */}
              {role === 'superviseur' && (
                <>
                  <Route path="/dashboard" element={<SuperviseurDashboard />} />
                  {/* Add more as needed, can access all */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;