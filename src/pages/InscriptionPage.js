import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ArivotekIcon from '../components/ArivotekIcon';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #004d5a 0%, #2e7d32 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '700px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '13px'
  },
  boutonPrimaire: {
    background: '#004d5a',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%'
  },
  section: {
    marginBottom: '25px',
    paddingBottom: '25px',
    borderBottom: '1px solid #e0e0e0'
  },
  sectionTitle: {
    color: '#004d5a',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
    marginTop: 0
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  }
};

const forfaits = [
  {
    key: 'Business',
    label: 'Business — 380 000 Ar/mois',
    description: 'Tous les modules : Clients, Factures, Fournisseurs, RH, Stocks, Immobilisations...'
  },
  {
    key: 'Start',
    label: 'Start — 150 000 Ar/mois',
    description: 'Clients, Factures, Journal, Dashboard'
  },
  {
    key: 'RH',
    label: 'RH — 150 000 Ar/mois',
    description: 'Ressources Humaines, Journal, Dashboard'
  }
];

const polices = ['Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Helvetica', 'Garamond', 'Trebuchet MS', 'Calibri'];

const couleursPredef = [
  { label: 'Bleu-vert', value: '#004d5a' },
  { label: 'Vert foncé', value: '#2e7d32' },
  { label: 'Bleu marine', value: '#1565c0' },
  { label: 'Rouge', value: '#c62828' },
  { label: 'Violet', value: '#6a1b9a' },
  { label: 'Orange', value: '#e65100' },
  { label: 'Gris foncé', value: '#333333' },
  { label: 'Noir', value: '#000000' },
  { label: 'Marron', value: '#4e342e' },
  { label: 'Bleu ciel', value: '#0288d1' }
];

