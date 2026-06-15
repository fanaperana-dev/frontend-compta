import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ModuleProtege({ module, children }) {
  const { moduleActif } = useAuth();

  if (!moduleActif(module)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', padding: '40px'
      }}>
        <div style={{
          background: 'white', borderRadius: '12px',
          padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
          <h2 style={{ color: '#004d5a', marginBottom: '10px' }}>
            Fonctionnalité non disponible
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Vous n'avez pas souscrit à cette fonctionnalité.
            Veuillez contacter votre administrateur pour l'activer.
          </p>
          <div style={{
            background: '#e3f2fd', borderRadius: '8px',
            padding: '12px', fontSize: '13px', color: '#1565c0'
          }}>
            📧 Contactez votre administrateur pour plus d'informations.
          </div>
        </div>
      </div>
    );
  }

  return children;
}