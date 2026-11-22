import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { utilisateurService } from '../../services/api';
import { menuItems } from '../../components/Navigation';

const st = {
  fond: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 },
  boite: { background: 'white', borderRadius: '12px', padding: '25px', width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  input: { width: '100%', padding: '9px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333', fontSize: '12px' },
  bouton: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  boutonPlein: { background: '#004d5a', color: 'white', border: '2px solid #004d5a', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }
};

const FORM_VIDE = { id: null, nom: '', poste: '', email: '', onglets_autorises: [], actif: true };

// Gestion des utilisateurs d'une entreprise depuis l'espace super-admin :
// e-mail + poste de chaque personne, onglets cochés, mot de passe provisoire envoyé par mail, réinitialisation.
export default function ModalUtilisateursEntreprise({ entreprise, forfaits, onClose }) {
  const [liste, setListe] = useState([]);
  const [form, setForm] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [provisoire, setProvisoire] = useState(null); // { nom, email, mdp, mail }

  // Onglets que cette entreprise peut réellement avoir (selon son forfait et son régime TVA)
  const forfait = (forfaits || []).find((f) => f.id === entreprise.forfait_id);
  const modules = (forfait && forfait.modules_actifs) || [];
  const onglets = menuItems.filter((m) => !m.proprietaire
    && (!m.module || modules.includes(m.module))
    && (!m.tva || entreprise.assujettie_tva));

  const charger = useCallback(async () => {
    try {
      const r = await utilisateurService.lister(entreprise.id);
      setListe(r.data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur de chargement.'); }
  }, [entreprise.id]);
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
        await utilisateurService.modifier(entreprise.id, form.id, { nom: form.nom, poste: form.poste, actif: form.actif, onglets_autorises: form.onglets_autorises });
        toast.success('Utilisateur modifié.');
      } else {
        const r = await utilisateurService.creer(entreprise.id, form);
        setProvisoire({ nom: form.nom, email: form.email, mdp: r.data.mot_de_passe_provisoire, mail: r.data.mail_envoye });
      }
      setForm(null);
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
    finally { setEnCours(false); }
  }

  async function reinitialiser(u) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.nom} ? Un nouveau mot de passe provisoire sera envoyé à ${u.email}.`)) return;
    try {
      const r = await utilisateurService.resetMdp(entreprise.id, u.id);
      setProvisoire({ nom: u.nom, email: u.email, mdp: r.data.mot_de_passe_provisoire, mail: r.data.mail_envoye });
      charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function supprimer(u) {
    if (!window.confirm(`Supprimer ${u.nom} ? Cette personne ne pourra plus se connecter.`)) return;
    try { await utilisateurService.supprimer(entreprise.id, u.id); toast.success('Utilisateur supprimé.'); charger(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  const nomOnglet = (path) => (menuItems.find((m) => m.path === path) || {}).label || path;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  return (
    <div style={st.fond}>
      <div style={st.boite}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#004d5a', margin: 0 }}>👥 Utilisateurs — {entreprise.nom}</h3>
          <button style={st.bouton} onClick={onClose}>Fermer</button>
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          Chaque personne se connecte avec son e-mail et ne voit que les onglets cochés. Le compte de l'entreprise voit toujours tout.
          Les mots de passe sont stockés chiffrés : ils ne peuvent pas être relus, seulement réinitialisés.
        </p>

        {provisoire && (
          <div style={{ background: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '8px', padding: '12px', margin: '10px 0', fontSize: '13px' }}>
            <strong>Mot de passe provisoire de {provisoire.nom} ({provisoire.email}) :</strong>{' '}
            <code style={{ fontSize: '16px', background: 'white', padding: '2px 8px', borderRadius: '4px' }}>{provisoire.mdp}</code>
            <div style={{ marginTop: '6px', color: provisoire.mail ? '#2e7d32' : '#c62828' }}>
              {provisoire.mail ? '✉️ Envoyé par mail à cette adresse.' : '⚠️ Le mail n\'a pas pu être envoyé : transmets-lui ce mot de passe toi-même.'}
              {' '}Il ne sera plus affiché après fermeture de ce message.
            </div>
            <button style={{ ...st.bouton, marginTop: '8px' }} onClick={() => setProvisoire(null)}>J'ai noté, fermer</button>
          </div>
        )}

        {!form && <button style={st.boutonPlein} onClick={() => setForm({ ...FORM_VIDE })}>+ Nouvel utilisateur</button>}

        {form && (
          <form onSubmit={enregistrer} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', margin: '12px 0' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#004d5a' }}>{form.id ? 'Modifier' : 'Nouvel'} utilisateur</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={st.label}>Nom *</label><input style={st.input} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
              <div><label style={st.label}>Poste (libre : Comptable, Agent facturation…)</label><input style={st.input} value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={st.label}>E-mail de connexion * {!form.id && '(le mot de passe provisoire y sera envoyé)'}</label>
                <input style={{ ...st.input, background: form.id ? '#f5f5f5' : 'white' }} type="email" value={form.email} disabled={!!form.id}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <label style={st.label}>Onglets visibles</label>
              <div style={{ marginBottom: '8px' }}>
                <button type="button" style={st.bouton} onClick={() => setForm({ ...form, onglets_autorises: onglets.map((o) => o.path) })}>Tout cocher</button>{' '}
                <button type="button" style={st.bouton} onClick={() => setForm({ ...form, onglets_autorises: [] })}>Tout décocher</button>
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
              <label style={{ display: 'block', marginTop: '12px', fontSize: '14px' }}>
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Compte actif (décocher pour interdire la connexion)
              </label>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button type="submit" style={st.boutonPlein} disabled={enCours}>{enCours ? 'Enregistrement…' : (form.id ? 'Enregistrer' : 'Créer et envoyer le mot de passe')}</button>
              <button type="button" style={st.bouton} onClick={() => setForm(null)}>Annuler</button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '14px' }}>
          {liste.length === 0 ? <p style={{ color: '#888' }}>Aucun utilisateur pour cette entreprise.</p> : liste.map((u) => (
            <div key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ opacity: u.actif ? 1 : 0.5, fontSize: '13px' }}>
                <div style={{ fontWeight: 'bold' }}>{u.nom}{u.poste ? ` — ${u.poste}` : ''}{!u.actif && ' (désactivé)'}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {u.email} · {u.doit_changer_mdp ? 'mot de passe provisoire non encore changé' : 'mot de passe personnel'} · dernière connexion : {fmtDate(u.derniere_connexion)}
                </div>
                <div style={{ color: '#004d5a', fontSize: '12px', marginTop: '3px' }}>
                  {(u.onglets_autorises || []).length ? u.onglets_autorises.map(nomOnglet).join(' · ') : 'Aucun onglet'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '260px' }}>
                <button style={st.bouton} onClick={() => setForm({ ...FORM_VIDE, ...u, poste: u.poste || '' })}>Modifier</button>
                <button style={st.bouton} onClick={() => reinitialiser(u)}>🔑 Réinitialiser</button>
                <button style={st.bouton} onClick={() => supprimer(u)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