export default function InscriptionPage() {
  const [etape, setEtape] = useState(1);
  const [enCours, setEnCours] = useState(false);
  const [demandeId, setDemandeId] = useState(null);
  const [form, setForm] = useState({
    // Infos générales
    nom: '',
    statut_juridique: '',
    capital: '',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    site_web: '',
    activite: '',
    // Infos fiscales
    nif: '',
    stat: '',
    rcs: '',
    numero_cnaps: '',
    // Config facturation
    prefixe_facture: 'FAC-',
    delai_paiement: 30,
    note_facture_defaut: '',
    mentions_legales: '',
    info_paiement: '',
    // Config RH
    nom_organisme_sante: 'OSTIE',
    taux_majoration_ferie: 1.5,
    // Personnalisation
    couleur_primaire: '#004d5a',
    couleur_secondaire: '#2e7d32',
    police_ecriture: 'Arial',
    // Forfait
    forfait_souhaite: 'Business'
  });

  const [fichiers, setFichiers] = useState({
    logo: null,
    signature_facture: null,
    signature_rh: null
  });

  async function soumettre() {
    if (!form.nom || !form.email || !form.telephone) {
      toast.error('Nom, email et téléphone sont obligatoires.');
      return;
    }

    setEnCours(true);
    try {
      // 1. Soumettre la demande
      const res = await axios.post(`${API_URL}/api/inscription`, form);
      const id = res.data.id || res.data.data?.id;
      setDemandeId(id);

      // 2. Uploader les fichiers si présents
      for (const [type, fichier] of Object.entries(fichiers)) {
        if (fichier && id) {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(fichier);
          });

          await axios.post(`${API_URL}/api/inscription/${id}/upload`, {
            fichier_base64: base64,
            nom_fichier: fichier.name,
            type_mime: fichier.type,
            type_image: type
          });
        }
      }

      toast.success(res.data.message);
      setEtape(5); // Étape confirmation
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setEnCours(false);
    }
  }

  if (etape === 5) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#004d5a' }}>Demande envoyée !</h2>
            <p style={{ color: '#666', fontSize: '15px' }}>
              Votre demande d'inscription a été reçue. Vous recevrez vos identifiants
              de connexion par email sous <strong>24 heures ouvrables</strong>.
            </p>
            <p style={{ color: '#666', fontSize: '13px' }}>
              En cas de question, contactez-nous à <strong>{process.env.REACT_APP_ADMIN_EMAIL || 'gestion.etautomation@gmail.com'}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ArivotekIcon height={130} />
          <p style={{ color: '#666', margin: '15px 0 0 0', fontSize: '14px' }}>
            Créez votre compte en quelques minutes
          </p>
        </div>

        {/* Indicateur étapes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
          {[1, 2, 3, 4].map(e => (
            <div key={e} style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: e <= etape ? '#004d5a' : '#e0e0e0',
              color: e <= etape ? 'white' : '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 'bold'
            }}>{e}</div>
          ))}
        </div>

        {/* Étape 1 — Informations générales */}
        {etape === 1 && (
          <div>
            <h3 style={styles.sectionTitle}>1. Informations générales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Nom de l'entreprise *</label>
                  <input style={styles.input} value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Statut juridique</label>
                  <select style={styles.input} value={form.statut_juridique}
                    onChange={e => setForm({ ...form, statut_juridique: e.target.value })}>
                    <option value="">Sélectionner</option>
                    <option value="SARL">SARL</option>
                    <option value="SA">SARLU</option>
                    <option value="EI">Entreprise Individuelle</option>
                    <option value="SNC">SA</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Capital social (Ar)</label>
                  <input style={styles.input} value={form.capital}
                    onChange={e => setForm({ ...form, capital: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Secteur d'activité</label>
                  <input style={styles.input} value={form.activite}
                    onChange={e => setForm({ ...form, activite: e.target.value })} />
                </div>
                <div>
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
                  <label style={styles.label}>Téléphone *</label>
                  <input style={styles.input} value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Email *</label>
                  <input style={styles.input} type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Site web</label>
                  <input style={styles.input} value={form.site_web}
                    onChange={e => setForm({ ...form, site_web: e.target.value })}
                    placeholder="https://..." />
                </div>
              </div>

              <h3 style={{ ...styles.sectionTitle, marginTop: '10px' }}>Informations fiscales</h3>
              <div style={styles.grid2}>
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
                  <label style={styles.label}>N° CNAPS entreprise</label>
                  <input style={styles.input} value={form.numero_cnaps}
                    onChange={e => setForm({ ...form, numero_cnaps: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 — Personnalisation */}
        {etape === 2 && (
          <div>
            <h3 style={styles.sectionTitle}>2. Personnalisation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Couleur primaire */}
              <div>
                <label style={styles.label}>Couleur primaire (en-têtes, boutons)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {couleursPredef.map(c => (
                    <div key={c.value}
                      onClick={() => setForm({ ...form, couleur_primaire: c.value })}
                      style={{
                        width: '35px', height: '35px', borderRadius: '50%',
                        background: c.value, cursor: 'pointer',
                        border: form.couleur_primaire === c.value ? '3px solid #333' : '3px solid transparent',
                        title: c.label
                      }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={form.couleur_primaire}
                    onChange={e => setForm({ ...form, couleur_primaire: e.target.value })}
                    style={{ width: '50px', height: '35px', cursor: 'pointer', border: 'none' }} />
                  <input style={{ ...styles.input, width: '120px' }}
                    value={form.couleur_primaire}
                    onChange={e => setForm({ ...form, couleur_primaire: e.target.value })}
                    placeholder="#004d5a" />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Aperçu :
                    <span style={{ background: form.couleur_primaire, color: 'white',
                      padding: '3px 10px', borderRadius: '4px', marginLeft: '8px', fontSize: '12px' }}>
                      Texte
                    </span>
                  </span>
                </div>
              </div>

              {/* Couleur secondaire */}
              <div>
                <label style={styles.label}>Couleur secondaire (accents, totaux)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {couleursPredef.map(c => (
                    <div key={c.value}
                      onClick={() => setForm({ ...form, couleur_secondaire: c.value })}
                      style={{
                        width: '35px', height: '35px', borderRadius: '50%',
                        background: c.value, cursor: 'pointer',
                        border: form.couleur_secondaire === c.value ? '3px solid #333' : '3px solid transparent'
                      }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={form.couleur_secondaire}
                    onChange={e => setForm({ ...form, couleur_secondaire: e.target.value })}
                    style={{ width: '50px', height: '35px', cursor: 'pointer', border: 'none' }} />
                  <input style={{ ...styles.input, width: '120px' }}
                    value={form.couleur_secondaire}
                    onChange={e => setForm({ ...form, couleur_secondaire: e.target.value })}
                    placeholder="#2e7d32" />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Aperçu :
                    <span style={{ background: form.couleur_secondaire, color: 'white',
                      padding: '3px 10px', borderRadius: '4px', marginLeft: '8px', fontSize: '12px' }}>
                      Texte
                    </span>
                  </span>
                </div>
              </div>

              {/* Police */}
              <div>
                <label style={styles.label}>Police d'écriture</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {polices.map(p => (
                    <div key={p}
                      onClick={() => setForm({ ...form, police_ecriture: p })}
                      style={{
                        padding: '8px 15px', borderRadius: '8px', cursor: 'pointer',
                        border: form.police_ecriture === p ? '2px solid #004d5a' : '2px solid #e0e0e0',
                        background: form.police_ecriture === p ? '#e3f2fd' : 'white',
                        fontFamily: p, fontSize: '14px'
                      }}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploads */}
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Logo de l'entreprise</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.svg"
                    onChange={e => setFichiers({ ...fichiers, logo: e.target.files[0] })} />
                  {fichiers.logo && (
                    <p style={{ fontSize: '12px', color: '#2e7d32', margin: '4px 0 0 0' }}>
                      ✅ {fichiers.logo.name}
                    </p>
                  )}
                </div>
                <div>
                  <label style={styles.label}>Signature factures</label>
                  <input type="file" accept=".jpg,.jpeg,.png"
                    onChange={e => setFichiers({ ...fichiers, signature_facture: e.target.files[0] })} />
                  {fichiers.signature_facture && (
                    <p style={{ fontSize: '12px', color: '#2e7d32', margin: '4px 0 0 0' }}>
                      ✅ {fichiers.signature_facture.name}
                    </p>
                  )}
                </div>
                <div>
                  <label style={styles.label}>Signature RH (fiches de paie)</label>
                  <input type="file" accept=".jpg,.jpeg,.png"
                    onChange={e => setFichiers({ ...fichiers, signature_rh: e.target.files[0] })} />
                  {fichiers.signature_rh && (
                    <p style={{ fontSize: '12px', color: '#2e7d32', margin: '4px 0 0 0' }}>
                      ✅ {fichiers.signature_rh.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 — Configuration */}
        {etape === 3 && (
          <div>
            <h3 style={styles.sectionTitle}>3. Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Préfixe numérotation factures</label>
                  <input style={styles.input} value={form.prefixe_facture}
                    onChange={e => setForm({ ...form, prefixe_facture: e.target.value })}
                    placeholder="FAC-, INV-, SOB-..." />
                </div>
                <div>
                  <label style={styles.label}>Délai de paiement (jours)</label>
                  <input style={styles.input} type="number" value={form.delai_paiement}
                    onChange={e => setForm({ ...form, delai_paiement: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Nom organisme santé</label>
                  <input style={styles.input} value={form.nom_organisme_sante}
                    onChange={e => setForm({ ...form, nom_organisme_sante: e.target.value })}
                    placeholder="OSTIE, SMMC..." />
                </div>
                <div>
                  <label style={styles.label}>Taux majoration jours fériés</label>
                  <select style={styles.input} value={form.taux_majoration_ferie}
                    onChange={e => setForm({ ...form, taux_majoration_ferie: e.target.value })}>
                    <option value={1.5}>150% (x1.5)</option>
                    <option value={2}>200% (x2)</option>
                    <option value={2.5}>250% (x2.5)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Note par défaut sur les factures</label>
                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                  value={form.note_facture_defaut}
                  onChange={e => setForm({ ...form, note_facture_defaut: e.target.value })}
                  placeholder="Ex: Paiement par virement bancaire..." />
              </div>
              <div>
                <label style={styles.label}>Informations de paiement (coordonnées bancaires)</label>
                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                  value={form.info_paiement}
                  onChange={e => setForm({ ...form, info_paiement: e.target.value })}
                  placeholder="Ex: BNI Madagascar - IBAN: MG..." />
              </div>
              <div>
                <label style={styles.label}>Mentions légales</label>
                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                  value={form.mentions_legales}
                  onChange={e => setForm({ ...form, mentions_legales: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* Étape 4 — Forfait */}
        {etape === 4 && (
          <div>
            <h3 style={styles.sectionTitle}>4. Choisissez votre forfait</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {forfaits.map(f => (
                <div key={f.key}
                  onClick={() => setForm({ ...form, forfait_souhaite: f.key })}
                  style={{
                    border: form.forfait_souhaite === f.key
                      ? '2px solid #004d5a' : '2px solid #e0e0e0',
                    borderRadius: '10px', padding: '15px', cursor: 'pointer',
                    background: form.forfait_souhaite === f.key ? '#e3f2fd' : 'white'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#004d5a', fontSize: '15px' }}>{f.key}</strong>
                    <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '15px' }}>
                      {f.label.split('—')[1]}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0 0' }}>
                    {f.description}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px',
              marginTop: '20px', fontSize: '12px', color: '#e65100' }}>
              ℹ️ Le forfait peut être modifié après votre inscription en contactant le support.
            </div>
          </div>
        )}

        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '30px' }}>
          {etape > 1 && (
            <button style={{ ...styles.boutonPrimaire, background: 'white',
              color: '#004d5a', border: '2px solid #004d5a', width: 'auto', padding: '12px 25px' }}
              onClick={() => setEtape(etape - 1)}>
              ← Précédent
            </button>
          )}
          {etape < 4 ? (
            <button style={{ ...styles.boutonPrimaire, width: etape === 1 ? '100%' : 'auto',
              padding: '12px 25px', marginLeft: 'auto' }}
              onClick={() => setEtape(etape + 1)}>
              Suivant →
            </button>
          ) : (
            <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1,
              marginLeft: 'auto' }}
              disabled={enCours}
              onClick={soumettre}>
              {enCours ? '⏳ Envoi en cours...' : '✅ Soumettre ma demande'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}