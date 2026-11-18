import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { utilisateurService } from '../services/api';
import { menuItems } from '../components/Navigation';

const styles = {
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', maxWidth: '760px' },
  input: { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  bouton: { background: '#004d5a', color: 'white', border: '2px solid #004d5a', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  boutonClair: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};

const FORM_VIDE = { id: null, nom: '', poste: '', email: '', mot_de_passe: '', onglets_autorises: [], actif: true };

export default function UtilisateursPage() {
  const { entreprise, moduleActif } = useAuth();
  const [liste, setListe] = useState([]);
  const [form, setForm] = useState(null); // null = formulaire fermé
  const [enCours, setEnCours] = useState(false);

  // Onglets que l'entreprise peut réellement voir (forfait, TVA) : ce sont ceux qu'on peut cocher
  const onglets = menuItems.filter((m) => !m.proprietaire
    && (!m.module || moduleActif(m.module))
    && (!m.tva || entreprise?.assujettie_tva));

  const charger = useCallback(async () => {
    try {
      const r = await utilisateurService.lister();
      setListe(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement.');
    }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  function basculer(path) {
    const a = form.onglets_autorises;
    setForm({ ...form, onglets_autorises: a.includes(path) ? a.filter((x) => x !== path) : [...a, path] });
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    try {
      if (form.id) {
        const data = { nom: form.nom, poste: form.poste, actif: form.actif, onglets_autorises: form.onglets_autorises };
        if (form.mot_de_passe) data.mot_de_passe = form.mot_de_passe;
        await utilisateurService.modifier(form.id, data);
        toast.success('Utilisateur modifié.');
      } else {
        await utilisateurService.creer(form);
        toast.success('Utilisateur créé.');
      }
      setForm(null);
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(u) {
    if (!window.confirm(`Supprimer l'utilisateur ${u.nom} ? Il ne pourra plus se connecter.`)) return;
    try {
      await utilisateurService.supprimer(u.id);
      toast.success('Utilisateur supprimé.');
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  }

  const nomOnglet = (path) => (menuItems.find((m) => m.path === path) || {}).label || path;

  return (
    <div>
      <h2 style={{ color: '#004d5a', marginTop: 0 }}>👥 Utilisateurs</h2>
      <p style={{ color: '#666', fontSize: '13px', maxWidth: '760px' }}>
        Chaque personne se connecte avec son propre email et mot de passe. Elle ne voit que les onglets que vous cochez pour elle.
        Le compte de l'entreprise (le vôtre) voit toujours tout.
      </p>

      {!form && (
        <button style={styles.bouton} onClick={() => setForm({ ...FORM_VIDE })}>+ Nouvel utilisateur</button>
      )}

      {form && (
        <form onSubmit={enregistrer} style={{ ...styles.card, marginTop: '15px' }}>
          <h3 style={{ marginTop: 0, color: '#004d5a' }}>{form.id ? 'Modifier' : 'Nouvel'} utilisateur</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Nom *</label>
              <input style={styles.input} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <label style={styles.label}>Poste (libre, ex. Comptable, Agent facturation)</label>
              <input style={styles.input} value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Email de connexion *</label>
              <input style={{ ...styles.input, background: form.id ? '#f5f5f5' : 'white' }} type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!form.id} />
            </div>
            <div>
              <label style={styles.label}>{form.id ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe * (6 caractères minimum)'}</label>
              <input style={styles.input} type="text" autoComplete="new-password" value={form.mot_de_passe}
                onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} required={!form.id} minLength={form.id && !form.mot_de_passe ? 0 : 6} />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={styles.label}>Onglets visibles pour cette personne</label>
            <div style={{ marginBottom: '8px' }}>
              <button type="button" style={styles.boutonClair} onClick={() => setForm({ ...form, onglets_autorises: onglets.map((o) => o.path) })}>Tout cocher</button>{' '}
              <button type="button" style={styles.boutonClair} onClick={() => setForm({ ...form, onglets_autorises: [] })}>Tout décocher</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {onglets.map((o) => (
                <label key={o.path} style={{ fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.onglets_autorises.includes(o.path)} onChange={() => basculer(o.path)} /> {o.icon} {o.label}
                </label>
              ))}
            </div>
          </div>

          {form.id && (
            <label style={{ display: 'block', marginTop: '14px', fontSize: '14px' }}>
              <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Compte actif (décocher pour interdire la connexion)
            </label>
          )}

          <div style={{ marginTop: '18px', display: 'flex', gap: '10px' }}>
            <button type="submit" style={styles.bouton} disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" style={styles.boutonClair} onClick={() => setForm(null)}>Annuler</button>
          </div>
        </form>
      )}

      <div style={{ ...styles.card, marginTop: '20px' }}>
        {liste.length === 0 ? (
          <p style={{ color: '#888', margin: 0 }}>Aucun utilisateur pour le moment.</p>
        ) : liste.map((u) => (
          <div key={u.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ opacity: u.actif ? 1 : 0.5 }}>
              <div style={{ fontWeight: 'bold' }}>{u.nom}{u.poste ? ` — ${u.poste}` : ''}{!u.actif && ' (désactivé)'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
              <div style={{ fontSize: '12px', color: '#004d5a', marginTop: '4px' }}>
                {(u.onglets_autorises || []).length ? (u.onglets_autorises || []).map(nomOnglet).join(' · ') : 'Aucun onglet'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button style={styles.boutonClair} onClick={() => setForm({ ...FORM_VIDE, ...u, poste: u.poste || '', mot_de_passe: '' })}>Modifier</button>
              <button style={styles.boutonClair} onClick={() => supprimer(u)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
