import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArivotekIcon from './ArivotekIcon';

const menuItems = [
  { path: '/dashboard', icon: '📈', label: 'Dashboard', module: 'dashboard' },
  { path: '/clients', icon: '🧑‍💼', label: 'Clients', module: 'factures' },
  { path: '/paiements', icon: '💵', label: 'Paiements', module: 'factures' },
  { path: '/fournisseurs', icon: '🏢', label: 'Fournisseurs', module: 'fournisseurs' },
  { path: '/comptabilite/compte-courant', icon: '🤝', label: 'Compte courant associés', module: 'comptabilite' },
  { path: '/stocks', icon: '📦', label: 'Stocks', module: 'stocks' },
  { path: '/immobilisations', icon: '🏗️', label: 'Immobilisations', module: 'immobilisations' },
  { path: '/rh', icon: '🧑‍🤝‍🧑', label: 'Ressources Humaines', module: 'rh' },
  { path: '/journal', icon: '🔢', label: 'Journal', module: 'journal' },
  { path: '/comptabilite/resultat', icon: '📑', label: 'Compte de résultat', module: 'comptabilite' },
  { path: '/comptabilite/resultat-fonction', icon: '🧮', label: 'Résultat par fonction', module: 'comptabilite' },
  { path: '/comptabilite/flux-tresorerie', icon: '💹', label: 'Flux de trésorerie', module: 'comptabilite' },
  { path: '/comptabilite/bilan', icon: '⚖️', label: 'Bilan', module: 'comptabilite' },
  { path: '/comptabilite/grand-livre', icon: '📒', label: 'Grand Livre', module: 'comptabilite' },
  { path: '/profil', icon: '⚙️', label: 'Mon profil', module: null },
  
];
const menuItemsAdmin = [
  { path: '/admin/entreprises', icon: '🏢', label: 'Entreprises' },
  { path: '/admin/forfaits', icon: '📦', label: 'Forfaits' },
  
];

export default function Navigation({ children }) {
  const { entreprise, deconnexion, moduleActif, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(true);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>

      {/* Menu latéral */}
      <div style={{
        width: menuOuvert ? '250px' : '60px',
        background: '#004d5a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        overflow: 'hidden',
        flexShrink: 0
      }}>

        {/* Logo */}
        <div style={{
          padding: '20px 15px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'white',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ArivotekIcon variant="symbol" height={24} />
        </div>
        {menuOuvert && (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '19px' }}>
             ARIVOTEK
          </div>
          <div style={{
             fontSize: '11px',
             opacity: 0.7,
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             whiteSpace: 'nowrap',
             maxWidth: '170px'
           }}>
             by E&T Automatisation
          </div>
        </div>
        )}
       </div>

        {/* Bouton réduire menu */}
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '10px 15px',
            cursor: 'pointer',
            textAlign: menuOuvert ? 'right' : 'center',
            fontSize: '16px'
          }}
        >
          {menuOuvert ? '◀' : '▶'}
        </button>

        {/* Items du menu */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {menuItems.map(item => {
            if (item.module && !moduleActif(item.module)) return null;

            const actif = location.pathname === item.path;

            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 15px',
                  cursor: 'pointer',
                  background: actif
                    ? 'rgba(255,255,255,0.2)'
                    : 'transparent',
                  borderLeft: actif
                    ? '4px solid white'
                    : '4px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  if (!actif) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={e => {
                  if (!actif) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {menuOuvert && (
                  <span style={{ fontSize: '14px' }}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
          {isAdmin && (
            <>
              <div style={{
                padding: '15px 15px 5px 15px',
                fontSize: '11px',
                opacity: 0.6,
                textTransform: 'uppercase',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginTop: '10px'
           }}>
                {menuOuvert && 'Administration'}
              </div>
              {menuItemsAdmin.map(item => {
                const actif = location.pathname === item.path;
                return (
                 <div
                   key={item.path}
                   onClick={() => navigate(item.path)}
                   style={{
                     display: 'flex', alignItems: 'center', gap: '12px',
                     padding: '12px 15px', cursor: 'pointer',
                     background: actif ? 'rgba(255,255,255,0.2)' : 'transparent',
                     borderLeft: actif ? '4px solid white' : '4px solid transparent',
                     transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => { if (!actif) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!actif) e.currentTarget.style.background = 'transparent'; }}
             >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                {menuOuvert && <span style={{ fontSize: '14px' }}>{item.label}</span>}
               </div>
            );
          })}
          </>
         )}
        </nav>
        

        {/* Déconnexion */}
        <div
          onClick={deconnexion}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px',
            cursor: 'pointer',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>🚪</span>
          {menuOuvert && (
            <span style={{ fontSize: '14px' }}>Déconnexion</span>
          )}
        </div>

      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#d9e2e4',
        overflow: 'auto'
      }}>

        {/* Barre du haut */}
        <div style={{
          background: 'white',
          padding: '15px 25px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            margin: 0,
            color: '#004d5a',
            fontSize: '18px'
          }}>
            {menuItems.find(m => m.path === location.pathname)?.label || 'E&T Automation'}
          </h2>
          <div style={{
            fontSize: '14px',
            color: '#666'
          }}>
            👋 {entreprise?.nom}
          </div>
        </div>

        {/* Contenu de la page */}
        <div style={{ padding: '25px', flex: 1 }}>
          {children}
        </div>

      </div>
    </div>
  );
}