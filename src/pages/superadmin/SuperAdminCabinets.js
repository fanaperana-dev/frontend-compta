import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cabinetAdminService, entrepriseService } from '../../services/api';
import { menuItems } from '../../components/Navigation';

const st = {
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  input: { width: '100%', padding: '9px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333', fontSize: '12px' },
  bouton: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  boutonPlein: { background: '#004d5a', color: 'white', border: '2px solid #004d5a', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }
};
const FORM_VIDE = { id: null, nom: '', poste: '', email: '', onglets_autorises: [], entreprise_ids: [], actif: true };
const ongletsDisponibles = menuItems.filter((m) => !m.proprietaire);
const nomOnglet = (path) => (menuItems.find((m) => m.path === path) || {}).label || path;
const basculerDans = (liste, valeur) => (liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur]);

// Superadmin : cabinets, personnes de chaque cabinet, entreprises rattachées, et pour chaque personne
// les entreprises qu'elle peut ouvrir + les onglets visibles (les mêmes pour toutes ses entreprises).
export default function SuperAdminCabinets() {
  const [cabinets, setCabinets] = useState([]);
  const [toutesEntreprises, setToutesEntreprises] = useState([]);
  const [ouvert, setOuvert] = useState(null); // détail du cabinet ouvert
  const [nouveau, setNouveau] = useState(null);
  const [rattachement, setRattachement] = useState(null); // ids cochés en cours d'édition
  const [form, setForm] = useState(null);
  const [provisoire, setProvisoire] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([cabinetAdminService.lister(), entrepriseService.getAll()]);
      setCabinets(c.data.data || []);
      setToutesEntreprises(e.data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur de chargement.'); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const ouvrir = useCallback(async (id) => {
    try {
      const r = await cabinetAdminService.detail(id);
      setOuvert(r.data.data);
      setRattachement(null);
      setForm(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }, []);

  async function creerCabinet(e) {
    e.preventDefault();
    try {
      const r = await cabinetAdminService.creer(nouveau);
      toast.success('Cabinet créé.');
      setNouveau(null);
      await charger();
      ouvrir(r.data.data.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function basculerStatut() {
    const statut = ouvert.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    if (!window.confirm(statut === 'SUSPENDU' ? 'Suspendre ce cabinet ? Plus personne du cabinet ne pourra se connecter.' : 'Réactiver ce cabinet ?')) return;
    try { await cabinetAdminService.modifier(ouvert.id, { statut }); charger(); ouvrir(ouvert.id); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function supprimerCabinet() {
    if (!window.confirm(`Supprimer le cabinet ${ouvert.nom} et ses accès ? Les entreprises et leurs données ne sont pas touchées.`)) return;
    try { await cabinetAdminService.supprimer(ouvert.id); setOuvert(null); charger(); toast.success('Cabinet supprimé.'); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function enregistrerRattachement() {
    try {
      await cabinetAdminService.fixerEntreprises(ouvert.id, rattachement);
      toast.success('Entreprises du cabinet enregistrées.');
      charger(); ouvrir(ouvert.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function enregistrerPersonne(e) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    try {
      if (form.id) {
        await cabinetAdminService.modifierUtilisateur(ouvert.id, form.id, { nom: form.nom, poste: form.poste, actif: form.actif, onglets_autorises: form.onglets_autorises, entreprise_ids: form.entreprise_ids });
        toast.success('Personne modifiée.');
      } else {
        const r = await cabinetAdminService.creerUtilisateur(ouvert.id, form);
        setProvisoire({ nom: form.nom, email: form.email, mdp: r.data.mot_de_passe_provisoire, mail: r.data.mail_envoye });
      }
      ouvrir(ouvert.id); charger();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
    finally { setEnCours(false); }
  }

  async function reinitialiser(u) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.nom} ? Un nouveau mot de passe provisoire sera envoyé à ${u.email}.`)) return;
    try {
      const r = await cabinetAdminService.resetMdp(ouvert.id, u.id);
      setProvisoire({ nom: u.nom, email: u.email, mdp: r.data.mot_de_passe_provisoire, mail: r.data.mail_envoye });
      ouvrir(ouvert.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  async function supprimerPersonne(u) {
    if (!window.confirm(`Supprimer ${u.nom} ? Cette personne ne pourra plus se connecter.`)) return;
    try { await cabinetAdminService.supprimerUtilisateur(ouvert.id, u.id); ouvrir(ouvert.id); charger(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  }

  const nomEntreprise = (id) => (toutesEntreprises.find((e) => e.id === id) || {}).nom || '—';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <h2 style={{ color: '#004d5a', marginTop: 0 }}>🏛️ Cabinets</h2>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Un cabinet (comptable, cabinet RH…) se connecte avec son propre e-mail, voit la liste des entreprises que tu lui rattaches ici
        et ouvre celle qu'il veut sans se reconnecter. Chaque entreprise garde son forfait et ses modules.
      </p>

      <div style={st.card}>
        {!nouveau && <button style={st.boutonPlein} onClick={() => setNouveau({ nom: '', email: '' })}>+ Nouveau cabinet</button>}
        {nouveau && (
          <form onSubmit={creerCabinet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'end' }}>
            <div><label style={st.label}>Nom du cabinet *</label><input style={st.input} value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} required /></div>
            <div><label style={st.label}>E-mail de contact</label><input style={st.input} type="email" value={nouveau.email} onChange={(e) => setNouveau({ ...nouveau, email: e.target.value })} /></div>
            <button type="submit" style={st.boutonPlein}>Créer</button>
            <button type="button" style={st.bouton} onClick={() => setNouveau(null)}>Annuler</button>
          </form>
        )}
        <div style={{ marginTop: '14px' }}>
          {cabinets.length === 0 ? <p style={{ color: '#888', margin: 0 }}>Aucun cabinet pour le moment.</p> : cabinets.map((c) => (
            <div key={c.id} onClick={() => ouvrir(c.id)} style={{ padding: '10px 12px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: ouvert?.id === c.id ? '#e0f2f4' : 'transparent', borderRadius: '6px' }}>
              <div><strong>{c.nom}</strong>{c.statut === 'SUSPENDU' && <span style={{ color: '#c62828', marginLeft: '8px', fontSize: '12px' }}>(suspendu)</span>}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>{c.nb_utilisateurs} personne(s) · {c.nb_entreprises} entreprise(s)</div>
            </div>
          ))}
        </div>
      </div>

      {ouvert && (
        <div style={st.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ color: '#004d5a', margin: 0 }}>{ouvert.nom}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={st.bouton} onClick={basculerStatut}>{ouvert.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}</button>
              <button style={st.bouton} onClick={supprimerCabinet}>Supprimer</button>
              <button style={st.bouton} onClick={() => setOuvert(null)}>Fermer</button>
            </div>
          </div>

          <h4 style={{ color: '#004d5a', marginBottom: '6px' }}>Entreprises du cabinet</h4>
          {rattachement === null ? (
            <>
              <div style={{ fontSize: '13px', color: '#333' }}>{ouvert.entreprises.length ? ouvert.entreprises.map((e) => e.nom).join(' · ') : 'Aucune entreprise rattachée.'}</div>
              <button style={{ ...st.bouton, marginTop: '8px' }} onClick={() => setRattachement(ouvert.entreprises.map((e) => e.id))}>Modifier la liste</button>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', maxHeight: '240px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px' }}>
                {toutesEntreprises.map((e) => (
                  <label key={e.id} style={{ fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rattachement.includes(e.id)} onChange={() => setRattachement(basculerDans(rattachement, e.id))} /> {e.nom}
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: '6px 0' }}>Une entreprise retirée disparaît aussi de la liste de chaque personne du cabinet.</p>
              <button style={st.boutonPlein} onClick={enregistrerRattachement}>Enregistrer</button>{' '}
              <button style={st.bouton} onClick={() => setRattachement(null)}>Annuler</button>
            </>
          )}

          <h4 style={{ color: '#004d5a', margin: '22px 0 6px 0' }}>Personnes du cabinet</h4>
          {provisoire && (
            <div style={{ background: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '8px', padding: '12px', margin: '10px 0', fontSize: '13px' }}>
              <strong>Mot de passe provisoire de {provisoire.nom} ({provisoire.email}) :</strong>{' '}
              <code style={{ fontSize: '16px', background: 'white', padding: '2px 8px', borderRadius: '4px' }}>{provisoire.mdp}</code>
              <div style={{ marginTop: '6px', color: provisoire.mail ? '#2e7d32' : '#c62828' }}>
                {provisoire.mail ? '✉️ Envoyé par mail à cette adresse.' : '⚠️ Le mail n\'a pas pu être envoyé : transmets-lui ce mot de passe toi-même.'} Il ne sera plus affiché après fermeture.
              </div>
              <button style={{ ...st.bouton, marginTop: '8px' }} onClick={() => setProvisoire(null)}>J'ai noté, fermer</button>
            </div>
          )}
          {!form && <button style={st.boutonPlein} onClick={() => setForm({ ...FORM_VIDE })}>+ Nouvelle personne</button>}
          {form && (
            <form onSubmit={enregistrerPersonne} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '16px', margin: '12px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={st.label}>Nom *</label><input style={st.input} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
                <div><label style={st.label}>Poste (libre)</label><input style={st.input} value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></div>
                <div style={{ gridColumn: '1 / 3' }}>
                  <label style={st.label}>E-mail de connexion * {!form.id && '(le mot de passe provisoire y sera envoyé)'}</label>
                  <input style={{ ...st.input, background: form.id ? '#f5f5f5' : 'white' }} type="email" value={form.email} disabled={!!form.id} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <label style={st.label}>Entreprises que cette personne peut ouvrir</label>
                {ouvert.entreprises.length === 0 ? <p style={{ color: '#c62828', fontSize: '12px', margin: 0 }}>Rattache d'abord des entreprises au cabinet.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                    {ouvert.entreprises.map((e) => (
                      <label key={e.id} style={{ fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.entreprise_ids.includes(e.id)} onChange={() => setForm({ ...form, entreprise_ids: basculerDans(form.entreprise_ids, e.id) })} /> {e.nom}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '14px' }}>
                <label style={st.label}>Onglets visibles (les mêmes pour toutes ses entreprises)</label>
                <div style={{ marginBottom: '8px' }}>
                  <button type="button" style={st.bouton} onClick={() => setForm({ ...form, onglets_autorises: ongletsDisponibles.map((o) => o.path) })}>Tout cocher</button>{' '}
                  <button type="button" style={st.bouton} onClick={() => setForm({ ...form, onglets_autorises: [] })}>Tout décocher</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                  {ongletsDisponibles.map((o) => (
                    <label key={o.path} style={{ fontSize: '14px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.onglets_autorises.includes(o.path)} onChange={() => setForm({ ...form, onglets_autorises: basculerDans(form.onglets_autorises, o.path) })} /> {o.icon} {o.label}
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
          <div style={{ marginTop: '12px' }}>
            {ouvert.utilisateurs.length === 0 ? <p style={{ color: '#888' }}>Aucune personne dans ce cabinet.</p> : ouvert.utilisateurs.map((u) => (
              <div key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ opacity: u.actif ? 1 : 0.5, fontSize: '13px' }}>
                  <div style={{ fontWeight: 'bold' }}>{u.nom}{u.poste ? ` — ${u.poste}` : ''}{!u.actif && ' (désactivé)'}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {u.email} · {u.doit_changer_mdp ? 'mot de passe provisoire non encore changé' : 'mot de passe personnel'} · dernière connexion : {fmtDate(u.derniere_connexion)}
                  </div>
                  <div style={{ color: '#004d5a', fontSize: '12px', marginTop: '3px' }}>
                    Entreprises : {u.entreprise_ids.length ? u.entreprise_ids.map(nomEntreprise).join(', ') : 'aucune'}
                  </div>
                  <div style={{ color: '#004d5a', fontSize: '12px' }}>
                    Onglets : {(u.onglets_autorises || []).length ? u.onglets_autorises.map(nomOnglet).join(' · ') : 'aucun'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '260px' }}>
                  <button style={st.bouton} onClick={() => setForm({ ...FORM_VIDE, ...u, poste: u.poste || '' })}>Modifier</button>
                  <button style={st.bouton} onClick={() => reinitialiser(u)}>🔑 Réinitialiser</button>
                  <button style={st.bouton} onClick={() => supprimerPersonne(u)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
