import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

// ───────── Éléments partagés par les pages Bilan et Compte de résultat ─────────

export const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  th: { padding: '8px 12px', textAlign: 'right', fontSize: '12px' }
};

export const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/** Charge l'état financier calculé (bilan ou compte de résultat) pour un exercice. */
export function useEtat(vue, entrepriseId, annee) {
  const [etat, setEtat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setEtat(null);
    api.get(`/comptabilite/etats/${vue}/${entrepriseId}/${annee}`)
      .then(res => { if (!annule) setEtat(res.data); })
      .catch(() => { if (!annule) toast.error('Erreur chargement des états financiers.'); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [vue, entrepriseId, annee, rev]);

  return { etat, loading, recharger: () => setRev(x => x + 1) };
}

export function SelecteurAnnee({ annee, setAnnee }) {
  const courante = new Date().getFullYear();
  return (
    <select style={{ ...styles.input, width: '120px' }}
      value={annee} onChange={e => setAnnee(Number(e.target.value))}>
      {Array.from({ length: 5 }, (_, i) => courante - 2 + i).map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  );
}

/** Seul bouton d'action des états : « Clôturer l'exercice ». */
export function BoutonCloture({ entrepriseId, annee, etat, onDone }) {
  const [enCours, setEnCours] = useState(false);
  const clos = etat && etat.exercice && etat.exercice.statut === 'CLOS';
  const courante = new Date().getFullYear();
  if (!etat || !etat.disponible || clos) return null;

  async function cloturer() {
    const anneeNonTerminee = annee >= courante && new Date() < new Date(annee, 11, 31);
    let message =
      `Clôturer l'exercice ${annee} ?\n\n` +
      `• Les écritures de ${annee} ne seront plus modifiées.\n` +
      `• La valeur du stock au 31/12/${annee} est celle enregistrée à cet instant.\n` +
      `• Les soldes seront reportés à l'ouverture de l'exercice ${annee + 1}.`;
    if (anneeNonTerminee) {
      message = `⚠️ L'exercice ${annee} n'est pas encore terminé (31/12/${annee}).\n\n` + message;
    }
    if (!window.confirm(message)) return;
    setEnCours(true);
    try {
      await api.post('/comptabilite/etats/cloture', { entreprise_id: entrepriseId, annee });
      toast.success(`Exercice ${annee} clôturé. L'état ${annee + 1} est maintenant disponible.`);
      onDone();
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Erreur lors de la clôture.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
      disabled={enCours} onClick={cloturer}>
      {enCours ? '⏳ Clôture...' : "🔒 Clôturer l'exercice"}
    </button>
  );
}

/** Bandeau d'information : disponibilité, dernière mise à jour, alertes. */
export function BandeauEtat({ etat, annee }) {
  if (!etat) return null;
  if (!etat.disponible) {
    return (
      <div style={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: '8px',
        padding: '15px', marginBottom: '20px', color: '#e65100', fontSize: '14px' }}>
        ⏳ {etat.message || `L'état financier ${annee} n'est pas encore disponible.`}
      </div>
    );
  }
  const clos = etat.exercice && etat.exercice.statut === 'CLOS';
  const maj = etat.dernierCalcul && etat.dernierCalcul.fin
    ? new Date(etat.dernierCalcul.fin).toLocaleString('fr-FR') : null;
  const ecart = etat.controles && etat.controles.equilibreBilan && !etat.controles.equilibreBilan.ok
    ? etat.controles.equilibreBilan.ecart : 0;
  const nbAClasser = (etat.controles && etat.controles.nbAClasser) || 0;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        fontSize: '12px', color: '#666' }}>
        <span style={{ padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold',
          background: clos ? '#e8f5e9' : '#e3f2fd', color: clos ? '#2e7d32' : '#1565c0' }}>
          {clos ? `🔒 Exercice ${annee} clôturé` : `Exercice ${annee} en cours`}
        </span>
        <span>
          {maj ? `Mis à jour le ${maj}` : 'Pas encore calculé — le premier calcul a lieu cette nuit.'}
          {' '}(calcul automatique chaque jour)
        </span>
      </div>
      {Math.abs(ecart) >= 1 && (
        <div style={{ background: '#ffebee', border: '1px solid #c62828', borderRadius: '8px',
          padding: '12px', marginTop: '10px', color: '#c62828', fontSize: '13px' }}>
          ⚠️ Le bilan n'est pas équilibré (écart de {fmt(Math.abs(ecart))} Ar). Contactez le support.
        </div>
      )}
      {nbAClasser > 0 && (
        <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: '8px',
          padding: '12px', marginTop: '10px', color: '#8d6e00', fontSize: '13px' }}>
          ℹ️ {nbAClasser} écriture(s) utilisent un compte hors plan comptable : elles figurent sur la ligne « À classer ».
        </div>
      )}
      {etat.niveauDetail && etat.niveauDetail !== 'COMPLET' && (
        <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '12px', marginTop: '10px',
          color: '#1565c0', fontSize: '12px' }}>
          ℹ️ Certains comptes sont saisis sur 2 chiffres : ils sont regroupés sur une seule ligne.
          Utilisez 3 chiffres (ex. 411, 401, 607) pour obtenir le détail complet.
        </div>
      )}
    </div>
  );
}