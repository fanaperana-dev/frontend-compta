import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const styles = {
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  cardTitre: { fontSize: '13px', color: '#666', marginBottom: '5px' },
  cardValeur: { fontSize: '22px', fontWeight: 'bold', color: '#004d5a' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }
};

const moisListe = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const COULEURS = ['#004d5a','#2e7d32','#c62828','#e65100','#1565c0',
  '#6a1b9a','#00838f','#558b2f','#d84315','#0277bd'];

const alertesFiscales = [
  { code: 'CNAPS_T1', debut: { mois: 3, jour: 1 }, fin: { mois: 3, jour: 30 },
    message: 'Déclaration 1er trimestre CNAPS, FMFP, OSTIE à faire avant le 30 avril',
    couleur: '#1565c0', icone: '🏦' },
  { code: 'CNAPS_T2', debut: { mois: 6, jour: 1 }, fin: { mois: 6, jour: 31 },
    message: 'Déclaration 2ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 juillet',
    couleur: '#1565c0', icone: '🏦' },
  { code: 'CNAPS_T3', debut: { mois: 9, jour: 1 }, fin: { mois: 9, jour: 31 },
    message: 'Déclaration 3ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 octobre',
    couleur: '#1565c0', icone: '🏦' },
  { code: 'CNAPS_T4', debut: { mois: 0, jour: 1 }, fin: { mois: 0, jour: 31 },
    message: 'Déclaration 4ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 janvier',
    couleur: '#1565c0', icone: '🏦' },
  { code: 'IRSA_B1', debut: { mois: 2, jour: 1 }, fin: { mois: 2, jour: 31 },
    message: 'Déclaration 1er bimestre IRSA à faire avant le 31 mars',
    couleur: '#c62828', icone: '💰' },
  { code: 'IRSA_B2', debut: { mois: 4, jour: 1 }, fin: { mois: 4, jour: 31 },
    message: 'Déclaration 2ème bimestre IRSA à faire avant le 31 mai',
    couleur: '#c62828', icone: '💰' },
  { code: 'IRSA_B3', debut: { mois: 6, jour: 1 }, fin: { mois: 6, jour: 31 },
    message: 'Déclaration 3ème bimestre IRSA à faire avant le 31 juillet',
    couleur: '#c62828', icone: '💰' },
  { code: 'IRSA_B4', debut: { mois: 8, jour: 1 }, fin: { mois: 8, jour: 30 },
    message: 'Déclaration 4ème bimestre IRSA à faire avant le 30 septembre',
    couleur: '#c62828', icone: '💰' },
  { code: 'IRSA_B5', debut: { mois: 10, jour: 1 }, fin: { mois: 10, jour: 30 },
    message: 'Déclaration 5ème bimestre IRSA à faire avant le 30 novembre',
    couleur: '#c62828', icone: '💰' },
  { code: 'IRSA_B6', debut: { mois: 0, jour: 1 }, fin: { mois: 0, jour: 31 },
    message: 'Déclaration 6ème bimestre IRSA à faire avant le 31 janvier',
    couleur: '#c62828', icone: '💰' },
  { code: 'IS_A1', debut: { mois: 5, jour: 1 }, fin: { mois: 5, jour: 15 },
    message: 'Paiement 1er acompte Impôt Synthétique à faire avant le 15 juin',
    couleur: '#e65100', icone: '📊' },
  { code: 'IS_A2', debut: { mois: 11, jour: 1 }, fin: { mois: 11, jour: 15 },
    message: 'Paiement 2ème acompte Impôt Synthétique à faire avant le 15 décembre',
    couleur: '#e65100', icone: '📊' },
  { code: 'IR_GERANT', debut: { mois: 4, jour: 1 }, fin: { mois: 4, jour: 15 },
    message: 'Déclaration Impôt sur le Revenu du gérant majoritaire à faire avant le 15 mai',
    couleur: '#6a1b9a', icone: '📋' }
];

