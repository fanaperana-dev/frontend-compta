import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { entrepriseService } from '../../services/api';

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
    display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px'
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
    width: '700px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

function couleurStatut(statut) {
  return statut === 'ACTIF'
    ? { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Actif' }
    : { bg: '#ffebee', color: '#c62828', label: '🚫 Suspendu' };
}

// Formulaire création/modification entreprise
function FormulaireEntreprise({ entreprise, forfaits, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: entreprise?.nom || '',
    email: entreprise?.email || '',
    mot_de_passe: '',
    telephone: entreprise?.telephone || '',
    adresse: entreprise?.adresse || '',
    ville: entreprise?.ville || '',
    nif: entreprise?.nif || '',
    stat: entreprise?.stat || '',
    rcs: entreprise?.rcs || '',
    capital: entreprise?.capital || '',
    statut_juridique: entreprise?.statut_juridique || '',
    activite: entreprise?.activite || '',
    numero_cnaps: entreprise?.numero_cnaps || '',
    prefixe_facture: entreprise?.prefixe_facture || 'FAC-',
    delai_paiement_defaut: entreprise?.delai_paiement_defaut || 30,
    info_paiement: entreprise?.info_paiement || '',
    forfait_id: entreprise?.forfait_id || '',
    taux_majoration_ferie: entreprise?.taux_majoration_ferie || 1.50,
  });

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {entreprise ? '✏️ Modifier entreprise' : '➕ Nouvelle entreprise'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Nom entreprise *</label>
            <input style={styles.input} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={!!entreprise} />
          </div>
          {!entreprise && (
            <div>
              <label style={styles.label}>Mot de passe *</label>
              <input style={styles.input} type="password" value={form.mot_de_passe}
                onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} />
            </div>
          )}
          <div>
            <label style={styles.label}>Forfait *</label>
            <select style={styles.input} value={form.forfait_id}
              onChange={e => setForm({ ...form, forfait_id: e.target.value })}>
              <option value="">Sélectionner un forfait</option>
              {forfaits.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nom} — {Number(f.prix).toLocaleString('fr-FR')} Ar/mois
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.input} value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Adresse</label>
            <input style={styles.input} value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input style={styles.input} value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Activité</label>
            <input style={styles.input} value={form.activite}
              onChange={e => setForm({ ...form, activite: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>NIF</label>
            <input style={styles.input} value={form.nif}
              onChange={e => setForm({ ...form, nif: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>STAT</label>
            <input style={styles.input} value={form.stat}
              onChange={e => setForm({ ...form, stat: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>RCS</label>
            <input style={styles.input} value={form.rcs}
              onChange={e => setForm({ ...form, rcs: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Capital</label>
            <input style={styles.input} value={form.capital}
              onChange={e => setForm({ ...form, capital: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Statut juridique</label>
            <select style={styles.input} value={form.statut_juridique}
              onChange={e => setForm({ ...form, statut_juridique: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="SARL">SARL</option>
              <option value="SARLU">SARLU</option>
              <option value="SA">SA</option>
              <option value="EI">Entreprise Individuelle</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>N° CNAPS entreprise</label>
            <input style={styles.input} value={form.numero_cnaps}
              onChange={e => setForm({ ...form, numero_cnaps: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Préfixe facture</label>
            <input style={styles.input} value={form.prefixe_facture}
              onChange={e => setForm({ ...form, prefixe_facture: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Délai paiement par défaut (jours)</label>
            <input style={styles.input} type="number" value={form.delai_paiement_defaut}
              onChange={e => setForm({ ...form, delai_paiement_defaut: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Taux majoration jours fériés</label>
            <select style={styles.input} value={form.taux_majoration_ferie}
              onChange={e => setForm({ ...form, taux_majoration_ferie: Number(e.target.value) })}>
              <option value={1.50}>150% (défaut)</option>
              <option value={2.00}>200%</option>
              <option value={1.00}>100% (pas de majoration)</option>
              <option value={1.25}>125%</option>
              <option value={1.75}>175%</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Nom organisme santé (défaut: OSTIE)</label>
            <input style={styles.input} 
              value={form.nom_organisme_sante || 'OSTIE'}
              onChange={e => setForm({ ...form, nom_organisme_sante: e.target.value })}
              placeholder="OSTIE, SMMC, autre..." />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Info paiement (coordonnées bancaires, Mvola... affiché sur factures)</label>
            <textarea style={{ ...styles.input, height: '70px', resize: 'vertical' }}
              value={form.info_paiement}
              onChange={e => setForm({ ...form, info_paiement: e.target.value })} />
          </div>
          
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            {entreprise ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal détail entreprise
function ModalDetailEntreprise({ entreprise, forfaits, onClose, onModifier, onChangerStatut, onResetMdp }) {
  const [motifSuspension, setMotifSuspension] = useState('');
  const [modalSuspension, setModalSuspension] = useState(false);
  const statut = couleurStatut(entreprise.statut);
  const forfait = forfaits.find(f => f.id === entreprise.forfait_id);

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ color: '#004d5a', marginTop: 0 }}>🏢 {entreprise.nom}</h3>
          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
            fontWeight: 'bold', background: statut.bg, color: statut.color }}>
            {statut.label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#333' }}>
          <div><strong>Email :</strong> {entreprise.email}</div>
          <div><strong>Téléphone :</strong> {entreprise.telephone || '—'}</div>
          <div><strong>Adresse :</strong> {entreprise.adresse || '—'} {entreprise.ville || ''}</div>
          <div><strong>Activité :</strong> {entreprise.activite || '—'}</div>
          <div><strong>NIF :</strong> {entreprise.nif || '—'} — <strong>STAT :</strong> {entreprise.stat || '—'}</div>
          <div><strong>RCS :</strong> {entreprise.rcs || '—'} — <strong>Capital :</strong> {entreprise.capital || '—'}</div>
          <div><strong>Forfait :</strong> {forfait ? `${forfait.nom} (${Number(forfait.prix).toLocaleString('fr-FR')} Ar/mois)` : 'Non défini'}</div>
          {entreprise.statut === 'SUSPENDU' && (
            <div style={{ background: '#ffebee', padding: '10px', borderRadius: '8px', color: '#c62828' }}>
              <strong>Motif suspension :</strong> {entreprise.motif_suspension || 'Non précisé'}<br/>
              <strong>Date :</strong> {entreprise.date_suspension ? new Date(entreprise.date_suspension).toLocaleDateString('fr-FR') : '—'}
            </div>
          )}
        </div>

        {modalSuspension && (
          <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px', marginTop: '15px' }}>
            <label style={styles.label}>Motif de suspension</label>
            <textarea style={{ ...styles.input, height: '60px' }}
              value={motifSuspension}
              onChange={e => setMotifSuspension(e.target.value)}
              placeholder="Ex : Facture impayée, désabonnement..." />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.boutonSecondaire} onClick={() => setModalSuspension(false)}>Annuler</button>
              <button style={{ ...styles.boutonPrimaire, background: '#c62828' }}
                onClick={() => { onChangerStatut(entreprise.id, 'SUSPENDU', motifSuspension); setModalSuspension(false); }}>
                Confirmer suspension
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={() => onModifier(entreprise)}>
            ✏️ Modifier infos
          </button>
          <button style={styles.boutonSecondaire} onClick={() => onResetMdp(entreprise.id)}>
            🔑 Réinitialiser mot de passe
          </button>
          {entreprise.statut === 'ACTIF' ? (
            <button style={styles.boutonDanger} onClick={() => setModalSuspension(true)}>
              🚫 Suspendre
            </button>
          ) : (
            <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
              onClick={() => onChangerStatut(entreprise.id, 'ACTIF', '')}>
              ✅ Réactiver
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <button style={styles.boutonSecondaire} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminEntreprises() {
  const [entreprises, setEntreprises] = useState([]);
  const [forfaits, setForfaits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modalOuvert, setModalOuvert] = useState(null);
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState(null);

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [entreprisesRes, forfaitsRes] = await Promise.all([
        entrepriseService.getAll(),
        entrepriseService.getForfaits()
      ]);
      setEntreprises(entreprisesRes.data.data || []);
      setForfaits(forfaitsRes.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function creerEntreprise(form) {
    try {
      await entrepriseService.creer(form);
      toast.success('Entreprise créée !');
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création.');
    }
  }

  async function modifierEntreprise(form) {
    try {
      await entrepriseService.modifier(entrepriseSelectionnee.id, form);
      toast.success('Entreprise modifiée !');
      setModalOuvert(null);
      setEntrepriseSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur modification.');
    }
  }

  async function changerStatut(id, statut, motif) {
    try {
      await entrepriseService.changerStatut(id, statut, motif);
      toast.success(statut === 'ACTIF' ? 'Entreprise réactivée !' : 'Entreprise suspendue.');
      setModalOuvert(null);
      setEntrepriseSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur changement statut.');
    }
  }

  async function resetMdp(id) {
    try {
      const res = await entrepriseService.resetMdp(id);
      toast.success(res.data.message);
      if (res.data.mot_de_passe_temporaire) {
        toast.info(`Mot de passe temporaire : ${res.data.mot_de_passe_temporaire}`, { autoClose: false });
      }
    } catch (err) {
      toast.error('Erreur réinitialisation.');
    }
  }

  const entreprisesFiltrees = entreprises.filter(e =>
    !recherche ||
    e.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    e.email?.toLowerCase().includes(recherche.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireEntreprise
          forfaits={forfaits}
          onSave={creerEntreprise}
          onCancel={() => setModalOuvert(null)}
        />
      )}
      {modalOuvert === 'modifier' && entrepriseSelectionnee && (
        <FormulaireEntreprise
          entreprise={entrepriseSelectionnee}
          forfaits={forfaits}
          onSave={modifierEntreprise}
          onCancel={() => { setModalOuvert(null); setEntrepriseSelectionnee(null); }}
        />
      )}
      {modalOuvert === 'detail' && entrepriseSelectionnee && (
        <ModalDetailEntreprise
          entreprise={entrepriseSelectionnee}
          forfaits={forfaits}
          onClose={() => { setModalOuvert(null); setEntrepriseSelectionnee(null); }}
          onModifier={(e) => { setEntrepriseSelectionnee(e); setModalOuvert('modifier'); }}
          onChangerStatut={changerStatut}
          onResetMdp={resetMdp}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>🏢 Entreprises</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {entreprises.length} entreprise(s) au total
          </p>
        </div>
        <button style={styles.boutonPrimaire} onClick={() => setModalOuvert('creer')}>
          + Nouvelle entreprise
        </button>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Rechercher</label>
        <input style={{ ...styles.input, width: '300px' }}
          placeholder="Nom ou email..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)} />
      </div>

      <div style={styles.card}>
        {entreprisesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune entreprise trouvée.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Nom', 'Email', 'Forfait', 'Statut', 'Date création', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entreprisesFiltrees.map((e, i) => {
                const statut = couleurStatut(e.statut);
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {e.nom}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{e.email}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {e.forfaits?.nom || '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                        fontWeight: 'bold', background: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {e.date_creation ? new Date(e.date_creation).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button style={styles.boutonSecondaire}
                        onClick={() => { setEntrepriseSelectionnee(e); setModalOuvert('detail'); }}>
                        🔍 Détail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}