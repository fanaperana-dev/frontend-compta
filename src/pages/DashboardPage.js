import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
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


// Régime fiscal de l'entreprise, déduit de la TVA :
//  - non assujettie à la TVA → impôt synthétique (IS), IRSA tous les deux mois
//  - assujettie à la TVA      → impôt sur les revenus (IR), IRSA tous les mois
// regime : 'TOUS' (toutes les entreprises), 'SYNTHETIQUE' ou 'REEL'
export const alertesFiscales = [
  { regime: 'TOUS', code: 'CNAPS_T1', debut: { mois: 3, jour: 1 }, fin: { mois: 3, jour: 30 },
    message: 'Déclaration 1er trimestre CNAPS, FMFP, OSTIE à faire avant le 30 avril',
    couleur: '#1565c0', icone: '🏦' },
  { regime: 'TOUS', code: 'CNAPS_T2', debut: { mois: 6, jour: 1 }, fin: { mois: 6, jour: 31 },
    message: 'Déclaration 2ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 juillet',
    couleur: '#1565c0', icone: '🏦' },
  { regime: 'TOUS', code: 'CNAPS_T3', debut: { mois: 9, jour: 1 }, fin: { mois: 9, jour: 31 },
    message: 'Déclaration 3ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 octobre',
    couleur: '#1565c0', icone: '🏦' },
  { regime: 'TOUS', code: 'CNAPS_T4', debut: { mois: 0, jour: 1 }, fin: { mois: 0, jour: 31 },
    message: 'Déclaration 4ème trimestre CNAPS, FMFP, OSTIE à faire avant le 31 janvier',
    couleur: '#1565c0', icone: '🏦' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B1', debut: { mois: 2, jour: 1 }, fin: { mois: 2, jour: 15 },
    message: 'IRSA 1er bimestre (janvier–février) : déclaration et paiement à faire avant le 15 mars',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B2', debut: { mois: 4, jour: 1 }, fin: { mois: 4, jour: 15 },
    message: 'IRSA 2ème bimestre (mars–avril) : déclaration et paiement à faire avant le 15 mai',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B3', debut: { mois: 6, jour: 1 }, fin: { mois: 6, jour: 15 },
    message: 'IRSA 3ème bimestre (mai–juin) : déclaration et paiement à faire avant le 15 juillet',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B4', debut: { mois: 8, jour: 1 }, fin: { mois: 8, jour: 15 },
    message: 'IRSA 4ème bimestre (juillet–août) : déclaration et paiement à faire avant le 15 septembre',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B5', debut: { mois: 10, jour: 1 }, fin: { mois: 10, jour: 15 },
    message: 'IRSA 5ème bimestre (septembre–octobre) : déclaration et paiement à faire avant le 15 novembre',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IRSA_B6', debut: { mois: 0, jour: 1 }, fin: { mois: 0, jour: 15 },
    message: 'IRSA 6ème bimestre (novembre–décembre) : déclaration et paiement à faire avant le 15 janvier',
    couleur: '#c62828', icone: '💰' },
  { regime: 'SYNTHETIQUE', code: 'IS_A1', debut: { mois: 2, jour: 1 }, fin: { mois: 2, jour: 31 },
    message: 'Paiement 1er acompte Impôt Synthétique à faire avant le 31 mars',
    couleur: '#e65100', icone: '📊' },
  { regime: 'SYNTHETIQUE', code: 'IS_A2', debut: { mois: 5, jour: 1 }, fin: { mois: 5, jour: 30 },
    message: 'Paiement 2ème acompte Impôt Synthétique à faire avant le 30 juin',
    couleur: '#e65100', icone: '📊' },
  // IRSA mensuel : le mois M se déclare et se paie avant le 15 du mois suivant
  ...moisListe.map((nom, i) => {
    const suivant = (i + 1) % 12;
    return {
      regime: 'REEL', code: `IRSA_M${String(i + 1).padStart(2, '0')}`,
      debut: { mois: suivant, jour: 1 }, fin: { mois: suivant, jour: 15 },
      message: `IRSA ${nom} : déclaration et paiement à faire avant le 15 ${moisListe[suivant].toLowerCase()}`,
      couleur: '#c62828', icone: '💰'
    };
  }),
  // Acomptes d'impôt sur les revenus : par bimestre, au plus tard le 15 du dernier mois de la période (LFI 2026)
  ...[['janvier–février', 1], ['mars–avril', 3], ['mai–juin', 5], ['juillet–août', 7], ['septembre–octobre', 9], ['novembre–décembre', 11]]
    .map(([periode, mois], i) => ({
      regime: 'REEL', code: `IR_AC_B${i + 1}`,
      debut: { mois, jour: 1 }, fin: { mois, jour: 15 },
      message: `Acompte Impôt sur les Revenus ${i + 1}${i === 0 ? 'er' : 'ème'} bimestre (${periode}) à payer avant le 15 ${moisListe[mois].toLowerCase()}`,
      couleur: '#e65100', icone: '📊'
    })),
  { regime: 'REEL', code: 'IR_GERANT', debut: { mois: 4, jour: 1 }, fin: { mois: 4, jour: 15 },
    message: 'Déclaration Impôt sur le Revenu du gérant majoritaire à faire avant le 15 mai',
    couleur: '#6a1b9a', icone: '📋' },
  // LFI 2026 : déclaration et paiement sur la plateforme dédiée, au plus tard le 31 janvier
  // pour les véhicules en service au 1er janvier (on suppose que toute entreprise a un véhicule)
  { regime: 'TOUS', code: 'TAXE_VEHICULE', debut: { mois: 0, jour: 1 }, fin: { mois: 0, jour: 31 },
    message: 'Taxe sur les véhicules à moteur : déclaration et paiement sur la plateforme dédiée à faire avant le 31 janvier',
    couleur: '#455a64', icone: '🚗' },
  { regime: 'TOUS', code: 'DROIT_COMM', debut: { mois: 3, jour: 1 }, fin: { mois: 3, jour: 30 },
    message: 'Droit de communication à déposer en avril',
    couleur: '#00695c', icone: '🗂️' }
];

