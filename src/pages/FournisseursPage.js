import React, { useState } from 'react';
import ListeFournisseurs from './ListeFournisseurs';
import FacturesFournisseurs from './FacturesFournisseurs';

export default function FournisseursPage() {
  const [ongletActif, setOngletActif] = useState('liste');

  return (
    <div>
      {/* Onglets */}
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        {[
          { id: 'liste', label: '🏭 Liste fournisseurs' },
          { id: 'factures', label: '📄 Factures fournisseurs' }
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

      {/* Contenu */}
      {ongletActif === 'liste' && <ListeFournisseurs />}
      {ongletActif === 'factures' && <FacturesFournisseurs />}
    </div>
  );
}