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
  boutonDanger: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
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
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '550px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const typesBilan = [
  { key: 'CAPITAL', label: 'Capital', section: 'Capitaux propres' },
  { key: 'RESERVE', label: 'Réserves', section: 'Capitaux propres' },
  { key: 'REPORT_NOUVEAU', label: 'Report à nouveau', section: 'Capitaux propres' },
  { key: 'EMPRUNT_LT', label: 'Emprunt long terme', section: 'Passif non courant' },
  { key: 'AUTRE_ACTIF', label: 'Autre actif', section: 'Actif courant' },
  { key: 'AUTRE_PASSIF', label: 'Autre passif', section: 'Passif courant' }
];

function LigneBilan({ label, montant, niveau = 0, gras = false, couleur = null, sousTitre = false, total = false }) {
  return (
    <tr style={{
      background: total ? '#004d5a' : sousTitre ? '#e8f5e9' : 'white',
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
        color: total ? 'white' : couleur || '#333'
      }}>
        {montant !== undefined && montant !== null
          ? `${Number(montant).toLocaleString('fr-FR')} Ar`
          : ''}
      </td>
    </tr>
  );
}

function ModalElement({ onSave, onCancel }) {
  const [form, setForm] = useState({
    type: 'CAPITAL',
    libelle: '',
    montant: 0
  });
  const [enCours, setEnCours] = useState(false);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          ➕ Ajouter un élément
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Type *</label>
            <select style={styles.input} value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              {typesBilan.map(t => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Libellé *</label>
            <input style={styles.input} value={form.libelle}
              onChange={e => setForm({ ...form, libelle: e.target.value })}
              placeholder="Ex: Capital social, Emprunt BNI..." />
          </div>
          <div>
            <label style={styles.label}>Montant (Ar) *</label>
            <input style={styles.input} type="number" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onSave(form);
              setEnCours(false);
            }}>
            {enCours ? '⏳ Ajout...' : '✅ Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BilanPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getBilan(entreprise.id, annee);
      setBilan(res.data);
    } catch (err) {
      toast.error('Erreur chargement bilan.');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterElement(form) {
    try {
      await comptabiliteService.ajouterElementBilan({
        ...form, entreprise_id: entreprise.id, annee
      });
      toast.success('Élément ajouté !');
      setModalOuvert(false);
      charger();
    } catch (err) {
      toast.error('Erreur ajout élément.');
    }
  }

  async function exporterPDF() {
    setExportEnCours(true);
    try {
      const res = await comptabiliteService.exportPDFBilan(entreprise.id, annee);
      window.open(res.data.url, '_blank');
      toast.success('PDF généré !');
    } catch (err) {
      toast.error('Erreur génération PDF.');
    } finally {
      setExportEnCours(false);
    }
  }

  async function supprimerElement(id) {
    if (!window.confirm('Supprimer cet élément ?')) return;
    try {
      await comptabiliteService.supprimerElementBilan(id);
      toast.success('Élément supprimé.');
      charger();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }

  const equilibre = bilan ? bilan.equilibre : 0;

  return (
    <div>
      {modalOuvert && (
        <ModalElement
          onSave={ajouterElement}
          onCancel={() => setModalOuvert(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>⚖️ Bilan</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...styles.input, width: '120px' }}
            value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button style={styles.boutonSecondaire} onClick={() => setModalOuvert(true)}>
            + Élément manuel  
          </button>
          <button style={{ ...styles.boutonSecondaire, opacity: exportEnCours ? 0.6 : 1 }}
            disabled={exportEnCours} onClick={exporterPDF}>
            {exportEnCours ? '⏳ Génération...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          ⏳ Chargement du bilan...
        </div>
      ) : bilan && (
        <>
            {/* Équilibre */}
            <div style={{
              background: Math.abs(equilibre) < 1 ? '#e8f5e9' : '#fff3e0',
              borderRadius: '8px', padding: '15px', marginBottom: '20px',
              border: `1px solid ${Math.abs(equilibre) < 1 ? '#2e7d32' : '#e65100'}`
            }}>
              {Math.abs(equilibre) < 1 ? (
                <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ✅ Bilan équilibré — ACTIF = PASSIF
                </div>
              ) : (
                <div>
                  <div style={{ color: '#e65100', fontWeight: 'bold', marginBottom: '8px' }}>
                    ⚠️ Écart de {Number(Math.abs(equilibre)).toLocaleString('fr-FR')} Ar entre ACTIF et PASSIF
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                    <strong>Causes possibles :</strong><br/>
                    {equilibre > 0 ? (
                      <>
                        Le PASSIF est insuffisant. Vérifiez :<br/>
                        • Capital social non saisi → cliquez <strong>"+ Élément manuel"</strong> → Capital<br/>
                        • Réserves non saisies → cliquez <strong>"+ Élément manuel"</strong> → Réserves<br/>
                        • Emprunts non saisis → cliquez <strong>"+ Élément manuel"</strong> → Emprunt long terme<br/>
                        • Autres dettes manquantes → cliquez <strong>"+ Élément manuel"</strong> → Autre passif
                      </>
                    ) : (
                      <>
                        L'ACTIF est insuffisant. Vérifiez :<br/>
                        • Autres actifs manquants → cliquez <strong>"+ Élément manuel"</strong> → Autre actif<br/>
                        • Stocks ou créances non enregistrés dans l'outil
                      </>
                    )}
                    <br/><br/>
                    <strong>💡 Astuce :</strong> Le bilan doit toujours être équilibré (ACTIF = PASSIF).
                    Ajoutez les éléments manquants via le bouton <strong>"+ Élément manuel"</strong>.
                  </div>
                </div>
              )}
            </div>
            {/* ACTIF */}
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>ACTIF</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004d5a', color: 'white' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px' }}>Libellé</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px' }}>Montant (Ar)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Actif non courant */}
                  <LigneBilan label="ACTIF NON COURANT" sousTitre />
                  <LigneBilan label="Immobilisations incorporelles (nettes)"
                    montant={bilan.actif.non_courant.immob_incorporelles.net} niveau={1} />
                  <LigneBilan label="Immobilisations corporelles (nettes)"
                    montant={bilan.actif.non_courant.immob_corporelles.net} niveau={1} />
                  <LigneBilan label="Total actif non courant"
                    montant={bilan.actif.non_courant.total} gras couleur="#004d5a" />

                  {/* Actif courant */}
                  <LigneBilan label="ACTIF COURANT" sousTitre />
                  <LigneBilan label="Stocks" montant={bilan.actif.courant.stocks} niveau={1} />
                  <LigneBilan label="Créances clients" montant={bilan.actif.courant.creances_clients} niveau={1} />
                  <LigneBilan label="Trésorerie" montant={bilan.actif.courant.tresorerie} niveau={1} />
                  {bilan.actif.courant.autres.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                        {a.libelle}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end',
                          alignItems: 'center', gap: '8px' }}>
                          {Number(a.montant).toLocaleString('fr-FR')} Ar
                          <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => supprimerElement(a.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <LigneBilan label="Total actif courant"
                    montant={bilan.actif.courant.total} gras couleur="#004d5a" />

                  {/* Total actif */}
                  <LigneBilan label="TOTAL ACTIF" montant={bilan.actif.total} total />
                </tbody>
              </table>
            </div>

            {/* PASSIF */}
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>PASSIF</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004d5a', color: 'white' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px' }}>Libellé</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px' }}>Montant (Ar)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Capitaux propres */}
                  <LigneBilan label="CAPITAUX PROPRES" sousTitre />
                  {bilan.passif.capitaux_propres.elements.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                        {e.libelle}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end',
                          alignItems: 'center', gap: '8px' }}>
                          {Number(e.montant).toLocaleString('fr-FR')} Ar
                          <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => supprimerElement(e.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <LigneBilan label="Résultat de l'exercice"
                    montant={bilan.passif.capitaux_propres.resultat_net}
                    niveau={1}
                    couleur={bilan.passif.capitaux_propres.resultat_net >= 0 ? '#2e7d32' : '#c62828'} />
                  <LigneBilan label="Total capitaux propres"
                    montant={bilan.passif.capitaux_propres.total} gras couleur="#004d5a" />

                  {/* Passif non courant */}
                  <LigneBilan label="PASSIF NON COURANT" sousTitre />
                  {bilan.passif.non_courant.emprunts.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                        {e.libelle}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end',
                          alignItems: 'center', gap: '8px' }}>
                          {Number(e.montant).toLocaleString('fr-FR')} Ar
                          <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => supprimerElement(e.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  <LigneBilan label="Compte courant associés"
                    montant={bilan.passif.non_courant.compte_courant_associes} niveau={1} />
                  <LigneBilan label="Total passif non courant"
                    montant={bilan.passif.non_courant.total} gras couleur="#004d5a" />
                  {/* Passif courant */}
                  <LigneBilan label="PASSIF COURANT" sousTitre />
                  <LigneBilan label="Dettes fournisseurs"
                    montant={bilan.passif.courant.dettes_fournisseurs} niveau={1} />
                  <LigneBilan label="Dettes tiers"
                    montant={bilan.passif.courant.dettes_tiers} niveau={1} />
                  <LigneBilan label={`Dettes fiscales (${bilan.regime_fiscal})`}
                    montant={bilan.passif.courant.dettes_fiscales} niveau={1} />
                  <LigneBilan label="Dettes sociales (CNAPS, OSTIE)"
                    montant={bilan.passif.courant.dettes_sociales} niveau={1} />
                  {bilan.passif.courant.autres.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                        {a.libelle}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end',
                          alignItems: 'center', gap: '8px' }}>
                          {Number(a.montant).toLocaleString('fr-FR')} Ar
                          <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => supprimerElement(a.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <LigneBilan label="Total passif courant"
                    montant={bilan.passif.courant.total} gras couleur="#004d5a" />

                  {/* Total passif */}
                  <LigneBilan label="TOTAL PASSIF" montant={bilan.passif.total} total />
                </tbody>
              </table>
            </div>
          

          {/* Résumé indicateurs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: 'Total Actif', value: bilan.actif.total, couleur: '#004d5a' },
              { label: 'Total Passif', value: bilan.passif.total, couleur: '#1565c0' },
              { label: 'Résultat Net', value: bilan.passif.capitaux_propres.resultat_net,
                couleur: bilan.passif.capitaux_propres.resultat_net >= 0 ? '#2e7d32' : '#c62828' }
            ].map(item => (
              <div key={item.label} style={{ ...styles.card, marginBottom: 0,
                borderLeft: `4px solid ${item.couleur}` }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.couleur }}>
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