// Taxe sur les véhicules à moteur : paiement en suspens pour le moment. Les alertes (taxe annuelle de janvier et
// véhicule acheté) sont masquées, pas supprimées : passer cette valeur à true pour les réafficher.
export const ALERTES_VEHICULE_ACTIVES = false;

// Véhicule ou moto acheté (d'après la description de la facture fournisseur) : la taxe sur les véhicules
// à moteur est à déclarer et à payer immédiatement. L'alerte se ferme avec « Fait, fermer ».
export function alerteDepuisVehicule(v) {
  const desc = String(v.description || '').trim();
  const court = desc.length > 80 ? `${desc.slice(0, 77)}…` : desc;
  return {
    code: v.code, couleur: '#455a64', icone: '🚗',
    message: `Véhicule acheté (facture ${v.numero}${v.fournisseur ? ` — ${v.fournisseur}` : ''}${court ? `, « ${court} »` : ''}) : taxe sur les véhicules à moteur à déclarer et à payer immédiatement sur la plateforme dédiée`
  };
}

// Alertes visibles à une date donnée pour une entreprise (pure, testable)
export function filtrerAlertes(alertes, { assujettie, fermees = [], date = new Date() }) {
  const regime = assujettie ? 'REEL' : 'SYNTHETIQUE';
  const moisActuel = date.getMonth();
  const jourActuel = date.getDate();
  return alertes.filter(alerte => {
    if (alerte.regime !== 'TOUS' && alerte.regime !== regime) return false;
    if (fermees.includes(alerte.code)) return false;
    const apresDebut = moisActuel > alerte.debut.mois ||
      (moisActuel === alerte.debut.mois && jourActuel >= alerte.debut.jour);
    const avantFin = moisActuel < alerte.fin.mois ||
      (moisActuel === alerte.fin.mois && jourActuel <= alerte.fin.jour);
    return apresDebut && avantFin;
  });
}