function FiltresMois({ moisSelectionnes, onToggle, onReset }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {moisListe.map(m => (
        <button key={m} onClick={() => onToggle(m)}
          style={{
            padding: '4px 10px', borderRadius: '15px', border: 'none',
            cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
            background: moisSelectionnes.includes(m) ? '#004d5a' : '#e0e0e0',
            color: moisSelectionnes.includes(m) ? 'white' : '#333'
          }}>
          {m.substring(0, 3)}
        </button>
      ))}
      {moisSelectionnes.length > 0 && (
        <button onClick={onReset}
          style={{ padding: '4px 10px', borderRadius: '15px', border: 'none',
            cursor: 'pointer', fontSize: '11px', background: '#ffebee', color: '#c62828' }}>
          ✕ Reset
        </button>
      )}
    </div>
  );
}

function CarteChiffre({ titre, valeur, couleur, sousTitre }) {
  return (
    <div style={{ ...styles.card, borderLeft: `4px solid ${couleur}`, marginBottom: 0 }}>
      <div style={styles.cardTitre}>{titre}</div>
      <div style={{ ...styles.cardValeur, color: couleur }}>
        {Number(valeur || 0).toLocaleString('fr-FR')} Ar
      </div>
      {sousTitre && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{sousTitre}</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { entreprise } = useAuth();
  const [ongletActif, setOngletActif] = useState('tresorerie');
  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [categoriesActives, setCategoriesActives] = useState([]);
  const [filtreStatutTresorerie, setFiltreStatutTresorerie] = useState('TOUS');
  const [alertesFermees, setAlertesFermees] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerDonnees(); }, [moisSelectionnes, annee]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerAlertesFermees(); }, []);

  async function chargerDonnees() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        annee,
        ...(moisSelectionnes.length > 0 && { mois: moisSelectionnes.join(',') })
      });
      const res = await fetch(
        `http://localhost:5000/api/dashboard/${entreprise.id}?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (data.success) {
        setDonnees(data.data);
        if (categoriesActives.length === 0 && data.data.repartitionCategories) {
          setCategoriesActives(data.data.repartitionCategories.map(c => c.categorie));
        }
      }
    } catch (err) {
      toast.error('Erreur chargement dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function chargerAlertesFermees() {
    try {
      const res = await fetch(
        `http://localhost:5000/api/dashboard/${entreprise.id}/alertes-fermees`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (data.success) setAlertesFermees(data.data);
    } catch (err) {
      console.error('Erreur chargement alertes fermées.');
    }
  }

  async function fermerAlerte(code_alerte) {
    try {
      await fetch(
        `http://localhost:5000/api/dashboard/${entreprise.id}/alertes-fermees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ code_alerte })
        }
      );
      setAlertesFermees(prev => [...prev, code_alerte]);
    } catch (err) {
      toast.error('Erreur fermeture alerte.');
    }
  }

  function getAlertesFiscalesActives() {
    const aujourd_hui = new Date();
    const moisActuel = aujourd_hui.getMonth();
    const jourActuel = aujourd_hui.getDate();
    return alertesFiscales.filter(alerte => {
      if (alertesFermees.includes(alerte.code)) return false;
      const apresDebut = moisActuel > alerte.debut.mois ||
        (moisActuel === alerte.debut.mois && jourActuel >= alerte.debut.jour);
      const avantFin = moisActuel < alerte.fin.mois ||
        (moisActuel === alerte.fin.mois && jourActuel <= alerte.fin.jour);
      return apresDebut && avantFin;
    });
  }

  function toggleMois(mois) {
    setMoisSelectionnes(prev =>
      prev.includes(mois) ? prev.filter(m => m !== mois) : [...prev, mois]
    );
  }

  const onglets = [
    { id: 'tresorerie', label: '💰 Trésorerie' },
    { id: 'chiffres', label: '📊 Chiffres clés' },
    { id: 'categories', label: '📈 Par catégorie' },
    { id: 'alertes', label: '⚠️ Alertes' }
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;
  if (!donnees) return null;

  return (
    <div>
      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOngletActif(o.id)}
            style={{
              padding: '12px 20px', border: 'none', whiteSpace: 'nowrap',
              borderBottom: ongletActif === o.id ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent',
              color: ongletActif === o.id ? '#004d5a' : '#666',
              fontWeight: ongletActif === o.id ? 'bold' : 'normal',
              fontSize: '13px', cursor: 'pointer'
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ONGLET 1 — Trésorerie */}
      {ongletActif === 'tresorerie' && (
        <div>
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginRight: '8px' }}>Mois :</span>
                <FiltresMois moisSelectionnes={moisSelectionnes} onToggle={toggleMois} onReset={() => setMoisSelectionnes([])} />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginRight: '8px' }}>Statut :</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['TOUS', 'CREE', 'ENVOYEE', 'PAIEMENT_PARTIEL', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'ARCHIVEE'].map(s => (
                    <button key={s} onClick={() => setFiltreStatutTresorerie(s)}
                      style={{
                        padding: '4px 10px', borderRadius: '15px', border: 'none',
                        cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                        background: filtreStatutTresorerie === s ? '#004d5a' : '#e0e0e0',
                        color: filtreStatutTresorerie === s ? 'white' : '#333'
                      }}>
                      {s === 'TOUS' ? 'Tous' : s === 'CREE' ? '📝 Créée' : s === 'ENVOYEE' ? ' 📧 Envoyée' : s === 'PAIEMENT_PARTIEL' ? ' 💰 Paiement partiel' : s === 'PAYEE' ? '✅ Payée' : s === 'EN_RETARD' ? '⚠️ En retard' : s === 'ANNULEE' ? '❌ Annulée' : '📦 Archivée'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const facturesFiltrees = (donnees.toutesFacturesClients || []).filter(f => {
              const matchStatut = filtreStatutTresorerie === 'TOUS' || f.statut === filtreStatutTresorerie;
              const matchMois = moisSelectionnes.length === 0 || (() => {
                const date = f.statut === 'PAYEE' ? (f.date_paiement || f.date_facture) : f.date_facture;
                if (!date) return false;
                const d = new Date(date);
                const m = d.toLocaleString('fr-FR', { month: 'long' });
                const moisNorm = m.charAt(0).toUpperCase() + m.slice(1);
                return moisSelectionnes.includes(moisNorm);
              })();
              return matchStatut && matchMois;
            });

            const total = facturesFiltrees.reduce((s, f) => s + Number(f.montant_total || 0), 0);
            const couleur = filtreStatutTresorerie === 'PAYEE' ? '#2e7d32'
               : filtreStatutTresorerie === 'EN_RETARD' ? '#c62828'
               : filtreStatutTresorerie === 'ANNULEE' ? '#9e9e9e'
               : filtreStatutTresorerie === 'CREE' ? '#616161'
               : filtreStatutTresorerie === 'ENVOYEE' ? '#1565c0'
               : filtreStatutTresorerie === 'PAIEMENT_PARTIEL' ? '#e65100'
               : filtreStatutTresorerie === 'ARCHIVEE' ? '#6a1b9a'
               : '#004d5a';

            return (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <CarteChiffre
                    titre={`💰 Total factures clients — ${filtreStatutTresorerie === 'TOUS' ? 'Tous statuts' : filtreStatutTresorerie}`}
                    valeur={total} couleur={couleur}
                    sousTitre={`${facturesFiltrees.length} facture(s)`}
                  />
                </div>
                <div style={styles.card}>
                  <h3 style={{ color: '#004d5a', marginTop: 0 }}>📋 Factures clients — {facturesFiltrees.length} résultat(s)</h3>
                  {facturesFiltrees.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucune facture trouvée.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          {['N° Facture', 'Client', 'Date', 'Échéance', 'Montant', 'Statut'].map(h => (
                            <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                              color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {facturesFiltrees.map((f, i) => {
                          const cs = f.statut === 'PAYEE' ? { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Payée' }
                            : f.statut === 'EN_RETARD' ? { bg: '#ffebee', color: '#c62828', label: '⚠️ En retard' }
                            : f.statut === 'CREE' ? { bg: '#f5f5f5', color: '#616161', label: '📝 Créée' }
                            : f.statut === 'ENVOYEE' ? { bg: '#e3f2fd', color: '#1565c0', label: '📧 Envoyée' }
                            : f.statut === 'PAIEMENT_PARTIEL' ? { bg: '#fff3e0', color: '#e65100', label: '💰 Partiel' }
                            : f.statut === 'ANNULEE' ? { bg: '#fafafa', color: '#9e9e9e', label: '❌ Annulée' }
                            : { bg: '#f3e5f5', color: '#6a1b9a', label: '📦 Archivée' };
                          return (
                            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold', color: '#004d5a' }}>{f.numero_facture}</td>
                              <td style={{ padding: '10px' }}>{f.nom_client}</td>
                              <td style={{ padding: '10px', color: '#666' }}>
                                {f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '—'}
                              </td>
                              <td style={{ padding: '10px', color: '#666' }}>
                                {f.date_limite ? new Date(f.date_limite).toLocaleDateString('fr-FR') : '—'}
                              </td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                {Number(f.montant_total || 0).toLocaleString('fr-FR')} Ar
                              </td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                                  fontWeight: 'bold', background: cs.bg, color: cs.color }}>{cs.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#004d5a', color: 'white' }}>
                          <td colSpan={4} style={{ padding: '10px', fontWeight: 'bold' }}>TOTAL</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{total.toLocaleString('fr-FR')} Ar</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ONGLET 2 — Chiffres clés */}
      {ongletActif === 'chiffres' && (
        <div>
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginRight: '8px' }}>Année :</span>
                <input type="number" value={annee} onChange={e => setAnnee(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginRight: '8px' }}>Mois :</span>
                <FiltresMois moisSelectionnes={moisSelectionnes} onToggle={toggleMois} onReset={() => setMoisSelectionnes([])} />
              </div>
            </div>
          </div>

          {(() => {
            const graph = donnees.graphiqueParMois.filter(m =>
              moisSelectionnes.length === 0 || moisSelectionnes.includes(m.mois)
            );
            const totalRecettes = graph.reduce((s, m) => s + Number(m.recettes || 0), 0);
            const totalDepenses = graph.reduce((s, m) => s + Number(m.depenses || 0), 0);
            const soldeGlobal = graph.reduce((s, m) => s + Number(m.solde || 0), 0);
            const masseNet = graph.reduce((s, m) => s + Number(m.masseNet || 0), 0);
            const massePatronale = graph.reduce((s, m) => s + Number(m.massePatronale || 0), 0);
            const resultatNet = totalRecettes - totalDepenses;

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <CarteChiffre titre="💰 Chiffre d'affaires" valeur={totalRecettes} couleur="#2e7d32" />
                  <CarteChiffre titre="💸 Total dépenses" valeur={totalDepenses} couleur="#c62828" />
                  <CarteChiffre titre="📊 Solde global" valeur={soldeGlobal}
                    couleur={soldeGlobal >= 0 ? '#2149fa' : '#c62828'} />
                  <CarteChiffre titre="👥 Masse salariale nette" valeur={masseNet}
                    couleur="#1565c0" sousTitre="Salaires nets versés" />
                  <CarteChiffre titre="🏛️ Charges patronales" valeur={massePatronale}
                    couleur="#e65100" sousTitre="CNAPS + OSTIE patronal" />
                  <CarteChiffre titre="📈 Résultat net" valeur={resultatNet}
                    couleur={resultatNet >= 0 ? '#2e7d32' : '#c62828'} sousTitre="CA - Dépenses totales" />
                </div>
                <div style={styles.card}>
                  <h3 style={{ color: '#004d5a', marginTop: 0, marginBottom: '20px' }}>
                    📈 Recettes vs Dépenses — {annee}
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={donnees.graphiqueParMois} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" tickFormatter={m => m.substring(0, 3)} fontSize={11} />
                      <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={11} />
                      <Tooltip
                        formatter={(value, name) => [`${Number(value).toLocaleString('fr-FR')} Ar`,
                          name === 'recettes' ? 'Recettes' : name === 'depenses' ? 'Dépenses' : 'Solde']}
                        labelFormatter={l => `Mois : ${l}`}
                      />
                      <Legend formatter={name => name === 'recettes' ? 'Recettes' : name === 'depenses' ? 'Dépenses' : 'Solde'} />
                      <Bar dataKey="recettes" fill="#2e7d32" radius={[4,4,0,0]} />
                      <Bar dataKey="depenses" fill="#c62828" radius={[4,4,0,0]} />
                      <Bar dataKey="solde" fill="#2149fa" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ONGLET 3 — Par catégorie */}
      {ongletActif === 'categories' && (
        <div>
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginRight: '8px' }}>Mois :</span>
                <FiltresMois moisSelectionnes={moisSelectionnes} onToggle={toggleMois} onReset={() => setMoisSelectionnes([])} />
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Catégories :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {donnees.repartitionCategories.map(c => (
                  <button key={c.categorie}
                    onClick={() => setCategoriesActives(prev =>
                      prev.includes(c.categorie) ? prev.filter(x => x !== c.categorie) : [...prev, c.categorie]
                    )}
                    style={{
                      padding: '4px 10px', borderRadius: '15px', border: 'none',
                      cursor: 'pointer', fontSize: '11px',
                      background: categoriesActives.includes(c.categorie) ? '#004d5a' : '#e0e0e0',
                      color: categoriesActives.includes(c.categorie) ? 'white' : '#333'
                    }}>
                    {c.categorie}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={styles.card}>
              <h3 style={{ color: '#c62828', marginTop: 0 }}>💸 Dépenses par catégorie</h3>
              {(() => {
                const dataDepenses = donnees.repartitionCategories
                  .filter(c => categoriesActives.includes(c.categorie) && c.debit > 0)
                  .map(c => ({ name: c.categorie, value: c.debit }));
                if (dataDepenses.length === 0) return <p style={{ color: '#666', textAlign: 'center' }}>Aucune donnée.</p>;
                return (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={dataDepenses} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false} fontSize={10}>
                          {dataDepenses.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => [`${Number(v).toLocaleString('fr-FR')} Ar`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      {dataDepenses.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '4px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px',
                              background: COULEURS[i % COULEURS.length], borderRadius: '50%', marginRight: '6px' }}></span>
                            {d.name}
                          </td>
                          <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#c62828' }}>
                            {Number(d.value).toLocaleString('fr-FR')} Ar
                          </td>
                        </tr>
                      ))}
                    </table>
                  </>
                );
              })()}
            </div>

            <div style={styles.card}>
              <h3 style={{ color: '#2e7d32', marginTop: 0 }}>💰 Recettes par catégorie</h3>
              {(() => {
                const dataRecettes = donnees.repartitionCategories
                  .filter(c => categoriesActives.includes(c.categorie) && c.credit > 0)
                  .map(c => ({ name: c.categorie, value: c.credit }));
                if (dataRecettes.length === 0) return <p style={{ color: '#666', textAlign: 'center' }}>Aucune donnée.</p>;
                return (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={dataRecettes} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false} fontSize={10}>
                          {dataRecettes.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => [`${Number(v).toLocaleString('fr-FR')} Ar`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      {dataRecettes.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '4px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px',
                              background: COULEURS[i % COULEURS.length], borderRadius: '50%', marginRight: '6px' }}></span>
                            {d.name}
                          </td>
                          <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                            {Number(d.value).toLocaleString('fr-FR')} Ar
                          </td>
                        </tr>
                      ))}
                    </table>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 4 — Alertes */}
      {ongletActif === 'alertes' && (
        <div>
          {/* Alertes fiscales */}
          {getAlertesFiscalesActives().length > 0 && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>
                📅 Obligations fiscales en cours ({getAlertesFiscalesActives().length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getAlertesFiscalesActives().map(alerte => (
                  <div key={alerte.code} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 15px', borderRadius: '8px',
                    borderLeft: `4px solid ${alerte.couleur}`,
                    background: `${alerte.couleur}11`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{alerte.icone}</span>
                      <span style={{ fontSize: '13px', color: '#333', fontWeight: 'bold' }}>
                        {alerte.message}
                      </span>
                    </div>
                    <button onClick={() => fermerAlerte(alerte.code)}
                      style={{
                        background: alerte.couleur, color: 'white', border: 'none',
                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '15px'
                      }}>
                      ✅ Fait, fermer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factures clients en retard */}
          <div style={styles.card}>
            <h3 style={{ color: '#c62828', marginTop: 0 }}>
              ⚠️ Factures clients en retard ({donnees.alertes.facturesEnRetard.length})
            </h3>
            {donnees.alertes.facturesEnRetard.length === 0 ? (
              <p style={{ color: '#2e7d32' }}>✅ Aucune facture en retard !</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#ffebee' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>N° Facture</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Client</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.alertes.facturesEnRetard.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#004d5a' }}>{f.numero_facture}</td>
                      <td style={{ padding: '8px' }}>{f.nom_client}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#c62828', fontWeight: 'bold' }}>
                        {Number(f.montant_total).toLocaleString('fr-FR')} Ar
                      </td>
                      <td style={{ padding: '8px', color: '#c62828' }}>
                        {f.date_limite ? new Date(f.date_limite).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Fournisseurs en attente */}
          <div style={styles.card}>
            <h3 style={{ color: '#e65100', marginTop: 0 }}>
              🏭 Factures fournisseurs en attente ({donnees.alertes.fournEnAttente.length})
            </h3>
            {donnees.alertes.fournEnAttente.length === 0 ? (
              <p style={{ color: '#2e7d32' }}>✅ Aucune facture en attente !</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#fff3e0' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>N° Facture</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.alertes.fournEnAttente.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#004d5a' }}>{f.numero}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {Number(f.montant).toLocaleString('fr-FR')} Ar
                      </td>
                      <td style={{ padding: '8px', color: '#e65100' }}>
                        {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Tiers en attente */}
          <div style={styles.card}>
            <h3 style={{ color: '#1565c0', marginTop: 0 }}>
              🤝 Factures tiers en attente ({donnees.alertes.tiersEnAttente.length})
            </h3>
            {donnees.alertes.tiersEnAttente.length === 0 ? (
              <p style={{ color: '#2e7d32' }}>✅ Aucune facture en attente !</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#e3f2fd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>N° Facture</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Tiers</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.alertes.tiersEnAttente.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#004d5a' }}>{f.numero}</td>
                      <td style={{ padding: '8px' }}>{f.tiers}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {Number(f.montant).toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Salariés sans fiche de paie */}
          <div style={styles.card}>
            <h3 style={{ color: '#6a1b9a', marginTop: 0 }}>
              👥 Salariés sans fiche de paie ce mois ({donnees.alertes.salariesSansFiche.length})
            </h3>
            {donnees.alertes.jourActuel < 26 ? (
              <p style={{ color: '#666', fontSize: '13px' }}>
                ℹ️ Alerte active à partir du 26 du mois.
                Aujourd'hui : {donnees.alertes.jourActuel}/{new Date().toLocaleString('fr-FR', { month: 'long' })}.
              </p>
            ) : donnees.alertes.salariesSansFiche.length === 0 ? (
              <p style={{ color: '#2e7d32' }}>✅ Toutes les fiches de paie sont créées !</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f3e5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Matricule</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Prénom</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.alertes.salariesSansFiche.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#004d5a' }}>{s.matricule}</td>
                      <td style={{ padding: '8px' }}>{s.nom}</td>
                      <td style={{ padding: '8px' }}>{s.prenom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}