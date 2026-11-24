import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  DELAIS_RAPPEL, aujourdhuiLocal, etatRappel, estActif, libelleEcheance, trierRappels
} from '../utils/penseBete';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const entete = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const COULEURS = {
  RETARD: '#c62828', AUJOURDHUI: '#e65100', BIENTOT: '#f9a825', A_VENIR: '#78909c', FERME: '#9e9e9e'
};
const fmtDate = d => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

// Rappels de l'entreprise (chargés une fois ; le dashboard s'en sert aussi pour le compteur de l'onglet)
export function useRappels(entrepriseId) {
  const [rappels, setRappels] = useState([]);

  const charger = useCallback(async () => {
    if (!entrepriseId) return;
    try {
      const res = await fetch(`${API_URL}/api/pense-bete/${entrepriseId}`, { headers: entete() });
      const data = await res.json();
      if (data.success) setRappels(data.data);
    } catch (e) { /* le pense-bête ne doit jamais bloquer le dashboard */ }
  }, [entrepriseId]);

  useEffect(() => { charger(); }, [charger]);

  async function appeler(methode, url, corps) {
    const res = await fetch(`${API_URL}/api/pense-bete/${entrepriseId}${url}`,
      { method: methode, headers: entete(), body: corps ? JSON.stringify(corps) : undefined });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Erreur.');
    return data;
  }

  async function ajouter(valeurs) {
    try { await appeler('POST', '', valeurs); await charger(); toast.success('Rappel ajouté.'); return true; }
    catch (e) { toast.error(e.message); return false; }
  }
  async function modifier(id, valeurs) {
    try { await appeler('PATCH', `/${id}`, valeurs); await charger(); return true; }
    catch (e) { toast.error(e.message); return false; }
  }
  async function supprimer(id) {
    try { await appeler('DELETE', `/${id}`); await charger(); return true; }
    catch (e) { toast.error(e.message); return false; }
  }

  const aujourdhui = aujourdhuiLocal();
  const actifs = rappels.filter(r => estActif(r, aujourdhui));
  return { rappels, actifs, ajouter, modifier, supprimer };
}

const champ = {
  width: '100%', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '6px',
  fontSize: '13px', boxSizing: 'border-box'
};
const petitBouton = (couleur) => ({
  background: 'white', color: couleur, border: `1px solid ${couleur}`, padding: '4px 10px',
  borderRadius: '16px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap'
});

