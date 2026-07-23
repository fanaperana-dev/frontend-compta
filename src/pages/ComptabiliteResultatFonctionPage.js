import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { comptabiliteService } from '../services/api';
import api from '../services/api';

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
    width: '500px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const fonctionsComptables = [
  { key: 'COUT_VENTES', label: 'Coût des ventes (production)' },
  { key: 'FRAIS_COMMERCIAUX', label: 'Frais commerciaux' },
  { key: 'FRAIS_ADMINISTRATIFS', label: 'Frais administratifs' },
  { key: 'AUTRES', label: 'Autres charges' }
  
];

function LigneResultat({ label, montant, niveau = 0, gras = false, couleur = null, sousTitre = false, total = false }) {
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
        color: total ? 'white' : couleur || '#333'
      }}>
        {montant !== undefined && montant !== null
          ? `${Number(montant).toLocaleString('fr-FR')} Ar`
          : ''}
      </td>
    </tr>
  );
}

function ModalFonction({ onSave, onCancel, entrepriseId }) {
  const [form, setForm] = useState({
    fonction_salarie: '',
    fonction_comptable: 'FRAIS_ADMINISTRATIFS'
  });
  const [enCours, setEnCours] = useState(false);
  const [postes, setPostes] = useState([]);
  

  useEffect(() => {
    api.get(`/rh/postes/${entrepriseId}`)
      .then(res => setPostes(res.data.data || []))
      .catch(() => {});
  }, []);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          ➕ Ajouter une correspondance
        </h3>
        <div style={{ background: '#e3f2fd', borderRadius: '8px',
          padding: '12px', marginBottom: '15px', fontSize: '12px', color: '#1565c0' }}>
          ℹ️ Définissez la fonction comptable pour un poste de salarié.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Poste du salarié *</label>
            <select style={styles.input} value={form.fonction_salarie}
              onChange={e => setForm({ ...form, fonction_salarie: e.target.value })}>
              <option value="">Sélectionner un poste</option>
              {postes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Fonction comptable *</label>
            <select style={styles.input} value={form.fonction_comptable}
              onChange={e => setForm({ ...form, fonction_comptable: e.target.value })}>
              {fonctionsComptables.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
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

  

export default function ComptabiliteResultatFonctionPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [resultat, setResultat] = useState(null);
  const [fonctions, setFonctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [onglet, setOnglet] = useState('resultat');
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => {
    chargerFonctions();
    charger();
  }, []);

  useEffect(() => { charger(); }, [annee]);

  async function chargerFonctions() {
    try {
      const res = await comptabiliteService.getFonctionsComptables(entreprise.id);
      setFonctions(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement correspondances.');
    }
  }

  async function exporterPDF() {
  setExportEnCours(true);
  try {
    const res = await comptabiliteService.exportPDFCompteResultatFonction(entreprise.id, annee);
    window.open(res.data.url, '_blank');
    toast.success('PDF généré !');
  } catch (err) {
    toast.error('Erreur génération PDF.');
  } finally {
    setExportEnCours(false);
  }
}

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getCompteResultatFonction(entreprise.id, annee);
      setResultat(res.data);
    } catch (err) {
      toast.error('Erreur chargement compte de résultat par fonction.');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterFonction(form) {
    try {
      await comptabiliteService.ajouterFonctionComptable({
        ...form, entreprise_id: entreprise.id
      });
      toast.success('Correspondance ajoutée !');
      setModalOuvert(false);
      chargerFonctions();
      charger();
    } catch (err) {
      toast.error('Erreur ajout correspondance.');
    }
  }

  async function supprimerFonction(id) {
    if (!window.confirm('Supprimer cette correspondance ?')) return;
    try {
      await comptabiliteService.supprimerFonctionComptable(id);
      toast.success('Correspondance supprimée.');
      chargerFonctions();
      charger();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }

  return (
    <div>
      {modalOuvert && (
        <ModalFonction
          onSave={ajouterFonction}
          onCancel={() => setModalOuvert(false)}
          entrepriseId={entreprise.id}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📊 Compte de résultat par fonction</h2>
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

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0' }}>
        {[
          { key: 'resultat', label: '📊 Compte de résultat' },
          { key: 'correspondances', label: '⚙️ Correspondances postes' }
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              borderBottom: onglet === o.key ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent',
              color: onglet === o.key ? '#004d5a' : '#666',
              fontWeight: onglet === o.key ? 'bold' : 'normal', fontSize: '13px'
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Onglet Compte de résultat */}
      {onglet === 'resultat' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            ⏳ Chargement...
          </div>
        ) : resultat && (
          <>
            {fonctions.length === 0 && (
              <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px',
                marginBottom: '20px', fontSize: '13px', color: '#e65100' }}>
                ⚠️ Aucune correspondance de postes configurée — les charges de personnel
                sont classées dans "Autres charges". Allez dans l'onglet
                <strong> "Correspondances postes"</strong> pour configurer.
              </div>
            )}

            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>
                Compte de résultat par fonction — Exercice {annee}
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
                  {/* PRODUITS */}
                  <LigneResultat label="PRODUITS" sousTitre />
                  <LigneResultat label="Chiffre d'affaires"
                    montant={resultat.produits.ca} niveau={1} />
                  {resultat.produits.autres > 0 && (
                    <LigneResultat label="Autres produits"
                      montant={resultat.produits.autres} niveau={1} />
                  )}
                  <LigneResultat label="TOTAL PRODUITS"
                    montant={resultat.produits.total} gras couleur="#2e7d32" />

                  {/* CHARGES PAR FONCTION */}
                  <LigneResultat label="CHARGES PAR FONCTION" sousTitre />
                  <LigneResultat label="Coût des ventes"
                    montant={resultat.charges.cout_ventes} niveau={1} />
                  <LigneResultat label="Frais commerciaux"
                    montant={resultat.charges.frais_commerciaux} niveau={1} />
                  <LigneResultat label="Frais administratifs"
                    montant={resultat.charges.frais_administratifs} niveau={1} />
                  {resultat.charges.autres > 0 && (
                    <LigneResultat label="Autres charges"
                      montant={resultat.charges.autres} niveau={1} />
                  )}
                  <LigneResultat label="TOTAL CHARGES"
                    montant={resultat.charges.total} gras couleur="#c62828" />

                  {/* RÉSULTATS */}
                  <LigneResultat label="RÉSULTAT AVANT IMPÔT" sousTitre />
                  <LigneResultat
                    label="Résultat avant impôt"
                    montant={resultat.resultats.avant_impot}
                    gras
                    couleur={resultat.resultats.avant_impot >= 0 ? '#2e7d32' : '#c62828'}
                  />

                  <LigneResultat label="IMPÔT" sousTitre />
                  <LigneResultat
                    label={`${resultat.regime_fiscal} — ${resultat.regime_fiscal === 'IS'
                      ? '5% du CA'
                      : '20% du bénéfice net'}`}
                    montant={resultat.resultats.impot}
                    niveau={1}
                  />

                  {/* RÉSULTAT NET */}
                  <tr style={{ background: '#004d5a' }}>
                    <td style={{ padding: '12px', color: 'white',
                      fontWeight: 'bold', fontSize: '14px' }}>
                      RÉSULTAT NET DE L'EXERCICE {annee}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right',
                      color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                      {Number(resultat.resultats.net).toLocaleString('fr-FR')} Ar
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* Onglet Correspondances */}
      {onglet === 'correspondances' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#004d5a' }}>
              ⚙️ Correspondances postes → fonctions comptables
            </h3>
            <button style={styles.boutonPrimaire}
              onClick={() => setModalOuvert(true)}>
              + Ajouter
            </button>
          </div>

          <div style={{ background: '#e3f2fd', borderRadius: '8px',
            padding: '12px', marginBottom: '15px', fontSize: '12px', color: '#1565c0' }}>
            ℹ️ Associez chaque poste de salarié à une fonction comptable.
            Les salariés non configurés seront classés dans "Autres charges".
          </div>

          {fonctions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
              Aucune correspondance configurée. Cliquez sur "+ Ajouter" pour commencer.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                    Poste salarié
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                    Fonction comptable
                  </th>
                  <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {fonctions.map((f, i) => {
                  const fc = fonctionsComptables.find(fc => fc.key === f.fonction_comptable);
                  return (
                    <tr key={f.id} style={{
                      background: i % 2 === 0 ? 'white' : '#fafafa',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <td style={{ padding: '10px', fontSize: '13px' }}>
                        {f.fonction_salarie}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px',
                          background: '#e3f2fd', color: '#1565c0', fontSize: '12px' }}>
                          {fc?.label || f.fonction_comptable}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button style={styles.boutonDanger}
                          onClick={() => supprimerFonction(f.id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}