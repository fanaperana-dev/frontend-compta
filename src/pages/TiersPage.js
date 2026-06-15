import React, { useState } from 'react';
import ListeTiers from './ListeTiers';
import FacturesTiers from './FacturesTiers';

export default function TiersPage() {
  const [ongletActif, setOngletActif] = useState('liste');

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        {[
          { id: 'liste', label: '🏢 Liste tiers' },
          { id: 'factures', label: '📄 Factures tiers' }
        ].map(onglet => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: ongletActif === onglet.id
                ? '3px solid #004d5a'
                : '3px solid transparent',
              background: 'transparent',
              color: ongletActif === onglet.id ? '#004d5a' : '#666',
              fontWeight: ongletActif === onglet.id ? 'bold' : 'normal',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>
      {ongletActif === 'liste' && <ListeTiers />}
      {ongletActif === 'factures' && <FacturesTiers />}
    </div>
  );
}