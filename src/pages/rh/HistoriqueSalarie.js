import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { rhService } from '../../services/api';

// Types proposés (doivent correspondre à ceux acceptés par le back)
export const TYPES_HISTORIQUE = {
  ABSENCE: { label: 'Absence', icone: '📅', bg: '#fff3e0', color: '#e65100' },
  MALADIE: { label: 'Maladie', icone: '🤒', bg: '#e3f2fd', color: '#1565c0' },
  RETARD: { label: 'Retard', icone: '⏰', bg: '#fff8e1', color: '#f57f17' },
  SANCTION: { label: 'Sanction', icone: '⚠️', bg: '#ffebee', color: '#c62828' },
  AVERTISSEMENT: { label: 'Avertissement', icone: '📢', bg: '#fce4ec', color: '#ad1457' },
  FORMATION: { label: 'Formation', icone: '🎓', bg: '#e8f5e9', color: '#2e7d32' },
  PROMOTION: { label: 'Promotion / évolution', icone: '⭐', bg: '#f3e5f5', color: '#6a1b9a' },
  AUTRE: { label: 'Autre', icone: '📝', bg: '#eceff1', color: '#455a64' }
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const fr = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR') : '');
const vide = () => ({ type: 'ABSENCE', titre: '', date_debut: aujourdhui(), date_fin: '', details: '' });

const champ = {
  width: '100%', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '8px',
  fontSize: '13px', boxSizing: 'border-box'
};
const lbl = { display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333', fontSize: '12px' };

export default function HistoriqueSalarie({ salarie, onClose }) {
  const { entreprise } = useAuth();
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [form, setForm] = useState(null); // null = fermé ; { id?, ... }
  const [envoi, setEnvoi] = useState(false);
  const [filtre, setFiltre] = useState('TOUS');

  const charger = useCallback(async () => {
    try {
      const res = await rhService.getHistorique(entreprise.id, salarie.id);
      setLignes(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur chargement de l\'historique.');
    } finally {
      setChargement(false);
    }
  }, [entreprise.id, salarie.id]);

  useEffect(() => { charger(); }, [charger]);

  async function enregistrer(e) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    try {
      const { id, ...donnees } = form;
      if (id) await rhService.modifierHistorique(entreprise.id, id, donnees);
      else await rhService.ajouterHistorique(entreprise.id, salarie.id, donnees);
      toast.success(id ? 'Ligne modifiée.' : 'Ligne ajoutée à l\'historique.');
      setForm(null);
      await charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement.');
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(l) {
    if (!window.confirm(`Supprimer « ${l.titre} » de l'historique ?`)) return;
    try {
      await rhService.supprimerHistorique(entreprise.id, l.id);
      toast.success('Ligne supprimée.');
      await charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression.');
    }
  }

  const affichees = lignes.filter(l => filtre === 'TOUS' || l.type === filtre);
  const typesPresents = [...new Set(lignes.map(l => l.type))];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '760px',
        maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#004d5a' }}>📜 Historique — {salarie.nom} {salarie.prenom || ''}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
              {salarie.matricule}{salarie.fonction ? ` · ${salarie.fonction}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ background: '#e3f2fd', color: '#0d47a1', padding: '8px 12px', borderRadius: '8px',
          fontSize: '12px', margin: '10px 0 14px' }}>
          ℹ️ À titre d'information uniquement : ces lignes n'ont aucun effet sur les fiches de paie,
          les congés ou les cotisations.
        </p>

        {form ? (
          <form onSubmit={enregistrer} style={{ background: '#fafafa', border: '1px solid #e0e0e0',
            borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
            <strong style={{ color: '#004d5a', fontSize: '13px' }}>
              {form.id ? '✏️ Modifier la ligne' : '➕ Nouvelle ligne'}
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div>
                <label style={lbl}>Type</label>
                <select style={champ} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPES_HISTORIQUE).map(([k, t]) => <option key={k} value={k}>{t.icone} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date (début) *</label>
                <input type="date" style={champ} required value={form.date_debut}
                  onChange={e => setForm({ ...form, date_debut: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Date de fin (facultatif)</label>
                <input type="date" style={champ} value={form.date_fin || ''} min={form.date_debut}
                  onChange={e => setForm({ ...form, date_fin: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={lbl}>Titre *</label>
              <input style={champ} required maxLength={200} value={form.titre}
                placeholder="Ex. : Repos médical 2 jours, Avertissement écrit, Formation sécurité…"
                onChange={e => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={lbl}>Détails (facultatif)</label>
              <textarea style={{ ...champ, minHeight: '70px', fontFamily: 'inherit' }} maxLength={2000}
                value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={() => setForm(null)}
                style={{ background: 'white', color: '#555', border: '2px solid #bbb', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={envoi}
                style={{ background: '#004d5a', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', opacity: envoi ? 0.6 : 1 }}>
                {envoi ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['TOUS', ...typesPresents].map(t => (
                <button key={t} onClick={() => setFiltre(t)}
                  style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px',
                    fontWeight: 'bold', background: filtre === t ? '#004d5a' : '#e0e0e0', color: filtre === t ? 'white' : '#333' }}>
                  {t === 'TOUS' ? 'Tout' : TYPES_HISTORIQUE[t]?.label || t}
                </button>
              ))}
            </div>
            <button onClick={() => setForm(vide())}
              style={{ background: '#004d5a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              + Ajouter une ligne
            </button>
          </div>
        )}

        {chargement ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Chargement…</div>
        ) : affichees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '13px' }}>
            Aucun élément dans l'historique.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {affichees.map(l => {
              const t = TYPES_HISTORIQUE[l.type] || TYPES_HISTORIQUE.AUTRE;
              return (
                <div key={l.id} style={{ border: '1px solid #eee', borderLeft: `4px solid ${t.color}`, borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: t.bg, color: t.color }}>
                        {t.icone} {t.label}
                      </span>
                      <strong style={{ marginLeft: '8px', fontSize: '13px' }}>{l.titre}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {fr(l.date_debut)}{l.date_fin && l.date_fin !== l.date_debut ? ` → ${fr(l.date_fin)}` : ''}
                      </div>
                      {l.details && <div style={{ fontSize: '12px', color: '#444', marginTop: '6px', whiteSpace: 'pre-wrap' }}>{l.details}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button title="Modifier" onClick={() => setForm({ ...l, date_fin: l.date_fin || '' })}
                        style={{ background: 'white', border: '2px solid #004d5a', borderRadius: '6px', cursor: 'pointer', padding: '2px 8px' }}>✏️</button>
                      <button title="Supprimer" onClick={() => supprimer(l)}
                        style={{ background: 'white', border: '2px solid #c62828', borderRadius: '6px', cursor: 'pointer', padding: '2px 8px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
