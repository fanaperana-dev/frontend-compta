import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { comptabiliteService } from '../services/api';

const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold'
  },
  boutonSecondaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  }
};

function LigneFlux({ label, montant, niveau = 0, gras = false, couleur = null, sousTitre = false, total = false }) {
  return (
    <tr style={{
      background: total ? '#004d5a' : sousTitre ? '#f5f5f5' : 'white',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <td style={{
        padding: '8px 12px',
        paddingLeft: `${12 + niveau * 20}px`,
        fontSize: '13px',
        fontWeight: gras || sousTitre || total ? 'bold' : 'normal',
        color: total ? 'white' : sousTitre ? '#004d5a' : '#333'
      }}>
        {label}
      </td>
      <td style={{
        padding: '8px 12px', textAlign: 'right', fontSize: '13px',
        fontWeight: gras || total ? 'bold' : 'normal',
        color: total ? 'white' : couleur || (montant < 0 ? '#c62828' : montant > 0 ? '#2e7d32' : '#333')
      }}>
        {montant !== undefined && montant !== null
          ? `${montant >= 0 ? '+' : ''}${Number(montant).toLocaleString('fr-FR')} Ar`
          : ''}
      </td>
    </tr>
  );
}

export default function FluxTresoreriePage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [flux, setFlux] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tresorerieOuverture, setTresorerieOuverture] = useState(0);
  const [editOuverture, setEditOuverture] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getFluxTresorerie(entreprise.id, annee);
      setFlux(res.data);
      setTresorerieOuverture(res.data.tresorerie_ouverture || 0);
    } catch (err) {
      toast.error('Erreur chargement flux de trésorerie.');
    } finally {
      setLoading(false);
    }
  }

  async function exporterPDF() {
  setExportEnCours(true);
  try {
    const res = await comptabiliteService.exportPDFFluxTresorerie(entreprise.id, annee);
    window.open(res.data.url, '_blank');
    toast.success('PDF généré !');
  } catch (err) {
    toast.error('Erreur génération PDF.');
  } finally {
    setExportEnCours(false);
  }
}

  async function sauvegarderOuverture() {
    setEnCours(true);
    try {
      await comptabiliteService.saveTresorerieOuverture({
        entreprise_id: entreprise.id,
        annee,
        montant: tresorerieOuverture
      });
      toast.success('Trésorerie d\'ouverture enregistrée !');
      setEditOuverture(false);
      charger();
    } catch (err) {
      toast.error('Erreur enregistrement.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>💰 Tableau des flux de trésorerie</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...styles.input, width: '120px' }}
            value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button style={{ ...styles.boutonSecondaire, opacity: exportEnCours ? 0.6 : 1 }}
            disabled={exportEnCours} onClick={exporterPDF}>
            {exportEnCours ? '⏳ Génération...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Trésorerie ouverture */}
      <div style={{ ...styles.card, borderLeft: '4px solid #1565c0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Trésorerie d'ouverture (01/01/{annee})
            </div>
            {!editOuverture ? (
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>
                {Number(tresorerieOuverture).toLocaleString('fr-FR')} Ar
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                <input style={{ ...styles.input, width: '200px' }}
                  type="number"
                  value={tresorerieOuverture}
                  onChange={e => setTresorerieOuverture(Number(e.target.value))} />
                <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
                  disabled={enCours} onClick={sauvegarderOuverture}>
                  {enCours ? '⏳...' : '💾 Enregistrer'}
                </button>
                <button style={styles.boutonSecondaire}
                  onClick={() => setEditOuverture(false)}>
                  Annuler
                </button>
              </div>
            )}
          </div>
          {!editOuverture && (
            <button style={styles.boutonSecondaire}
              onClick={() => setEditOuverture(true)}>
              ✏️ Modifier
            </button>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
          ℹ️ Saisissez le solde de trésorerie au 1er janvier {annee}
          (correspond à la clôture {annee - 1})
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          ⏳ Chargement...
        </div>
      ) : flux && (
        <>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              Tableau des flux de trésorerie — Exercice {annee}
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px' }}>
                    Libellé
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>
                    Montant (Ar)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* FLUX OPÉRATIONNELS */}
                <LigneFlux label="I. FLUX DE TRÉSORERIE OPÉRATIONNELS" sousTitre />
                <LigneFlux label="Encaissements clients"
                  montant={flux.flux_operationnels.encaissements_clients}
                  niveau={1} couleur="#2e7d32" />
                {flux.flux_operationnels.recettes_tiers > 0 && (
                  <LigneFlux label="Recettes diverses (tiers)"
                    montant={flux.flux_operationnels.recettes_tiers}
                    niveau={1} couleur="#2e7d32" />
                )}
                <LigneFlux label="Paiements fournisseurs"
                  montant={-flux.flux_operationnels.paiements_fournisseurs}
                  niveau={1} />
                <LigneFlux label="Paiements charges externes (tiers)"
                  montant={-flux.flux_operationnels.paiements_tiers}
                  niveau={1} />
                <LigneFlux label="Paiements salaires et charges sociales"
                  montant={-flux.flux_operationnels.paiements_salaires}
                  niveau={1} />
                <LigneFlux label={`Impôts payés (${flux.regime_fiscal})`}
                  montant={-flux.flux_operationnels.impots_payes}
                  niveau={1} />
                <LigneFlux label="FLUX NETS OPÉRATIONNELS"
                  montant={flux.flux_operationnels.total}
                  gras
                  couleur={flux.flux_operationnels.total >= 0 ? '#2e7d32' : '#c62828'} />

                {/* FLUX D'INVESTISSEMENT */}
                <LigneFlux label="II. FLUX DE TRÉSORERIE D'INVESTISSEMENT" sousTitre />
                <LigneFlux label="Acquisitions d'immobilisations"
                  montant={-flux.flux_investissement.acquisitions_immo}
                  niveau={1} />
                {flux.flux_investissement.cessions_immo > 0 && (
                  <LigneFlux label="Cessions d'immobilisations"
                    montant={flux.flux_investissement.cessions_immo}
                    niveau={1} couleur="#2e7d32" />
                )}
                <LigneFlux label="FLUX NETS D'INVESTISSEMENT"
                  montant={flux.flux_investissement.total}
                  gras
                  couleur={flux.flux_investissement.total >= 0 ? '#2e7d32' : '#c62828'} />

                {/* FLUX DE FINANCEMENT */}
                <LigneFlux label="III. FLUX DE TRÉSORERIE DE FINANCEMENT" sousTitre />
                {flux.flux_financement.avances_associes > 0 && (
                  <LigneFlux label="Avances reçues des associés"
                    montant={flux.flux_financement.avances_associes}
                    niveau={1} couleur="#2e7d32" />
                )}
                {flux.flux_financement.remboursements_associes > 0 && (
                  <LigneFlux label="Remboursements aux associés"
                    montant={-flux.flux_financement.remboursements_associes}
                    niveau={1} />
                )}
                {flux.flux_financement.emprunts_recus > 0 && (
                  <LigneFlux label="Emprunts reçus"
                    montant={flux.flux_financement.emprunts_recus}
                    niveau={1} couleur="#2e7d32" />
                )}
                <LigneFlux label="FLUX NETS DE FINANCEMENT"
                  montant={flux.flux_financement.total}
                  gras
                  couleur={flux.flux_financement.total >= 0 ? '#2e7d32' : '#c62828'} />

                {/* VARIATION NETTE */}
                <LigneFlux label="VARIATION NETTE DE TRÉSORERIE"
                  montant={flux.variation_nette}
                  gras
                  couleur={flux.variation_nette >= 0 ? '#2e7d32' : '#c62828'} />

                {/* TRÉSORERIE */}
                <LigneFlux label={`Trésorerie d'ouverture (01/01/${annee})`}
                  montant={flux.tresorerie_ouverture}
                  gras couleur="#1565c0" />

                <tr style={{ background: '#004d5a' }}>
                  <td style={{ padding: '12px', color: 'white',
                    fontWeight: 'bold', fontSize: '14px' }}>
                    TRÉSORERIE DE CLÔTURE (31/12/{annee})
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right',
                    color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                    {Number(flux.tresorerie_cloture).toLocaleString('fr-FR')} Ar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Résumé */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: 'Flux opérationnels', value: flux.flux_operationnels.total, couleur: '#004d5a' },
              { label: 'Flux investissement', value: flux.flux_investissement.total, couleur: '#1565c0' },
              { label: 'Flux financement', value: flux.flux_financement.total, couleur: '#6a1b9a' },
              { label: 'Trésorerie clôture', value: flux.tresorerie_cloture,
                couleur: flux.tresorerie_cloture >= 0 ? '#2e7d32' : '#c62828' }
            ].map(item => (
              <div key={item.label} style={{ ...styles.card, marginBottom: 0,
                borderLeft: `4px solid ${item.couleur}` }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.couleur }}>
                  {item.value >= 0 ? '+' : ''}
                  {Number(item.value).toLocaleString('fr-FR')} Ar
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}