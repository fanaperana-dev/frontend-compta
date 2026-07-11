import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { immobilisationService } from '../services/api';
import * as XLSX from 'xlsx';

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
    width: '750px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const comptesIncorporels = [
  { key: '211', label: '211 - Frais de développement' },
  { key: '212', label: '212 - Brevets, licences' },
  { key: '213', label: '213 - Logiciels' },
  { key: '214', label: '214 - Fonds commercial' },
  { key: '218', label: '218 - Autres immob. incorporelles' }
];

const comptesCorporels = [
  { key: '221', label: '221 - Terrains' },
  { key: '222', label: '222 - Constructions' },
  { key: '223', label: '223 - Matériels et outillages' },
  { key: '224', label: '224 - Matériels de transport' },
  { key: '225', label: '225 - Mobilier et agencements' },
  { key: '226', label: '226 - Matériels informatiques' },
  { key: '228', label: '228 - Autres immob. corporelles' }
];

function FormulaireImmobilisation({ immo, onSave, onCancel }) {
  const [form, setForm] = useState({
    reference: immo?.reference || '',
    designation: immo?.designation || '',
    type_immobilisation: immo?.type_immobilisation || 'CORPORELLE',
    numero_compte: immo?.numero_compte || '223',
    categorie: immo?.categorie || '',
    date_acquisition: immo?.date_acquisition || '',
    date_debut_amortissement: immo?.date_debut_amortissement || '',
    date_fin_amortissement: immo?.date_fin_amortissement || '',
    valeur_acquisition: immo?.valeur_acquisition || 0,
    mode_amortissement: immo?.mode_amortissement || 'LINEAIRE',
    fournisseur: immo?.fournisseur || '',
    numero_facture: immo?.numero_facture || '',
    localisation: immo?.localisation || '',
    type_immobilisation_detail: immo?.type_immobilisation_detail || ''
  });

  // Calcul automatique durée et taux
  const dureeJours = form.date_debut_amortissement && form.date_fin_amortissement
    ? Math.round((new Date(form.date_fin_amortissement) - new Date(form.date_debut_amortissement)) / (1000 * 60 * 60 * 24))
    : 0;
  const tauxJournalier = dureeJours > 0
    ? (Number(form.valeur_acquisition) / dureeJours).toFixed(4)
    : 0;

  const comptesDisponibles = form.type_immobilisation === 'INCORPORELLE'
    ? comptesIncorporels
    : comptesCorporels;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {immo ? '✏️ Modifier immobilisation' : '➕ Nouvelle immobilisation'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={styles.label}>Référence *</label>
            <input style={styles.input} value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              disabled={!!immo} />
          </div>
          <div>
            <label style={styles.label}>Désignation *</label>
            <input style={styles.input} value={form.designation}
              onChange={e => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Type *</label>
            <select style={styles.input} value={form.type_immobilisation}
              onChange={e => setForm({
                ...form,
                type_immobilisation: e.target.value,
                numero_compte: e.target.value === 'INCORPORELLE' ? '213' : '223'
              })}>
              <option value="CORPORELLE">Corporelle</option>
              <option value="INCORPORELLE">Incorporelle</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Compte PCG 2005 *</label>
            <select style={styles.input} value={form.numero_compte}
              onChange={e => setForm({ ...form, numero_compte: e.target.value })}>
              {comptesDisponibles.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Détail type</label>
            <input style={styles.input} value={form.type_immobilisation_detail}
              onChange={e => setForm({ ...form, type_immobilisation_detail: e.target.value })}
              placeholder="Ex: Véhicule, Ordinateur..." />
          </div>
          <div>
            <label style={styles.label}>Catégorie</label>
            <input style={styles.input} value={form.categorie}
              onChange={e => setForm({ ...form, categorie: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date acquisition *</label>
            <input style={styles.input} type="date" value={form.date_acquisition}
              onChange={e => setForm({ ...form, date_acquisition: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Valeur acquisition (Ar) *</label>
            <input style={styles.input} type="number" value={form.valeur_acquisition}
              onChange={e => setForm({ ...form, valeur_acquisition: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date début amortissement *</label>
            <input style={styles.input} type="date" value={form.date_debut_amortissement}
              onChange={e => setForm({ ...form, date_debut_amortissement: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date fin amortissement *</label>
            <input style={styles.input} type="date" value={form.date_fin_amortissement}
              onChange={e => setForm({ ...form, date_fin_amortissement: e.target.value })} />
          </div>

          {/* Calcul automatique */}
          {dureeJours > 0 && (
            <div style={{ gridColumn: 'span 2', background: '#e3f2fd',
              borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '30px', fontSize: '13px' }}>
                <span><strong>Durée :</strong> {dureeJours} jours</span>
                <span><strong>Taux journalier :</strong> {Number(tauxJournalier).toLocaleString('fr-FR')} Ar/jour</span>
              </div>
            </div>
          )}

          
          <div>
            <label style={styles.label}>Mode amortissement</label>
            <select style={styles.input} value={form.mode_amortissement}
              onChange={e => setForm({ ...form, mode_amortissement: e.target.value })}>
              <option value="LINEAIRE">Linéaire</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Fournisseur</label>
            <input style={styles.input} value={form.fournisseur}
              onChange={e => setForm({ ...form, fournisseur: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>N° facture</label>
            <input style={styles.input} value={form.numero_facture}
              onChange={e => setForm({ ...form, numero_facture: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Localisation</label>
            <input style={styles.input} value={form.localisation}
              onChange={e => setForm({ ...form, localisation: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            {immo ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSortie({ immo, onSave, onCancel }) {
  const [form, setForm] = useState({
    date_cession: new Date().toISOString().split('T')[0],
    valeur_cession: 0,
    motif_sortie: ''
  });

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#c62828', marginTop: 0 }}>🔴 Sortie immobilisation</h3>
        <p style={{ color: '#666', fontSize: '13px' }}>
          <strong>{immo.designation}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Date de cession</label>
            <input style={styles.input} type="date" value={form.date_cession}
              onChange={e => setForm({ ...form, date_cession: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Valeur de cession (Ar)</label>
            <input style={styles.input} type="number" value={form.valeur_cession}
              onChange={e => setForm({ ...form, valeur_cession: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Motif de sortie</label>
            <input style={styles.input} value={form.motif_sortie}
              onChange={e => setForm({ ...form, motif_sortie: e.target.value })}
              placeholder="Vente, mise au rebut, vol..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonDanger} onClick={() => onSave(form)}>
            Confirmer la sortie
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImmobilisationsPage() {
  const { entreprise } = useAuth();
  const [onglet, setOnglet] = useState('liste');
  const [immobilisations, setImmobilisations] = useState([]);
  const [tableau, setTableau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(null);
  const [immoSelectionnee, setImmoSelectionnee] = useState(null);
  const [anneeTableau, setAnneeTableau] = useState(new Date().getFullYear());

  useEffect(() => { chargerDonnees(); }, []);
  useEffect(() => {
    if (onglet === 'tableau') chargerTableau();
  }, [onglet, anneeTableau]);

  async function chargerDonnees() {
    try {
      const res = await immobilisationService.getAll(entreprise.id);
      setImmobilisations(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement immobilisations.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerTableau() {
    try {
      const res = await immobilisationService.getTableau(entreprise.id, anneeTableau);
      setTableau(res.data);
    } catch (err) {
      toast.error('Erreur chargement tableau.');
    }
  }

  async function creer(form) {
    try {
      await immobilisationService.creer({ ...form, entreprise_id: entreprise.id });
      toast.success('Immobilisation créée !');
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création.');
    }
  }

  async function modifier(form) {
    try {
      await immobilisationService.modifier(immoSelectionnee.id, form);
      toast.success('Immobilisation modifiée !');
      setModalOuvert(null);
      setImmoSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur modification.');
    }
  }

  async function sortie(form) {
    try {
      await immobilisationService.sortie(immoSelectionnee.id, form);
      toast.success('Immobilisation sortie !');
      setModalOuvert(null);
      setImmoSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur sortie.');
    }
  }

  function exporterExcel() {
    if (!tableau) return;

    const wb = XLSX.utils.book_new();

    function lignesTableau(liste, titre) {
      const rows = [];
      rows.push([titre]);
      rows.push([
        'Désignation', 'Val. Acquisition', 'Acquisitions', 'Cessions',
        'Valeur Brute', 'Amort. Antérieurs', 'Amort. Exercice',
        'Amort. Cumulé', 'Valeur Résiduelle'
      ]);
      liste.forEach(d => {
        rows.push([
          d.immobilisations?.designation,
          d.immobilisations?.valeur_acquisition,
          d.immobilisations?.acquisitions_exercice,
          d.immobilisations?.cessions_exercice,
          d.valeur_brute,
          d.amortissement_anterieur,
          d.dotation_exercice,
          d.amortissement_cumule,
          d.valeur_nette_comptable
        ]);
      });
      return rows;
    }

    const data = [
      [`TABLEAU D'AMORTISSEMENT AU 31/12/${anneeTableau}`],
      [],
      ...lignesTableau(tableau.incorporelles.lignes, 'IMMOBILISATIONS INCORPORELLES'),
      ['TOTAL INCORPORELLES', tableau.incorporelles.total.valeur_acquisition,
        tableau.incorporelles.total.acquisitions, tableau.incorporelles.total.cessions,
        tableau.incorporelles.total.valeur_brute, tableau.incorporelles.total.amortissement_anterieur,
        tableau.incorporelles.total.dotation_exercice, tableau.incorporelles.total.amortissement_cumule,
        tableau.incorporelles.total.valeur_nette_comptable],
      [],
      ...lignesTableau(tableau.corporelles.lignes, 'IMMOBILISATIONS CORPORELLES'),
      ['TOTAL CORPORELLES', tableau.corporelles.total.valeur_acquisition,
        tableau.corporelles.total.acquisitions, tableau.corporelles.total.cessions,
        tableau.corporelles.total.valeur_brute, tableau.corporelles.total.amortissement_anterieur,
        tableau.corporelles.total.dotation_exercice, tableau.corporelles.total.amortissement_cumule,
        tableau.corporelles.total.valeur_nette_comptable],
      [],
      ['TOTAL GÉNÉRAL', tableau.total_general.valeur_acquisition,
        tableau.total_general.acquisitions, tableau.total_general.cessions,
        tableau.total_general.valeur_brute, tableau.total_general.amortissement_anterieur,
        tableau.total_general.dotation_exercice, tableau.total_general.amortissement_cumule,
        tableau.total_general.valeur_nette_comptable]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = Array(9).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, ws, `Amortissement ${anneeTableau}`);
    XLSX.writeFile(wb, `Tableau_Amortissement_${anneeTableau}.xlsx`);
    toast.success('Export Excel généré !');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  const incorporelles = immobilisations.filter(i => i.type_immobilisation === 'INCORPORELLE');
  const corporelles = immobilisations.filter(i => i.type_immobilisation === 'CORPORELLE');

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireImmobilisation onSave={creer} onCancel={() => setModalOuvert(null)} />
      )}
      {modalOuvert === 'modifier' && immoSelectionnee && (
        <FormulaireImmobilisation
          immo={immoSelectionnee}
          onSave={modifier}
          onCancel={() => { setModalOuvert(null); setImmoSelectionnee(null); }}
        />
      )}
      {modalOuvert === 'sortie' && immoSelectionnee && (
        <ModalSortie
          immo={immoSelectionnee}
          onSave={sortie}
          onCancel={() => { setModalOuvert(null); setImmoSelectionnee(null); }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>🏗️ Immobilisations</h2>
        <button style={styles.boutonPrimaire} onClick={() => setModalOuvert('creer')}>
          + Nouvelle immobilisation
        </button>
      </div>

      {/* Indicateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #004d5a' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>🏗️ Total immobilisations</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004d5a' }}>
            {immobilisations.filter(i => i.actif).length}
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #1565c0' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>📄 Incorporelles</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>
            {incorporelles.filter(i => i.actif).length}
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #2e7d32' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>🔧 Corporelles</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
            {corporelles.filter(i => i.actif).length}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        {[
          { key: 'liste', label: '📋 Liste' },
          { key: 'tableau', label: '📊 Tableau d\'amortissement' }
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              borderBottom: onglet === o.key ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent', color: onglet === o.key ? '#004d5a' : '#666',
              fontWeight: onglet === o.key ? 'bold' : 'normal', fontSize: '13px'
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Onglet Liste */}
      {onglet === 'liste' && (
        <div style={styles.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Réf.', 'Désignation', 'Type', 'Compte', 'Date acq.',
                  'Valeur acq.', 'Début amort.', 'Fin amort.',
                  'Durée (j)', 'Taux/jour', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left',
                    fontSize: '12px', color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {immobilisations.map((immo, i) => (
                <tr key={immo.id} style={{
                  background: !immo.actif ? '#fafafa' : i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  opacity: immo.actif ? 1 : 0.6
                }}>
                  <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {immo.reference}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{immo.designation}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                      background: immo.type_immobilisation === 'INCORPORELLE' ? '#e3f2fd' : '#e8f5e9',
                      color: immo.type_immobilisation === 'INCORPORELLE' ? '#1565c0' : '#2e7d32' }}>
                      {immo.type_immobilisation}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{immo.numero_compte}</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {new Date(immo.date_acquisition).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {Number(immo.valeur_acquisition).toLocaleString('fr-FR')} Ar
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {new Date(immo.date_debut_amortissement).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {new Date(immo.date_fin_amortissement).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{immo.duree_jours} j</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {Number(immo.taux_journalier).toLocaleString('fr-FR')} Ar
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                      background: immo.actif ? '#e8f5e9' : '#ffebee',
                      color: immo.actif ? '#2e7d32' : '#c62828' }}>
                      {immo.actif ? 'Actif' : 'Sorti'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={styles.boutonSecondaire}
                        onClick={() => { setImmoSelectionnee(immo); setModalOuvert('modifier'); }}>
                        ✏️
                      </button>
                      {immo.actif && (
                        <button style={styles.boutonDanger}
                          onClick={() => { setImmoSelectionnee(immo); setModalOuvert('sortie'); }}>
                          🔴
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Tableau d'amortissement */}
      {onglet === 'tableau' && (
        <div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <label style={styles.label}>Année</label>
              <select style={{ ...styles.input, width: '150px' }}
                value={anneeTableau}
                onChange={e => setAnneeTableau(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <button style={{ ...styles.boutonSecondaire, marginTop: '22px' }}
              onClick={exporterExcel}>
              📥 Export Excel
            </button>
          </div>

          {tableau && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>
                Tableau d'amortissement au 31/12/{anneeTableau}
              </h3>

              {/* Table helper */}
              {[
                { titre: 'IMMOBILISATIONS INCORPORELLES', lignes: tableau.incorporelles.lignes, total: tableau.incorporelles.total },
                { titre: 'IMMOBILISATIONS CORPORELLES', lignes: tableau.corporelles.lignes, total: tableau.corporelles.total }
              ].map(section => (
                <div key={section.titre} style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#004d5a', marginBottom: '10px' }}>{section.titre}</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#004d5a', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Désignation</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Val. Acq.</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Acquisitions</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Cessions</th>
                        <th style={{ padding: '8px', textAlign: 'right', background: '#003d47' }}>Val. Brute</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Amort. Ant.</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Amort. Exo.</th>
                        <th style={{ padding: '8px', textAlign: 'right', background: '#003d47' }}>Cumul</th>
                        <th style={{ padding: '8px', textAlign: 'right', background: '#2e7d32' }}>VNC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.lignes.map((d, i) => (
                        <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                          borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '8px' }}>{d.immobilisations?.designation}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {Number(d.immobilisations?.valeur_acquisition).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {Number(d.immobilisations?.acquisitions_exercice || 0).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {Number(d.immobilisations?.cessions_exercice || 0).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                            {Number(d.valeur_brute).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {Number(d.amortissement_anterieur).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {Number(d.dotation_exercice).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                            {Number(d.amortissement_cumule).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                            {Number(d.valeur_nette_comptable).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <button style={{ ...styles.boutonSecondaire, fontSize: '11px', padding: '2px 6px' }}
                              onClick={() => {
                                const acq = prompt(`Acquisitions ${d.annee} (Ar) :`, d.acquisitions_exercice || 0);
                                const ces = prompt(`Cessions ${d.annee} (Ar) :`, d.cessions_exercice || 0);
                                if (acq !== null && ces !== null) {
                                  immobilisationService.modifierDotation(d.immobilisation_id, d.annee, {
                                    acquisitions_exercice: Number(acq),
                                    cessions_exercice: Number(ces)
                                  }).then(() => {
                                    toast.success('Dotation mise à jour !');
                                    chargerTableau();
                                  }).catch(() => toast.error('Erreur mise à jour.'));
                                }
                             }}>
                              ✏️
                            </button>

                          </td>
                        </tr>
                      ))}
                      {/* Ligne total */}
                      <tr style={{ background: '#e8f5e9', fontWeight: 'bold', borderTop: '2px solid #004d5a' }}>
                        <td style={{ padding: '8px' }}>TOTAL {section.titre}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.valeur_acquisition).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.acquisitions).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.cessions).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.valeur_brute).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.amortissement_anterieur).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.dotation_exercice).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {Number(section.total.amortissement_cumule).toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>
                          {Number(section.total.valeur_nette_comptable).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Total général */}
              <div style={{ background: '#004d5a', color: 'white', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '10px',
                  fontSize: '12px', fontWeight: 'bold' }}>
                  <span>TOTAL GÉNÉRAL</span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.valeur_acquisition).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.acquisitions).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.cessions).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.valeur_brute).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.amortissement_anterieur).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.dotation_exercice).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.amortissement_cumule).toLocaleString('fr-FR')}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {Number(tableau.total_general.valeur_nette_comptable).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}