// Échéances à venir : alertes du régime de l'entreprise dont la période s'ouvre dans les `mois` prochains
// (celles déjà ouvertes sont affichées à part, dans « en cours »). Fonction pure, testable.
export function echeancesAVenir(alertes, { assujettie, fermees = [], date = new Date(), mois = 3 }) {
  const regime = assujettie ? 'REEL' : 'SYNTHETIQUE';
  const debutJour = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const limite = new Date(debutJour.getFullYear(), debutJour.getMonth() + mois, debutJour.getDate());
  const out = [];
  alertes.forEach(a => {
    if (a.regime !== 'TOUS' && a.regime !== regime) return;
    if (fermees.includes(a.code)) return;
    for (const an of [debutJour.getFullYear(), debutJour.getFullYear() + 1]) {
      const ouvre = new Date(an, a.debut.mois, a.debut.jour);
      const ferme = new Date(an, a.fin.mois, a.fin.jour);
      if (ferme < debutJour) continue;               // période passée
      if (ouvre <= debutJour) break;                 // déjà en cours : pas « à venir »
      if (ouvre <= limite) out.push({ ...a, ouvre, ferme });
      break;
    }
  });
  return out.sort((x, y) => x.ouvre - y.ouvre);
}


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


// Répartition par catégorie : barres horizontales classées (lisible même avec beaucoup de catégories).
// Les catégories au-delà des 10 premières sont regroupées dans « Autres » ; le détail complet reste dans le tableau.
function GraphiqueCategories({ data, couleur }) {
  const tri = [...data].sort((a, b) => b.value - a.value);
  const total = tri.reduce((s, d) => s + d.value, 0);
  const MAX = 10;
  const barres = tri.length <= MAX + 1 ? tri : [
    ...tri.slice(0, MAX),
    { name: `Autres (${tri.length - MAX})`, value: tri.slice(MAX).reduce((s, d) => s + d.value, 0) }
  ];
  const court = n => (n.length > 24 ? `${n.substring(0, 23)}…` : n);
  const pct = v => (total > 0 ? ((v / total) * 100).toFixed(1) : '0.0');
  return (
    <>
      <ResponsiveContainer width="100%" height={Math.max(160, barres.length * 34 + 30)}>
        <BarChart data={barres} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={10} />
          <YAxis type="category" dataKey="name" width={150} tickFormatter={court} fontSize={10} interval={0} />
          <Tooltip formatter={v => [`${Number(v).toLocaleString('fr-FR')} Ar (${pct(v)} %)`]} />
          <Bar dataKey="value" fill={couleur} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            {tri.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '4px' }}>{d.name}</td>
                <td style={{ padding: '4px', textAlign: 'right', color: '#666' }}>{pct(d.value)} %</td>
                <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: couleur }}>
                  {Number(d.value).toLocaleString('fr-FR')} Ar
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f5f5f5' }}>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Total</td>
              <td></td>
              <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{total.toLocaleString('fr-FR')} Ar</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { entreprise, moduleActif } = useAuth();
  const stocksActifs = !moduleActif || moduleActif('stocks');
  const [valeurStock, setValeurStock] = useState(null);   // valeur actuelle du stock (coût d'achat), null tant que non chargée
  const [ongletActif, setOngletActif] = useState('alertes');
  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [categoriesActives, setCategoriesActives] = useState([]);
  const [alertesFermees, setAlertesFermees] = useState([]);
  const [vehiculesAcquis, setVehiculesAcquis] = useState([]);
  const [tresorerie, setTresorerie] = useState(null);   // montants par mois de l'onglet Trésorerie

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerDonnees(); }, [moisSelectionnes, annee]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerTresorerie(); }, [annee]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerAlertesFermees(); chargerVehiculesAcquis(); chargerValeurStock(); }, []);

  async function chargerValeurStock() {
    try {
      const res = await fetch(
        `${API_URL}/api/stocks/etat/${entreprise.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (data.success) setValeurStock(Number(data.valeur_totale) || 0);
    } catch (err) {
      console.error('Erreur chargement valeur du stock.');
    }
  }

  async function chargerVehiculesAcquis() {
    try {
      const res = await fetch(
        `${API_URL}/api/dashboard/${entreprise.id}/vehicules-acquis`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (data.success) setVehiculesAcquis(data.data || []);
    } catch (err) {
      console.error('Erreur chargement véhicules acquis.');
    }
  }

  async function chargerTresorerie() {
    try {
      const res = await fetch(
        `${API_URL}/api/dashboard/${entreprise.id}/tresorerie?annee=${annee}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (data.success) setTresorerie(data.data);
      else toast.error(data.message || 'Erreur chargement trésorerie.');
    } catch (err) {
      toast.error('Erreur chargement trésorerie.');
    }
  }

  async function chargerDonnees() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        annee,
        ...(moisSelectionnes.length > 0 && { mois: moisSelectionnes.join(',') })
      });
      const res = await fetch(
        `${API_URL}/api/dashboard/${entreprise.id}?${params}`,
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
        `${API_URL}/api/dashboard/${entreprise.id}/alertes-fermees`,
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
        `${API_URL}/api/dashboard/${entreprise.id}/alertes-fermees`,
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

  // Calendrier fiscal sans la taxe véhicules tant qu'elle est masquée (voir ALERTES_VEHICULE_ACTIVES)
  function calendrierAlertes() {
    return ALERTES_VEHICULE_ACTIVES ? alertesFiscales : alertesFiscales.filter(a => a.code !== 'TAXE_VEHICULE');
  }

  function getAlertesFiscalesActives() {
    const vehicules = !ALERTES_VEHICULE_ACTIVES ? [] : vehiculesAcquis
      .filter(v => !alertesFermees.includes(v.code))
      .map(alerteDepuisVehicule);
    return [...vehicules, ...filtrerAlertes(calendrierAlertes(), {
      assujettie: entreprise?.assujettie_tva === true,
      fermees: alertesFermees
    })];
  }

  function toggleMois(mois) {
    setMoisSelectionnes(prev =>
      prev.includes(mois) ? prev.filter(m => m !== mois) : [...prev, mois]
    );
  }

  const onglets = [
    { id: 'alertes', label: '⚠️ Alertes' },
    { id: 'tresorerie', label: '💰 Trésorerie' },
    { id: 'chiffres', label: '📊 Chiffres clés' },
    { id: 'categories', label: '📈 Par catégorie' }
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

      {/* ONGLET 1 — Alertes (obligations fiscales) */}
      {ongletActif === 'alertes' && (
        <div>
          
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

          {getAlertesFiscalesActives().length === 0 && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>📅 Obligations fiscales</h3>
              <p style={{ color: '#2e7d32', margin: 0 }}>✅ Rien à déclarer ni à payer aujourd'hui. Voir le calendrier ci-dessous.</p>
            </div>
          )}

          {(() => {
            const aVenir = echeancesAVenir(calendrierAlertes(), { assujettie: entreprise?.assujettie_tva === true, fermees: alertesFermees });
            const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            return (
              <div style={styles.card}>
                <h3 style={{ color: '#004d5a', marginTop: 0 }}>🗓️ Calendrier — 3 prochains mois</h3>
                {aVenir.length === 0 ? (
                  <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Aucune échéance ne s'ouvre dans les 3 prochains mois.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aVenir.map(a => (
                      <div key={`${a.code}-${a.ouvre.getFullYear()}`} style={{
                        display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 14px',
                        borderRadius: '8px', borderLeft: `4px solid ${a.couleur}`, background: `${a.couleur}0d`
                      }}>
                        <span style={{ fontSize: '18px' }}>{a.icone}</span>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          <strong>{fmt(a.ouvre)} → {fmt(a.ferme)}</strong> — {a.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                  Calendrier indicatif selon le régime de l'entreprise (TVA : IR / IRSA mensuel ; sinon IS / IRSA bimestriel). L'état « fait » est une simple mémoire, il ne vérifie pas la déclaration.
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {/* ONGLET — Trésorerie : montants à encaisser / à payer par mois, marge estimative */}
      {ongletActif === 'tresorerie' && (
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
            <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
              Les montants sont classés par mois de la date de facture (salaires : mois de la fiche de paie). Sans mois coché, toute l'année est comptée.
            </div>
          </div>

          {(() => {
            const lignes = (tresorerie?.parMois || []).filter(m =>
              moisSelectionnes.length === 0 || moisSelectionnes.includes(m.mois));
            const somme = (k) => lignes.reduce((t, m) => t + Number(m[k] || 0), 0);
            const margeCa = somme('marge_ca'), marge = somme('marge');
            const taux = margeCa > 0 ? Math.round((marge / margeCa) * 1000) / 10 : null;
            const nb = (k) => lignes.reduce((t, m) => t + Number(m[k] || 0), 0);
            const colonnes = [
              { k: 'retard', t: 'Clients en retard' }, { k: 'envoyees', t: 'Clients envoyées' },
              { k: 'fournisseurs', t: 'Fournisseurs à payer' }, { k: 'tiers', t: 'Divers à payer' },
              { k: 'salaires', t: 'Salaires à payer' }, { k: 'marge', t: 'Marge estimative HT' }
            ];
            if (!tresorerie) return <div style={styles.card}>Chargement…</div>;
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <CarteChiffre titre="⚠️ Factures clients en retard" valeur={somme('retard')} couleur="#c62828"
                    sousTitre={`${nb('nb_retard')} facture(s) · reste à encaisser`} />
                  <CarteChiffre titre="📤 Factures clients envoyées" valeur={somme('envoyees')} couleur="#1565c0"
                    sousTitre={`${nb('nb_envoyees')} facture(s) envoyée(s), pas encore payée(s)`} />
                  <CarteChiffre titre="🏭 Factures fournisseurs à payer" valeur={somme('fournisseurs')} couleur="#e65100"
                    sousTitre="En attente ou payées en partie (reste à payer)" />
                  <CarteChiffre titre="🤝 Divers à payer" valeur={somme('tiers')} couleur="#6a1b9a"
                    sousTitre="Dépenses « divers » en attente (reste à payer)" />
                  <CarteChiffre titre="👥 Salaires à payer" valeur={somme('salaires')} couleur="#00838f"
                    sousTitre="Net des fiches de paie non encore payées" />
                  <CarteChiffre titre="📦 Marge estimative HT sur produits vendus" valeur={marge}
                    couleur={marge >= 0 ? '#2e7d32' : '#c62828'}
                    sousTitre={margeCa > 0
                      ? `Estimation HT : prix de vente HT (${margeCa.toLocaleString('fr-FR')} Ar) − coût d'achat HT moyen sorti du stock${taux !== null ? ` · ${taux.toLocaleString('fr-FR')} %` : ''}`
                      : "Estimation HT : prix de vente HT − coût d'achat HT des articles vendus. Aucune vente d'article du stock sur la période."} />
                </div>

                <div style={styles.card}>
                  <h3 style={{ color: '#004d5a', marginTop: 0 }}>📅 Détail par mois — {annee}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Mois</th>
                        {colonnes.map(c => <th key={c.k} style={{ padding: '8px', textAlign: 'right' }}>{c.t}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map(m => (
                        <tr key={m.mois} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#004d5a' }}>{m.mois}</td>
                          {colonnes.map(c => (
                            <td key={c.k} style={{ padding: '8px', textAlign: 'right', color: Number(m[c.k]) ? '#333' : '#bbb' }}>
                              {Number(m[c.k] || 0).toLocaleString('fr-FR')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td style={{ padding: '8px' }}>Total</td>
                        {colonnes.map(c => (
                          <td key={c.k} style={{ padding: '8px', textAlign: 'right' }}>{somme(c.k).toLocaleString('fr-FR')} Ar</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                    La marge est une estimation, hors taxes (HT) : elle ne porte que sur les ventes dont les lignes de facture désignent un article du stock,
                    avec le coût moyen de l'article au moment de la vente.
                  </div>
                </div>
              </>
            );
          })()}

          {/* Salariés sans fiche de paie */}
          <div style={styles.card}>
            <h3 style={{ color: '#6a1b9a', marginTop: 0 }}>
              👥 Salariés sans fiche de paie — {donnees.alertes.moisConcerne || 'mois précédent'} {donnees.alertes.anneeConcernee || ''} ({donnees.alertes.salariesSansFiche.length})
            </h3>
            {donnees.alertes.jourActuel < 5 ? (
              <p style={{ color: '#666', fontSize: '13px' }}>
                ℹ️ Alerte active à partir du 5 du mois (fiches du mois précédent).
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
            const autresProduits = graph.reduce((s, m) => s + Number(m.autresProduits || 0), 0);
            const horsResultat = donnees.totaux?.horsResultat || [];
            const soldeGlobal = graph.reduce((s, m) => s + Number(m.solde || 0), 0);
            const masseNet = graph.reduce((s, m) => s + Number(m.masseNet || 0), 0);
            const massePatronale = graph.reduce((s, m) => s + Number(m.massePatronale || 0), 0);

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <CarteChiffre titre="💰 Chiffre d'affaires (70x)" valeur={totalRecettes} couleur="#2e7d32"
                    sousTitre="Ventes encaissées hors TVA : comptes 70x uniquement" />
                  <CarteChiffre titre="💸 Charges (comptes 6)" valeur={totalDepenses} couleur="#c62828"
                    sousTitre="Achats et charges payés + salaires bruts et charges patronales, nets des recettes classées en 6" />
                  <CarteChiffre titre="📊 Résultat estimé" valeur={soldeGlobal}
                    couleur={soldeGlobal >= 0 ? '#2149fa' : '#c62828'}
                    sousTitre={`CA + autres produits${autresProduits ? ` (${Math.round(autresProduits).toLocaleString('fr-FR')} Ar)` : ''} − charges, sur encaissements et paiements : ce n'est ni une trésorerie ni un résultat comptable définitif`} />
                  <CarteChiffre titre="👥 Masse salariale nette" valeur={masseNet}
                    couleur="#1565c0" sousTitre="Salaires nets versés" />
                  <CarteChiffre titre="🏛️ Charges patronales" valeur={massePatronale}
                    couleur="#e65100" sousTitre="CNAPS + OSTIE patronal" />
                  {stocksActifs && (
                    <CarteChiffre titre="📦 Valeur du stock" valeur={valeurStock ?? 0}
                      couleur="#00838f" sousTitre="Valeur actuelle au coût d'achat (indépendante de l'année et des mois choisis)" />
                  )}
                </div>
                {horsResultat.length > 0 && (
                  <div style={styles.card}>
                    <h3 style={{ color: '#004d5a', marginTop: 0, marginBottom: '6px' }}>🔁 Mouvements hors résultat — {annee} (année entière)</h3>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
                      Argent qui a bougé sans être un produit ni une charge : stocks, immobilisations, comptes d'associés et de tiers, virements entre caisse et banque.
                    </div>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ textAlign: 'left', color: '#666' }}>
                        <th style={{ padding: '6px' }}>Nature</th><th style={{ padding: '6px', textAlign: 'right' }}>Entrées</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Sorties</th></tr></thead>
                      <tbody>{horsResultat.map(h => (
                        <tr key={h.nature} style={{ borderTop: '1px solid #eee' }}>
                          <td style={{ padding: '6px' }}>{h.nature}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{Math.round(h.entrees).toLocaleString('fr-FR')} Ar</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{Math.round(h.sorties).toLocaleString('fr-FR')} Ar</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                )}
                <div style={styles.card}>
                  <h3 style={{ color: '#004d5a', marginTop: 0, marginBottom: '20px' }}>
                    📈 Chiffre d'affaires vs charges — {annee}
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={donnees.graphiqueParMois} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" tickFormatter={m => m.substring(0, 3)} fontSize={11} />
                      <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={11} />
                      <Tooltip
                        formatter={(value, name) => [`${Number(value).toLocaleString('fr-FR')} Ar`,
                          name === 'recettes' ? "Chiffre d'affaires" : name === 'depenses' ? 'Charges' : 'Résultat estimé']}
                        labelFormatter={l => `Mois : ${l}`}
                      />
                      <Legend formatter={name => name === 'recettes' ? "Chiffre d'affaires" : name === 'depenses' ? 'Charges' : 'Résultat estimé'} />
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
                  <GraphiqueCategories data={dataDepenses} couleur='#c62828' />
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
                  <GraphiqueCategories data={dataRecettes} couleur='#2e7d32' />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}