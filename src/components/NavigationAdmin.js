import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItemsAdmin = [
  { path: '/admin/entreprises', icon: '🏢', label: 'Entreprises' },
  { path: '/admin/forfaits', icon: '📦', label: 'Forfaits' },
  { path: '/admin/templates', icon: '🎨', label: 'Templates' },
  { path: '/admin/tickets', icon: '🎫', label: 'Tickets' },
  { path: '/admin/corrections', icon: '🔧', label: 'Corrections' },
];

export default function NavigationAdmin({ children }) {
  const { deconnexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        width: '250px', background: '#004d5a', color: 'white',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{
          padding: '20px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>⚙️ SUPER ADMIN</div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
            E&T AUTOMATION
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 0' }}>
          {menuItemsAdmin.map(item => {
            const actif = location.pathname === item.path;
            return (
              <div key={item.path} onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 15px', cursor: 'pointer',
                  background: actif ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderLeft: actif ? '4px solid white' : '4px solid transparent'
                }}
                onMouseEnter={e => { if (!actif) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!actif) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div onClick={deconnexion} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '15px', cursor: 'pointer',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: '18px' }}>🚪</span>
          <span style={{ fontSize: '14px' }}>Déconnexion</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#d9e2e4', overflow: 'auto' }}>
        <div style={{ padding: '25px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}