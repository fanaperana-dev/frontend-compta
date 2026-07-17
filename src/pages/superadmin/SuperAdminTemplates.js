import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { entrepriseService } from '../../services/api';

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
  }
};

function BlocImage({ titre, urlActuelle, onUpload, loading }) {
  const [fichier, setFichier] = useState(null);

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={styles.label}>{titre}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {urlActuelle && (
          <img src={urlActuelle} alt={titre}
            style={{ width: '100px', height: '60px', objectFit: 'contain',
              border: '1px solid #e0e0e0', borderRadius: '8px', padding: '4px' }} />
        )}
        <div style={{ flex: 1 }}>
          <input type="file" accept=".png,.jpg,.jpeg"
            onChange={e => setFichier(e.target.files[0])}
            style={{ fontSize: '13px' }} />
          {fichier && (
            <button style={{ ...styles.boutonSecondaire, marginLeft: '10px' }}
              disabled={loading}
              onClick={() => onUpload(fichier)}>
              {loading ? 'Upload...' : '📤 Uploader'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminTemplates() {
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [form, setForm] = useState({
    note_facture_defaut: '',
    mentions_legales: '',
    couleur_primaire: '#004d5a',
    couleur_secondaire: '#2e7d32',
    police_ecriture: 'Arial'
  });

  useEffect(() => { chargerEntreprises(); }, []);

  async function chargerEntreprises() {
    try {
      const res = await entrepriseService.getAll();
      setEntreprises(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement entreprises.');
    } finally {
      setLoading(false);
    }
  }

  async function selectionnerEntreprise(id) {
    setEntrepriseId(id);
    if (!id) { setEntreprise(null); return; }
    try {
      const res = await entrepriseService.getDetail(id);
      const data = res.data.data;
      setEntreprise(data);
      setForm({
        note_facture_defaut: data.note_facture_defaut || '',
        mentions_legales: data.mentions_legales || '',
        couleur_primaire: data.couleur_primaire || '#004d5a',
        couleur_secondaire: data.couleur_secondaire || '#2e7d32',
        police_ecriture: data.police_ecriture || 'Arial',
        systeme_comptable: data.systeme_comptable || 'NORMAL',
        regime_fiscal: data.regime_fiscal || 'IS'
      });
    } catch (err) {
      toast.error('Erreur chargement détail entreprise.');
    }
  }

  async function uploadImage(fichier, typeImage) {
    setUploadEnCours(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fichier);
      });

      const res = await entrepriseService.uploadImage(entrepriseId, {
        fichier_base64: base64,
        nom_fichier: fichier.name,
        type_mime: fichier.type,
        type_image: typeImage
      });

      toast.success('Image uploadée avec succès !');
      const champMap = {
        logo: 'logo_url',
        signature_facture: 'signature_facture_url',
        signature_rh: 'signature_rh_url'
      };
      setEntreprise(prev => ({ ...prev, [champMap[typeImage]]: res.data.url }));
    } catch (err) {
      toast.error('Erreur upload image.');
    } finally {
      setUploadEnCours(false);
    }
  }

  async function sauvegarderTextes() {
    setSauvegardeEnCours(true);
    try {
      await entrepriseService.modifier(entrepriseId, form);
      toast.success('Configuration sauvegardée !');
    } catch (err) {
      toast.error('Erreur sauvegarde.');
    } finally {
      setSauvegardeEnCours(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      <h2 style={{ color: '#004d5a', marginBottom: '20px' }}>🎨 Templates</h2>

      <div style={styles.card}>
        <label style={styles.label}>Sélectionner une entreprise</label>
        <select style={{ ...styles.input, maxWidth: '400px' }}
          value={entrepriseId}
          onChange={e => selectionnerEntreprise(e.target.value)}>
          <option value="">-- Choisir --</option>
          {entreprises.map(e => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>
      </div>

      {entreprise && (
        <>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>🖼️ Images</h3>
            <BlocImage titre="Logo entreprise"
              urlActuelle={entreprise.logo_url}
              loading={uploadEnCours}
              onUpload={(f) => uploadImage(f, 'logo')} />
            <BlocImage titre="Signature facture client (responsable)"
              urlActuelle={entreprise.signature_facture_url}
              loading={uploadEnCours}
              onUpload={(f) => uploadImage(f, 'signature_facture')} />
            <BlocImage titre="Signature RH (fiche de paie)"
              urlActuelle={entreprise.signature_rh_url}
              loading={uploadEnCours}
              onUpload={(f) => uploadImage(f, 'signature_rh')} />
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>🎨 Couleurs facture</h3>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <label style={styles.label}>Couleur primaire</label>
                <input type="color" value={form.couleur_primaire}
                  onChange={e => setForm({ ...form, couleur_primaire: e.target.value })}
                  style={{ width: '80px', height: '40px', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={styles.label}>Couleur secondaire</label>
                <input type="color" value={form.couleur_secondaire}
                  onChange={e => setForm({ ...form, couleur_secondaire: e.target.value })}
                  style={{ width: '80px', height: '40px', cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>🔤 Police d'écriture</h3>
            <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
              Appliquée sur les factures et fiches de paie.
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {[
                'Arial', 'Times New Roman', 'Georgia', 'Verdana',
                'Helvetica', 'Garamond', 'Trebuchet MS', 'Calibri'
              ].map(police => (
                <label key={police} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: form.police_ecriture === police
                   ? '2px solid #004d5a' : '2px solid #e0e0e0',
                  background: form.police_ecriture === police ? '#e3f2fd' : 'white'
                }}>
                  <input type="radio" value={police}
                   checked={form.police_ecriture === police}
                   onChange={() => setForm({ ...form, police_ecriture: police })} />
                  <span style={{ fontFamily: police, fontSize: '14px' }}>{police}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>📝 Note par défaut (factures)</h3>
            <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
              Pré-remplie sur chaque nouvelle facture, modifiable par le client à la création.
            </p>
            <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={form.note_facture_defaut}
              onChange={e => setForm({ ...form, note_facture_defaut: e.target.value })} />
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>📜 Mentions légales additionnelles</h3>
            <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
              NIF, STAT, RCS, Capital et statut juridique sont déjà affichés automatiquement.
              Ajoutez ici une mention libre (ex: "Entreprise non assujettie à la TVA").
            </p>
            <textarea style={{ ...styles.input, height: '60px', resize: 'vertical' }}
              value={form.mentions_legales}
              onChange={e => setForm({ ...form, mentions_legales: e.target.value })} />
          </div>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>⚖️ Configuration fiscale</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={styles.label}>Système comptable</label>
                <select style={styles.input} value={form.systeme_comptable}
                  onChange={e => setForm({ ...form, systeme_comptable: e.target.value })}>
                  <option value="NORMAL">Système Normal PCG 2005</option>
                  <option value="SMT">Système Minimal de Trésorerie (SMT)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  SMT pour CA &lt; 200 millions Ar
                </span>
              </div>
              <div>
                <label style={styles.label}>Régime fiscal</label>
                <select style={styles.input} value={form.regime_fiscal}
                  onChange={e => setForm({ ...form, regime_fiscal: e.target.value })}>
                  <option value="IS">Impôt Synthétique (IS) - 5% du CA</option>
                  <option value="IR">Impôt sur le Revenu (IR) - 20% du bénéfice net</option>
                </select>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  L'entreprise choisit son régime fiscal
                </span>
              </div>
            </div>
          </div>
        
          <button style={styles.boutonPrimaire} disabled={sauvegardeEnCours}
            onClick={sauvegarderTextes}>
            {sauvegardeEnCours ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </>
      )}
    </div>
  );
}