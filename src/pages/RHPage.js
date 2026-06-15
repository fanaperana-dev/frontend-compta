import React, { useState } from 'react';
import ListeSalaries from './rh/ListeSalaries';
import ListeFichesPaie from './rh/ListeFichesPaie';
import OngletCotisation from './rh/OngletCotisation';
import SoldeToutCompte from './rh/SoldeToutCompte';

export default function RHPage() {
  const [ongletActif, setOngletActif] = useState('salaries');

  const onglets = [
    { id: 'salaries', label: '👥 Liste salariés' },
    { id: 'fiches', label: '📋 Fiches de paie' },
    { id: 'irsa', label: '💰 IRSA' },
    { id: 'cnaps', label: '🏦 CNAPS' },
    { id: 'ostie', label: '🏥 OSTIE' },
    { id: 'stc', label: '🚪 Solde tout compte' }
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0',
        overflowX: 'auto'
      }}>
        {onglets.map(onglet => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: ongletActif === onglet.id
                ? '3px solid #004d5a'
                : '3px solid transparent',
              background: 'transparent',
              color: ongletActif === onglet.id ? '#004d5a' : '#666',
              fontWeight: ongletActif === onglet.id ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {ongletActif === 'salaries' && <ListeSalaries />}
      {ongletActif === 'fiches' && <ListeFichesPaie />}
      {ongletActif === 'irsa' && <OngletCotisation type="IRSA" />}
      {ongletActif === 'cnaps' && <OngletCotisation type="CNAPS" />}
      {ongletActif === 'ostie' && <OngletCotisation type="OSTIE" />}
      {ongletActif === 'stc' && <SoldeToutCompte />}
    </div>
  );
}