function FormulaireRappel({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { titre: '', note: '', date_echeance: aujourdhuiLocal(), rappel_jours_avant: 3 });
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e) {
    e.preventDefault();
    if (!f.titre.trim()) return toast.error('Écris ce dont tu veux te souvenir.');
    if (!f.date_echeance) return toast.error('Choisis une date.');
    setEnCours(true);
    const ok = await onSave({
      titre: f.titre, note: f.note || '', date_echeance: f.date_echeance, rappel_jours_avant: Number(f.rappel_jours_avant)
    });
    setEnCours(false);
    if (ok) onCancel();
  }

  return (
    <form onSubmit={soumettre} style={{ background: '#f4f9fa', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>À ne pas oublier *</label>
          <input style={champ} value={f.titre} maxLength={120} placeholder="Ex. : renouveler l'assurance du camion"
            onChange={e => setF({ ...f, titre: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Date *</label>
          <input style={champ} type="date" value={f.date_echeance}
            onChange={e => setF({ ...f, date_echeance: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Me prévenir</label>
          <select style={champ} value={f.rappel_jours_avant}
            onChange={e => setF({ ...f, rappel_jours_avant: e.target.value })}>
            {DELAIS_RAPPEL.map(d => <option key={d.jours} value={d.jours}>{d.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Note (facultatif)</label>
        <input style={champ} value={f.note || ''} maxLength={500} onChange={e => setF({ ...f, note: e.target.value })} />
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={enCours} style={{
          background: '#004d5a', color: 'white', border: 'none', padding: '8px 18px',
          borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
        }}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" onClick={onCancel} style={{
          background: 'white', color: '#555', border: '1px solid #ccc', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
        }}>Annuler</button>
      </div>
    </form>
  );
}

export default function PenseBete({ pb, cardStyle }) {
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState(null);       // id du rappel en cours de modification
  const [voirFermes, setVoirFermes] = useState(false);
  const aujourdhui = aujourdhuiLocal();

  const ouverts = trierRappels(pb.rappels.filter(r => !r.ferme));
  const fermes = trierRappels(pb.rappels.filter(r => r.ferme));

  async function supprimer(r) {
    if (window.confirm(`Supprimer le rappel « ${r.titre} » ?`)) await pb.supprimer(r.id);
  }

  function ligne(r) {
    const etat = etatRappel(r, aujourdhui);
    const couleur = COULEURS[etat];
    const urgent = etat === 'RETARD' || etat === 'AUJOURDHUI' || etat === 'BIENTOT';
    if (edition === r.id) {
      return (
        <FormulaireRappel key={`edit-${r.id}`} initial={{ titre: r.titre, note: r.note || '', date_echeance: r.date_echeance, rappel_jours_avant: r.rappel_jours_avant }}
          onSave={v => pb.modifier(r.id, v)} onCancel={() => setEdition(null)} />
      );
    }
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: '8px', borderLeft: `4px solid ${couleur}`,
        background: urgent ? `${couleur}18` : '#fafafa', opacity: etat === 'FERME' ? 0.65 : 1
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: urgent ? 'bold' : 'normal', color: '#333' }}>
            {urgent && (etat === 'RETARD' ? '🔴 ' : '🔔 ')}{r.titre}
          </div>
          <div style={{ fontSize: '12px', color: urgent ? couleur : '#777', fontWeight: urgent ? 'bold' : 'normal' }}>
            {fmtDate(r.date_echeance)}{etat !== 'FERME' && ` · ${libelleEcheance(r, aujourdhui)}`}
          </div>
          {r.note && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{r.note}</div>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {etat === 'FERME'
            ? <button style={petitBouton('#004d5a')} onClick={() => pb.modifier(r.id, { ferme: false })}>↩ Rouvrir</button>
            : <>
                <button style={petitBouton('#2e7d32')} onClick={() => pb.modifier(r.id, { ferme: true })}>✅ Fait, fermer</button>
                <button style={petitBouton('#004d5a')} title="Modifier" onClick={() => setEdition(r.id)}>✏️</button>
              </>}
          <button style={petitBouton('#c62828')} title="Supprimer" onClick={() => supprimer(r)}>🗑</button>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <h3 style={{ color: '#004d5a', margin: 0, flex: 1 }}>
          📝 Pense-bête{pb.actifs.length > 0 && <span style={{ color: '#c62828' }}> ({pb.actifs.length} à voir)</span>}
        </h3>
        {!ajout && (
          <button onClick={() => { setAjout(true); setEdition(null); }} style={{
            background: '#004d5a', color: 'white', border: 'none', padding: '7px 14px',
            borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
          }}>+ Ajouter un rappel</button>
        )}
      </div>

      {ajout && <FormulaireRappel onSave={pb.ajouter} onCancel={() => setAjout(false)} />}

      {ouverts.length === 0 && !ajout && (
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
          Aucun rappel. Ajoute une date à ne pas oublier (renouvellement, réunion, échéance…) : elle apparaîtra ici
          quelques jours avant, jusqu'à ce que tu la fermes.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ouverts.map(r => <React.Fragment key={r.id}>{ligne(r)}</React.Fragment>)}
      </div>

      {fermes.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <button onClick={() => setVoirFermes(v => !v)} style={{
            background: 'none', border: 'none', color: '#004d5a', cursor: 'pointer', fontSize: '12px', padding: 0
          }}>
            {voirFermes ? '▾' : '▸'} Rappels fermés ({fermes.length}) — gardés 90 jours
          </button>
          {voirFermes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {fermes.map(r => <React.Fragment key={r.id}>{ligne(r)}</React.Fragment>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
