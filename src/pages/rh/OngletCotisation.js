import { formater2Decimales } from '../../utils/excel2Decimales';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import useSoumission from '../../hooks/useSoumission';
import { tiersService } from '../../services/api';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const styles = {
  boutonSecondaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  }
};

// Remise d'IRSA par enfant à charge (Ar) — doit rester identique au back (services/constantesPaie.js)
const REMISE_IRSA_PAR_ENFANT = 2000;

const moisListe = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PLAFOND_CNAPS = 2400000;

// Trimestre civil (T1 = janvier-février-mars, etc.) du dernier mois affiché
function infosTrimestre(moisAffiches) {
  const idx = (moisAffiches || [])
    .map(m => moisListe.findIndex(x => x.toLowerCase() === String(m).toLowerCase()))
    .filter(i => i >= 0);
  const dernier = idx.length > 0 ? Math.max(...idx) : new Date().getMonth();
  const trimestre = Math.floor(dernier / 3) + 1;
  return {
    trimestre,
    moisFin: trimestre * 3,
    noms: moisListe.slice((trimestre - 1) * 3, trimestre * 3).map(m => m.toLowerCase())
  };
}

// Mois sélectionnés rangés dans l'ordre du calendrier : M1 = le plus ancien, M3 = le plus récent
// Salaire brut hors avantages en nature : les avantages (cadres) ont leur propre colonne dans les déclarations,
// le brut des fiches les contient déjà. Pour un salarié sans avantage, rien ne change.
function brutHorsAvantages(m) {
  return Number(m?.salaire_brut || 0) - Number(m?.total_avantages_nature || 0);
}

// Salariés du plus ancien au plus récent (date d'embauche, puis matricule) : ordre de la déclaration CNAPS
function trierParEmbauche(liste) {
  return [...liste].sort((a, b) => {
    const da = a.date_embauche ? new Date(a.date_embauche).getTime() : Infinity;
    const db = b.date_embauche ? new Date(b.date_embauche).getTime() : Infinity;
    if (da !== db) return da - db;
    return String(a.matricule || '').localeCompare(String(b.matricule || ''), 'fr', { numeric: true });
  });
}

// Salariés triés par matricule, du plus ancien (EMP-001) au plus récent (EMP-002 avant EMP-010) ; sans matricule en dernier
function trierParMatricule(liste) {
  return [...liste].sort((a, b) => {
    if (!a.matricule && !b.matricule) return 0;
    if (!a.matricule) return 1;
    if (!b.matricule) return -1;
    return String(a.matricule).localeCompare(String(b.matricule), 'fr', { numeric: true });
  });
}

function trierMois(liste) {
  return [...liste].sort((a, b) => moisListe.indexOf(a) - moisListe.indexOf(b));
}

// Fiche du salarié pour la colonne i (M1, M2, M3).
// Avec une sélection : on prend le mois exact ; sans sélection : l'ordre du back (déjà chronologique).
function moisDeColonne(d, i, moisTries) {
  if (moisTries.length > 0) {
    return d.mois.find(m => String(m.periode || '').split('/')[0] === moisTries[i]);
  }
  return d.mois[i];
}

// ───────────── Paiement de la CNAPS / OSTIE / IRSA ─────────────
const MODES_PAIEMENT = ['Virement bancaire', 'Carte bancaire', 'Chèque', 'Espèces', 'Airtel money', 'Orange money', 'Mvola', 'Associé', 'Autre'];
// moyen de paiement -> compte de trésorerie de la dépense (mêmes valeurs que le formulaire Tiers)
const DEPENSE_PAR_MODE = {
  'Virement bancaire': 'Dépenses banque', 'Carte bancaire': 'Dépenses banque', 'Chèque': 'Dépenses banque', 'Autre': 'Dépenses banque',
  'Espèces': 'Dépenses caisse', 'Mvola': 'Dépenses Mvola', 'Orange money': 'Dépenses Orange money',
  'Airtel money': 'Dépenses Airtel money', 'Associé': 'Dépense associé'
};
// onglet -> tiers, nature imposée côté back (compte 431 ou 447) et libellé du compte
const PAIEMENT_PAR_TYPE = {
  CNAPS: { tiers: 'CNAPS', nature: 'CNAPS_OSTIE', compte: '431 – Organismes sociaux', nom: 'CNAPS' },
  OSTIE: { tiers: 'OSTIE', nature: 'CNAPS_OSTIE', compte: '431 – Organismes sociaux', nom: 'OSTIE' },
  IRSA: { tiers: 'Direction Générale des Impôts (IRSA)', nature: 'IRSA', compte: '447 – État, autres impôts et versements (IRSA)', nom: 'IRSA' }
};

function ModalPaiementCotisation({ type, moisSelectionnes, montantInitial, detailMontant, entrepriseId, onClose }) {
  const cfg = PAIEMENT_PAR_TYPE[type];
  const { enCours, soumettre } = useSoumission();
  const moisTexte = trierMois(moisSelectionnes).map(m => m.toLowerCase()).join(' - ');
  const [form, setForm] = useState({
    intitule: `Paiement ${cfg.nom}${moisTexte ? ' ' + moisTexte : ''}`,
    date: new Date().toLocaleDateString('en-CA'),
    montant: montantInitial,
    mode_paiement: ''
  });
  const [fichiers, setFichiers] = useState([]);

  const convertirBase64 = (fichier) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(fichier);
  });

  async function enregistrer() {
    if (!(Number(form.montant) > 0)) return toast.error('Montant invalide.');
    if (!form.mode_paiement) return toast.error('Choisis le moyen de paiement.');
    if (!form.date) return toast.error('Choisis la date de paiement.');
    try {
      const res = await tiersService.creer({
        entreprise_id: entrepriseId,
        tiers: cfg.tiers,
        categorie: '', sous_categorie: '',
        depense: DEPENSE_PAR_MODE[form.mode_paiement] || 'Dépenses banque',
        recette: '',
        montant: Number(form.montant),
        montant_paye: Number(form.montant),
        mode_paiement: form.mode_paiement,
        date_facture: form.date,
        commentaire: form.intitule,
        nature_depense: cfg.nature,
        statut: 'PAYEE'
      });
      const factureId = res.data.data.id;
      for (let i = 0; i < fichiers.length; i++) {
        const base64 = await convertirBase64(fichiers[i]);
        await fetch(`${API_URL}/api/tiers/${factureId}/upload-justificatif`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ fichier_base64: base64, nom_fichier: fichiers[i].name, type_mime: fichiers[i].type, index: i + 1 })
        });
      }
      toast.success(`Paiement ${cfg.nom} enregistré (compte ${cfg.compte.split(' ')[0]}).`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement du paiement.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '25px', width: '480px', maxWidth: '92vw',
        maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>💳 Payer – {cfg.nom}</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={styles.label}>Intitulé</label>
          <input style={styles.input} value={form.intitule}
            onChange={e => setForm({ ...form, intitule: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={styles.label}>Date de paiement</label>
            <input style={styles.input} type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Montant (Ar)</label>
            <input style={styles.input} type="number" step="0.01" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
        </div>
        {detailMontant && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '-8px', marginBottom: '14px' }}>{detailMontant}</div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={styles.label}>Compte comptable</label>
          <input style={{ ...styles.input, background: '#f5f5f5' }} value={cfg.compte} readOnly />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={styles.label}>Moyen de paiement</label>
          <select style={styles.input} value={form.mode_paiement}
            onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
            <option value="">Sélectionner</option>
            {MODES_PAIEMENT.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Pièce jointe</label>
          <input type="file" multiple accept=".pdf,image/*"
            onChange={e => setFichiers(Array.from(e.target.files || []))} />
          {fichiers.length > 0 && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {fichiers.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button style={styles.boutonSecondaire} onClick={onClose} disabled={enCours}>Annuler</button>
          <button style={{ ...styles.boutonSecondaire, opacity: enCours ? 0.6 : 1 }}
            onClick={() => soumettre(enregistrer)} disabled={enCours}>
            {enCours ? '⏳ Patientez...' : 'Enregistrer le paiement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OngletCotisation({ type }) {
  const { entreprise } = useAuth();
  const [donnees, setDonnees] = useState([]);
  const [numeroCnapsEmployeur, setNumeroCnapsEmployeur] = useState('');
  const [employeur, setEmployeur] = useState({});
  const [loading, setLoading] = useState(true);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());

  useEffect(() => { chargerDonnees(); }, [type, moisSelectionnes, filtreAnnee]);

  function toggleMois(mois) {
    if (moisSelectionnes.includes(mois)) {
      setMoisSelectionnes(prev => prev.filter(m => m !== mois));
    } else {
      if (moisSelectionnes.length >= 3) {
        toast.warning('Maximum 3 mois sélectionnables.');
        return;
      }
      setMoisSelectionnes(prev => [...prev, mois]);
    }
  }

  async function chargerDonnees() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type,
        nbMois: moisTries.length || (type === 'IRSA' ? 2 : 3),
        annee: filtreAnnee,
        ...(moisSelectionnes.length > 0 && { mois: moisSelectionnes.join(',') })
      });
      const res = await fetch(
        `${API_URL}/api/rh/cotisations/${entreprise.id}?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      // CNAPS et OSTIE : par matricule, du plus ancien au plus récent (écran et export Excel)
      setDonnees(type === 'OSTIE' || type === 'CNAPS' || type === 'IRSA' ? trierParEmbauche(data.data || []) : trierParMatricule(data.data || []));
      setNumeroCnapsEmployeur(data.employeur?.numero_cnaps || entreprise?.numero_cnaps || '');
      setEmployeur(data.employeur || {});
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  function exporterExcel() {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    let nomFichierExport = null;
    let formatExport = 'xlsx';

    if (type === 'IRSA') {
      // Canevas IRSA de l'administration fiscale : intitulés repris tels quels, une ligne par travailleur
      const entetes = [
        "NOM ET PRÉNOM DU TRAVAILLEUR (ANARANA SY FANAMPIN'ANARAN'NY MPIASA)",
        'FONCTION (ASANY)',
        "NUMÉRO CARTE D'IDENTITÉ NATIONALE OU DE RÉSIDENT (LAHARAN'NY KARAPANONDROM-PIRENENA NA KARA-BAHINY)",
        "NUMÉRO D'IDENTIFICATION À LA CNAPS (LAHARAM-PAMANTARANA CNAPS)",
        'RÉMUNÉRATION BRUTE EN NUMÉRAIRE (KARAMA TSY AFA-KARATSAKA RAISINA LELAVOLA) ( B )',
        "VALEUR DES AVANTAGES EN NATURE IMPOSABLES (SANDAN'NY TOMBOTSOA TSY ARA-BOLA IHARAN'NY HETRA) ( C )",
        "RETENUE ET VERSEMENT EN VUE DE LA CONSTITUTION DE PENSION OU DE RETRAITE (LATSAKEMBOKA ESORINA HO AN'NY FISOTROAN-DRONONO) ( D )",
        "RETENUE AU TITRE DE COTISATION OUVRIÈRE DUE À UNE ORGANISATION SANITAIRE (LATSAKEMBOKA HO AN'NY FAHASALAMAN'NY MPIASA) ( E )",
        'REVENUS NETS IMPOSABLES (KARAMA SY NY TOA AZY AFA-KARATSAKA AMERANA NY HETRA) ( F = B + C - D - E )',
        "IMPÔT BRUT CORRESPONDANT (HETRA TANDRIFIN'IZANY) ( G )",
        "NOMBRE DE PERSONNES À CHARGE (ISAN'OLONA IADIDIANA)",
        "RÉDUCTION POUR PERSONNES À CHARGE (FAMPIHENAN-KETRA NOHO NY OLONA IADIDIANA) ( H )",
        'IMPÔT NET RETENU (HETRA ALOA AFA-KARATSAKA) ( I = G - H )'
      ];
      const lignes = [entetes];
      const somme = (d, f) => d.mois.reduce((t, m) => t + Number(f(m) || 0), 0);

      donnees.forEach(d => {
        const impotBrut = somme(d, m => m.irsa_brut);
        const impotNet = somme(d, m => m.irsa);
        lignes.push([
          [d.nom, d.prenom].filter(Boolean).join(' '),
          d.fonction || '',
          String(d.cin || ''),
          String(d.numero_cnaps || ''),
          somme(d, brutHorsAvantages),
          somme(d, m => m.total_avantages_nature),
          somme(d, m => m.cnaps_salarial),
          somme(d, m => m.ostie_salarial),
          somme(d, m => m.brut_imposable),
          impotBrut,
          d.mois[d.mois.length - 1]?.nb_enfants || 0, // situation du mois le plus récent
          (d.mois[d.mois.length - 1]?.nb_enfants || 0) * REMISE_IRSA_PAR_ENFANT * d.mois.length, // calcul habituel : 2 000 Ar par personne à charge et par mois
          impotNet
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(lignes);
      Object.keys(ws).forEach(adr => {
        if (adr[0] === '!') return;
        const { r, c } = XLSX.utils.decode_cell(adr);
        if (r > 0 && c >= 4 && c !== 10 && ws[adr].t === 'n') ws[adr].z = '0.00';
      });
      ws['!cols'] = [
        { wch: 34 }, { wch: 40 }, { wch: 18 }, { wch: 18 },
        ...Array(9).fill({ wch: 22 })
      ];

      // Feuille nommée d'après les mois du bimestre (ex. « mai-juin 2026 »)
      const moisIrsa = moisTries.length > 0
        ? moisTries
        : [...new Set(donnees.flatMap(d => d.mois.map(m => String(m.periode || '').split('/')[0])))];
      const nomFeuille = `${moisIrsa.map(m => m.toLowerCase()).join('-')} ${filtreAnnee}`.trim().slice(0, 31) || 'IRSA';
      XLSX.utils.book_append_sheet(wb, ws, nomFeuille);

      // Fichier : Canevas_IRSA_<n>eme_bimestre_<année>.xls (1er bimestre = janvier-février)
      const idxFin = moisIrsa.length > 0
        ? Math.max(...moisIrsa.map(m => moisListe.findIndex(x => x.toLowerCase() === String(m).toLowerCase())))
        : new Date().getMonth();
      const numBimestre = Math.floor(Math.max(idxFin, 0) / 2) + 1;
      nomFichierExport = `Canevas_IRSA_${numBimestre === 1 ? '1er' : `${numBimestre}eme`}_bimestre_${filtreAnnee}.xls`;
      formatExport = 'xls';

    } else if (type === 'CNAPS') {
  // Format de la déclaration nominative CNAPS (modèle DNWEB) : M1 / M2 / M3
  const ws_data = [];
  const nbMoisAffiches = 3;
  const moisHeaders = ['M1', 'M2', 'M3'];

  const header1 = [
    'Matricule travailleur',
    'N° CIN',
    'Nom',
    'Prénom (s)',
    'Référence Employeur',
    'Date Embauche',
    'Date Débauche'
  ];
  moisHeaders.forEach(m => header1.push(m, '', '', ''));
  header1.push('Occasionnel (O/N) O(oui) et N(non)', 'N° Téléphone', 'Adresse mail');
  ws_data.push(header1);

  const header2 = ['', '', '', '', '', '', ''];
  moisHeaders.forEach(() => header2.push('Salaire', 'Avantage', 'TP (Numérique)', 'Plafond'));
  header2.push('', '', '');
  ws_data.push(header2);

  const formaterDate = v => (v ? new Date(v).toLocaleDateString('fr-FR') : '');

  donnees.forEach(d => {
    const ligne = [
      String(d.numero_cnaps || ''),
      String(d.cin || ''),
      d.nom,
      d.prenom || '',
      numeroCnapsEmployeur, // Référence employeur (renseignée à l'inscription)
      formaterDate(d.date_embauche),
      formaterDate(d.date_sortie)
    ];

    for (let i = 0; i < nbMoisAffiches; i++) {
      const m = moisDeColonne(d, i, moisTries);
      if (m) {
        ligne.push(
          brutHorsAvantages(m),
          m.total_avantages_nature || 0,
          d.nb_heures_mois || 173.33,
          PLAFOND_CNAPS
        );
      } else {
        // Salarié absent ce mois-là : cases laissées vides
        ligne.push('', '', '', '');
      }
    }

    ligne.push(d.occasionnel || 'N', String(d.telephone || ''), d.email || '');
    ws_data.push(ligne);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  formater2Decimales(ws, { lignesEntete: 2 });

  // Fusions : colonnes A à G et T à V sur 2 lignes ; M1, M2, M3 sur 4 colonnes
  ws['!merges'] = [];
  for (let c = 0; c <= 6; c++) ws['!merges'].push({ s: { r: 0, c }, e: { r: 1, c } });
  moisHeaders.forEach((_, i) => {
    const col = 7 + (i * 4);
    ws['!merges'].push({ s: { r: 0, c: col }, e: { r: 0, c: col + 3 } });
  });
  for (let c = 19; c <= 21; c++) ws['!merges'].push({ s: { r: 0, c }, e: { r: 1, c } });

  ws['!cols'] = [
    { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
    { wch: 18 }, { wch: 15 }, { wch: 15 },
    ...Array(nbMoisAffiches * 4).fill({ wch: 14 }),
    { wch: 30 }, { wch: 15 }, { wch: 28 }
  ];

  // La feuille porte le nom de la référence employeur
  const nomFeuille = String(numeroCnapsEmployeur || 'CNAPS').replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'CNAPS';
  XLSX.utils.book_append_sheet(wb, ws, nomFeuille);

  // Nom de fichier : DNWEB-<référence employeur>-<AAAAMM du dernier mois du trimestre>
  const { moisFin } = infosTrimestre(moisTries.length > 0 ? moisTries : donnees.flatMap(d => d.mois.map(m => String(m.periode || '').split('/')[0])));
  nomFichierExport = `DNWEB-${numeroCnapsEmployeur || 'CNAPS'}-${filtreAnnee}${String(moisFin).padStart(2, '0')}.xlsx`;


} else if (type === 'OSTIE') {
  // Déclaration nominative OSTIE : même modèle que le fichier de l'OSTIE (onglets DNS et RECAP COTISATION)
  const SME = 300000;
  const PLAFOND_OSTIE = SME * 8; // plafond par travailleur et par mois (8 × salaire minimum d'embauche)
  const TAUX_EMPLOYEUR = 0.05;
  const TAUX_TRAVAILLEUR = 0.01;
  const nbMoisAffiches = 3;
  const periodesAffichees = moisTries.length > 0
    ? moisTries
    : donnees.flatMap(d => d.mois.map(m => String(m.periode || '').split('/')[0]));
  const { trimestre, noms: moisConcernes } = infosTrimestre(periodesAffichees);
  const codeAdherent = String(employeur.code_adherent_ostie || '');
  const formaterDate = v => (v ? new Date(v).toLocaleDateString('fr-FR') : '');
  const lettre = c => XLSX.utils.encode_col(c);

  // ───── Onglet DNS ─────
  const ws = {};
  const merges = [];
  const texte = (r, c, v) => { if (v !== '' && v != null) ws[XLSX.utils.encode_cell({ r: r - 1, c })] = { t: 's', v: String(v) }; };
  const nombre = (r, c, v, f) => {
    ws[XLSX.utils.encode_cell({ r: r - 1, c })] = { t: 'n', v: Number(v) || 0, z: '0.00', ...(f ? { f } : {}) };
  };
  const fusion = (r1, c1, r2, c2) => merges.push({ s: { r: r1 - 1, c: c1 }, e: { r: r2 - 1, c: c2 } });

  texte(1, 0, 'ORGANISATION SANITAIRE TANANARIVIENNE INTER-ENTREPRISES'); fusion(1, 0, 1, 4);
  texte(1, 6, 'DECLARATION NOMINATIVE DES SALAIRES VERSES AU TITRE DU '); fusion(1, 6, 1, 13);
  texte(1, 14, trimestre === 1 ? '1er' : `${trimestre}ème`);
  texte(1, 15, 'TRIMESTRE');
  ws[XLSX.utils.encode_cell({ r: 0, c: 16 })] = { t: 'n', v: Number(filtreAnnee), z: '0' };
  texte(2, 0, 'O.S.T.I.E.'); fusion(2, 0, 2, 4);
  texte(3, 0, 'Rue Dr Zamenhof Behoririka 101 ANTANANARIVO'); fusion(3, 0, 3, 4);
  texte(4, 0, 'Tél.: 22 265 78 / 22 274 76 / 22 251 42  FAX : 22 265 66'); fusion(4, 0, 4, 4);
  texte(5, 0, 'BP : 165 Antananarivo '); fusion(5, 0, 5, 4);
  texte(6, 0, 'e-mail : sadhostie@moov.mg         site web : www.ostie.mg'); fusion(6, 0, 6, 4);
  texte(7, 0, 'BOA Andravoahangy   00009 05600 10762050010 23');
  texte(8, 0, 'BNI-CL Analakely  00005 00001 01232020200 71');
  texte(9, 0, 'BFV-SG  Antaninarenina  00008 00005 21000155438 43');
  texte(10, 0, 'BMOI Analamahitsy 00004 00003 01500800184 32');
  texte(11, 0, 'ACCES BANQUE Antaninandro  00011 00003 24100035111 77');
  texte(12, 0, 'ORANGE MONEY  032 24 704 67  - MVOLA 034 31 564 90');

  texte(3, 6, 'CODE ADHERENT :'); fusion(3, 6, 3, 7); texte(3, 8, codeAdherent);
  texte(3, 12, 'FOLIO :'); nombre(3, 13, 1);
  texte(3, 14, 'Plafond par travailleur et par mois :'); fusion(3, 14, 3, 15); nombre(3, 16, PLAFOND_OSTIE, '+Q4*8');
  texte(4, 6, 'Raison Sociale        :'); fusion(4, 6, 4, 7); texte(4, 8, employeur.nom || '');
  texte(4, 14, "Salaire Minimum d'Embauche :"); fusion(4, 14, 4, 15); nombre(4, 16, SME);
  texte(5, 6, 'Adresse       :'); fusion(5, 6, 5, 7); texte(5, 8, employeur.adresse || ''); fusion(5, 8, 5, 11);
  texte(6, 6, 'Tél :'); fusion(6, 6, 6, 7); texte(6, 8, employeur.telephone || '');
  texte(6, 9, 'eMail :'); texte(6, 10, employeur.email || '');
  texte(7, 6, 'STAT :'); fusion(7, 7, 7, 8); texte(7, 7, employeur.stat || '');
  texte(7, 9, 'NIF :'); texte(7, 10, employeur.nif || '');
  texte(8, 6, 'ACTIVITE :'); fusion(8, 7, 8, 8); texte(8, 7, employeur.activite || '');
  texte(8, 11, 'REGIME :'); texte(8, 12, 'GENERAL');
  texte(9, 6, 'Taux Employeur : '); fusion(9, 6, 9, 7); nombre(9, 8, TAUX_EMPLOYEUR);
  texte(9, 9, 'Travailleur :'); nombre(9, 11, TAUX_TRAVAILLEUR);
  texte(10, 6, 'N° Cnaps Employeur :'); fusion(10, 6, 10, 7); texte(10, 8, numeroCnapsEmployeur);

  const ligneEntete = 14;
  [
    'N°', 'MATRICULE', 'NOM DU TRAVAILLEUR', 'PRENOMS DU TRAVAILLEUR', 'SEXE', 'DATE DE NAISSANCE',
    "DATE D'EMBAUCHE", 'DATE DE DEBAUCHE', 'FONCTION', 'N°CNAPS', 'N°CIN',
    'SALAIRE 1er MOIS', 'SALAIRE 2ème MOIS', 'SALAIRE 3ème MOIS',
    'TOTAUX SALAIRES NON PLAFONNES', 'TOTAUX SALAIRES PLAFONNES',
    'PART EMPLOYEUR 5%', 'PART TRAVAILLEUR 1%'
  ].forEach((h, c) => texte(ligneEntete, c, h));

  const premiere = ligneEntete + 1;
  const totaux = [0, 0, 0, 0, 0, 0, 0];
  donnees.forEach((d, index) => {
    const r = premiere + index;
    const sexe = String(d.sexe || '').trim().charAt(0).toUpperCase();
    nombre(r, 0, index + 1); ws[XLSX.utils.encode_cell({ r: r - 1, c: 0 })].z = '0';
    texte(r, 1, d.matricule || '');
    texte(r, 2, String(d.nom || '').toUpperCase());
    texte(r, 3, d.prenom || '');
    texte(r, 4, sexe === 'M' || sexe === 'F' ? sexe : '');
    texte(r, 5, formaterDate(d.date_naissance));
    texte(r, 6, formaterDate(d.date_embauche));
    texte(r, 7, formaterDate(d.date_sortie)); // vide tant que le salarié n'est pas sorti
    texte(r, 8, d.fonction || '');
    texte(r, 9, String(d.numero_cnaps || ''));
    texte(r, 10, String(d.cin || ''));

    // Salaires hors avantages en nature ; le plafond s'applique mois par mois
    const sal = [0, 1, 2].map(i => {
      const m = moisDeColonne(d, i, moisTries);
      return m ? brutHorsAvantages(m) : 0;
    });
    sal.forEach((v, i) => nombre(r, 11 + i, v));
    const nonPlafonne = sal.reduce((s, v) => s + v, 0);
    const plafonne = sal.reduce((s, v) => s + Math.min(v, PLAFOND_OSTIE), 0);
    nombre(r, 14, nonPlafonne, `SUM(L${r}:N${r})`);
    nombre(r, 15, plafonne, `MIN(L${r},$Q$3)+MIN(M${r},$Q$3)+MIN(N${r},$Q$3)`);
    nombre(r, 16, plafonne * TAUX_EMPLOYEUR, `P${r}*$I$9`);
    nombre(r, 17, plafonne * TAUX_TRAVAILLEUR, `P${r}*$L$9`);
    [...sal, nonPlafonne, plafonne, plafonne * TAUX_EMPLOYEUR, plafonne * TAUX_TRAVAILLEUR].forEach((v, i) => { totaux[i] = (totaux[i] || 0) + v; });
  });

  // Comme dans le modèle de l'OSTIE : 9 lignes numérotées au minimum, les lignes sans salarié restent vides
  const nbLignes = Math.max(9, donnees.length);
  for (let index = donnees.length; index < nbLignes; index++) {
    nombre(premiere + index, 0, index + 1);
    ws[XLSX.utils.encode_cell({ r: premiere + index - 1, c: 0 })].z = '0';
  }
  const derniere = premiere + nbLignes - 1;
  const ligneTotaux = derniere + 1;
  texte(ligneTotaux, 9, 'TOTAUX');
  for (let c = 11; c <= 17; c++) {
    nombre(ligneTotaux, c, totaux[c - 11] || 0, `SUM(${lettre(c)}${premiere}:${lettre(c)}${derniere})`);
  }
  fusion(ligneTotaux, 9, ligneTotaux, 10); // « TOTAUX » fusionné sur J:K comme dans le modèle

  // Textes fixes du modèle de l'OSTIE (identiques pour toutes les entreprises) :
  // explication des colonnes et recommandations, placés 2 lignes sous la ligne TOTAUX
  const decal = ligneTotaux - 24; // dans le modèle, la ligne TOTAUX est la ligne 24
  const serie = (j, m, a) => (Date.UTC(a, m - 1, j) - Date.UTC(1899, 11, 30)) / 86400000;
  const fixe = (r, c, v) => {
    const adr = XLSX.utils.encode_cell({ r: r + decal - 1, c });
    ws[adr] = typeof v === 'number' ? { t: 'n', v } : { t: 's', v };
  };
  const date = (r, c, j, m, a) => {
    ws[XLSX.utils.encode_cell({ r: r + decal - 1, c })] = { t: 'n', v: serie(j, m, a), z: 'dd/mm/yyyy' };
  };
  [
    [26, 1, 'EXPLICATION DES CONTENUS DES COLONNES '],
    [26, 10, 'RECOMMANDATIONS :'],
    [28, 1, 'COLONNE'], [28, 2, 'DESCRIPTION'], [28, 7, 'EXEMPLE'], [28, 8, ' -'],
    [28, 9, 'Toutes les colonnes doivent être remplies'],
    [29, 1, 'A'], [29, 2, 'Numéro chronologique'],
    [29, 9, "Dans le cas contraire, le fichier sera retourné à l'employeur."],
    [30, 1, 'B'], [30, 2, "N° matricule du travailleur chez l'employeur"],
    [31, 1, 'C'], [31, 2, 'Nom du travailleur : Toujours à renseigner, ne pas intervertir avec les prénoms'],
    [31, 8, '-'], [31, 9, "Ne jamais insérer ni supprimer d'autres lignes à l'en-tête (ligne 1 à 14)"],
    [32, 1, 'D'], [32, 2, 'Prénoms du travailleur : A renseigner si existant, ne pas intervertir avec le nom'],
    [33, 1, 'E'], [33, 2, 'Sexe : Masculin ou Féminin'], [33, 7, 'M ou F'], [33, 8, '-'],
    [33, 9, "Insérer des lignes selon nombre d'effectif."],
    [34, 1, 'F'], [34, 2, 'Date de naissance obligatoire. Mettre au format date JJ/MM/AAAA'],
    [34, 9, "Un travailleur ne doit occuper qu'une seule ligne"],
    [35, 1, 'G'], [35, 2, "Date d'embauche : mettre au format date JJ/MM/AAAA"],
    [36, 1, 'H'], [36, 2, 'Date de départ : A renseigner uniquement si le travailleur a été débauché au cours de ce'],
    [36, 8, ' -'], [36, 9, "Ne jamais insérer d'autres colonnes"],
    [37, 2, 'trimestre. Mettre au format date JJ/MM/AAAA'],
    [38, 1, 'I'], [38, 2, 'Fonction'], [38, 8, ' -'], [38, 9, 'Ne pas intervertir les colonnes'],
    [39, 1, 'J'], [39, 2, "N° CNaPS : N° d'affiliation du travailleur. Si le numéro comporte des zéros devant,"],
    [39, 7, '033546'],
    [40, 2, "tapez ces zéros. Ce numéro doit être renseigné sauf si le travailleur a été embauché au"],
    [40, 7, '12345678901K'], [40, 8, ' -'], [40, 9, 'Mettre au majuscule les noms et prénoms'],
    [41, 2, "cours du trimestre, auquel cas, la date d'entrée et le n° CIN doivent être renseignés  "],
    [41, 7, '564234'], [41, 9, 'ainsi que les fonctions'],
    [42, 1, 'K'], [42, 2, "CIN : N° CIN du travailleur - N° passeport pour les expatriés"],
    [43, 1, 'L,M,N'], [43, 2, 'Salaire du mois : Montant du salaire du mois, non plafonné, en format nombre sans '],
    [43, 7, 1234567], [43, 8, ' -'], [43, 9, "Faire apparaitre dans l'objet du mail ainsi que dans le nom de fichier"],
    [44, 2, 'séparation de milliers, donc cadré à droite'], [44, 9, 'le code Adhérent et le trimestre concerné'],
    [45, 1, 'O'], [45, 2, 'Total non plafonné : Somme des colonnes L, M et N (format nombre)'],
    [45, 9, 'Renommer le fichier : Code Adhérent + Sigle Société + trimestre (ex : 012345 SOCIETE 1T2017)'],
    [46, 1, 'P'], [46, 2, 'Total plafonné : Si la valeur de L ou M ou N est supérieur au plafond règlementaire,  '],
    [47, 2, 'faire la somme avec le plafond règlementaire, sinon mettre O (format nombre) '],
    [47, 8, ' -'], [47, 9, "Ne pas oublier d'établir l'état récapitulatif (onglet RECAP COTISATION)"],
    [48, 1, 'Q'], [48, 2, 'Cotisation part employeur : Valeur de P à multiplier par le taux employeur en vigueur '],
    [49, 1, 'R'], [49, 2, 'Cotisation part travailleur : Valeur de P à multiplier par le taux travailleur en vigueur '],
  ].forEach(([r, c, v]) => fixe(r, c, v));
  date(34, 7, 2, 6, 1983);
  date(35, 7, 4, 1, 2017);
  date(37, 7, 4, 1, 2017);
  [28, 29, 30, 31, 32, 33, 34, 35, 49].forEach(r => fusion(r + decal, 2, r + decal, 6));
  fusion(33 + decal, 9, 33 + decal, 12);
  fusion(34 + decal, 9, 34 + decal, 12);

  ws['!ref'] = `A1:R${52 + decal}`;
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 24 }, { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 40 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'DNS');

  // ───── Onglet RECAP COTISATION ─────
  const rc = {};
  const rt = (r, c, v) => { if (v !== '' && v != null) rc[XLSX.utils.encode_cell({ r: r - 1, c })] = { t: 's', v: String(v) }; };
  const rn = (r, c, v, f) => { rc[XLSX.utils.encode_cell({ r: r - 1, c })] = { t: 'n', v: Number(v) || 0, z: '#,##0.00', ...(f ? { f } : {}) }; };
  const rmerges = [];
  rt(1, 0, 'ETAT RECAPITULATIF DES DECLARATIONS NOMINATIVES DE SALAIRES');
  rt(3, 1, 'CODE ADHERENT'); rt(3, 2, codeAdherent);
  rt(4, 1, 'RAISON SOCIALE'); rt(4, 2, employeur.nom || '');
  rt(5, 1, 'N° Téléphone'); rt(5, 2, employeur.telephone || '');
  rt(6, 1, 'ADRESSE'); rt(6, 2, employeur.adresse || '');
  rt(7, 1, 'Adresse mail'); rt(7, 2, employeur.email || '');
  for (let r = 3; r <= 7; r++) rmerges.push({ s: { r: r - 1, c: 2 }, e: { r: r - 1, c: 5 } });
  rt(9, 0, 'COTISATIONS :');
  rt(10, 1, 'TRIMESTRE'); rc[XLSX.utils.encode_cell({ r: 9, c: 2 })] = { t: 'n', v: trimestre, z: '0' };
  rt(11, 1, 'ANNEE'); rc[XLSX.utils.encode_cell({ r: 10, c: 2 })] = { t: 'n', v: Number(filtreAnnee), z: '0' };
  rt(12, 1, 'MODE DE PAIEMENT'); // laissé vide : à compléter à la main
  rt(13, 1, 'REFERENCE'); rt(13, 2, codeAdherent);
  rt(14, 1, 'Taux Employeur'); rn(14, 2, TAUX_EMPLOYEUR); rc[XLSX.utils.encode_cell({ r: 13, c: 2 })].z = '0.00';
  rt(15, 1, 'Taux Travailleur'); rn(15, 2, TAUX_TRAVAILLEUR); rc[XLSX.utils.encode_cell({ r: 14, c: 2 })].z = '0.00';
  rt(16, 1, 'Montant Plafonnement'); rn(16, 2, PLAFOND_OSTIE, 'DNS!Q3');
  rt(17, 1, 'Montant SME'); rn(17, 2, SME, 'DNS!Q4');
  rt(20, 0, 'MOIS CONCERNES :');
  moisConcernes.forEach((m, i) => rt(20, 2 + i, m));
  rt(22, 0, 'RECAPITULATION :');
  ['Mois 1', 'Mois 2', 'Mois 3'].forEach((m, i) => rt(22, 2 + i, m));
  rt(23, 1, 'Effectif mensuel (OBLIGATOIRE)'); rt(23, 5, 'TOTAUX'); // effectif laissé vide
  const colsMois = ['L', 'M', 'N'];
  const refPlafond = 'DNS!$Q$3';
  const sommePlafonnee = c => `SUMPRODUCT((DNS!${c}${premiere}:${c}${Math.max(derniere, premiere)}>${refPlafond})*${refPlafond}+(DNS!${c}${premiere}:${c}${Math.max(derniere, premiere)}<=${refPlafond})*DNS!${c}${premiere}:${c}${Math.max(derniere, premiere)})`;
  rt(24, 1, 'Totaux Salaires non plafonnés');
  rt(25, 1, 'Totaux Salaires plafonnés');
  rt(26, 1, 'Cotisations Employeur (A)');
  rt(27, 1, 'Cotisations travailleurs (B)');
  rt(28, 1, 'Total cotisations A+B'); rmerges.push({ s: { r: 27, c: 1 }, e: { r: 27, c: 4 } });
  rt(29, 1, 'Majoration de retard 10%'); rmerges.push({ s: { r: 28, c: 1 }, e: { r: 28, c: 4 } });
  rt(30, 1, 'Trop perçu antérieur à déduire'); rmerges.push({ s: { r: 29, c: 1 }, e: { r: 29, c: 4 } });
  rt(31, 1, 'COTISATIONS NET A PAYER'); rmerges.push({ s: { r: 30, c: 1 }, e: { r: 30, c: 4 } });
  colsMois.forEach((c, i) => {
    const col = 2 + i;
    const L = lettre(col);
    const nonPl = totaux[i] || 0;
    const pl = donnees.reduce((s, d) => {
      const m = moisDeColonne(d, i, moisTries);
      return s + Math.min(m ? brutHorsAvantages(m) : 0, PLAFOND_OSTIE);
    }, 0);
    rn(24, col, nonPl, `DNS!${c}${ligneTotaux}`);
    rn(25, col, pl, sommePlafonnee(c));
    rn(26, col, pl * TAUX_EMPLOYEUR, `${L}25*$C$14`);
    rn(27, col, pl * TAUX_TRAVAILLEUR, `${L}25*$C$15`);
  });
  const somme = (r) => [2, 3, 4].reduce((s, c) => s + (rc[XLSX.utils.encode_cell({ r: r - 1, c })]?.v || 0), 0);
  [24, 25, 26, 27].forEach(r => rn(r, 5, somme(r), `SUM(C${r}:E${r})`));
  rn(28, 5, somme(26) + somme(27), 'F26+F27');
  rn(31, 5, somme(26) + somme(27), 'F28+F29-F30');
  rc['!ref'] = 'A1:F31';
  rc['!merges'] = rmerges;
  rc['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, rc, 'RECAP COTISATION');

  // Nom de fichier : Code adhérent + Sigle société + trimestre (ex : 012345 SOCIETE 1T2017)
  const sigle = String(employeur.nom || entreprise?.nom || 'SOCIETE')
    .replace(/\b(SARLU|SARL|SUARL|SASU|SAS|EURL|SA|SU)\b\.?/gi, '').replace(/[\\/?*[\]:]/g, '').trim() || 'SOCIETE';
  nomFichierExport = `${[codeAdherent, sigle].filter(Boolean).join(' ')} ${trimestre}T${filtreAnnee}.xlsx`;
}

    XLSX.writeFile(wb, nomFichierExport || `${type}_${filtreAnnee}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`, { bookType: formatExport });
    toast.success('Export Excel téléchargé !');
  }

  // Mois sélectionnés du plus ancien (M1) au plus récent (M3), quel que soit l'ordre des clics
  // Sans sélection : les mêmes mois pour tous les salariés (les plus récents présents dans les données),
  // M1 = le plus ancien, dernier = le plus récent. Évite qu'un salarié n'ayant que le mois récent se retrouve en M1.
  const moisTries = moisSelectionnes.length > 0
    ? trierMois(moisSelectionnes)
    : (() => {
        const n = type === 'IRSA' ? 2 : 3;
        const cle = p => { const [m, a] = String(p).split('/'); return Number(a) * 100 + moisListe.indexOf(m); };
        const periodes = [...new Set(donnees.flatMap(d => d.mois.map(m => m.periode)))]
          .filter(Boolean).sort((a, b) => cle(a) - cle(b)).slice(-n);
        return periodes.map(p => String(p).split('/')[0]);
      })();

  const titres = {
    IRSA: '💰 IRSA',
    CNAPS: '🏦 CNAPS',
    OSTIE: '🏥 OSTIE'
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>{titres[type]}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
            onClick={exporterExcel}>📊 Excel</button>
          <button style={styles.boutonSecondaire}
            onClick={() => setModalPaiement(true)}>💳 Payer</button>
        </div>
      </div>
      {modalPaiement && (() => {
        // montant pré-rempli = total de la dernière ligne : IRSA = Total IRSA ; CNAPS / OSTIE = Total sal. + Total pat.
        const totSal = donnees.reduce((t, d) => t + Number(type === 'IRSA' ? d.total_irsa : d.total_salarial || 0), 0);
        const totPat = type === 'IRSA' ? 0 : donnees.reduce((t, d) => t + Number(d.total_patronal || 0), 0);
        const arr = x => Math.round((x + Number.EPSILON) * 100) / 100;
        const fmt = x => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (
          <ModalPaiementCotisation
            type={type}
            moisSelectionnes={moisSelectionnes}
            montantInitial={arr(totSal + totPat)}
            detailMontant={type === 'IRSA' ? '' : `Part salariale ${fmt(totSal)} + part patronale ${fmt(totPat)}`}
            entrepriseId={entreprise.id}
            onClose={() => setModalPaiement(false)}
          />
        );
      })()}

      {/* Filtres */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Sélection mois */}
          <div>
            <label style={styles.label}>
              Mois (max 3) — {moisSelectionnes.length} sélectionné(s)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '5px' }}>
              {moisListe.map(m => (
                <button key={m} onClick={() => toggleMois(m)}
                  style={{
                    padding: '5px 10px', borderRadius: '15px', border: 'none',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                    background: moisSelectionnes.includes(m) ? '#004d5a' : '#e0e0e0',
                    color: moisSelectionnes.includes(m) ? 'white' : '#333'
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Année */}
          <div>
            <label style={styles.label}>Année</label>
            <input
              type="number"
              value={filtreAnnee}
              onChange={e => setFiltreAnnee(Number(e.target.value))}
              style={{ ...styles.input, width: '100px' }}
            />
          </div>

          {/* Reset */}
          {moisSelectionnes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => setMoisSelectionnes([])}
                style={{ ...styles.boutonSecondaire, color: '#c62828', borderColor: '#c62828' }}>
                ✕ Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {donnees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune donnée trouvée.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Matricule</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  {Array.from({ length: moisTries.length || (type === 'IRSA' ? 2 : 3) }, (_, i) => (
                    type === 'IRSA' ? (
                      <React.Fragment key={i}>
                        <th style={{ padding: '12px', textAlign: 'center' }}>
                          {moisTries[i] || `Mois ${i+1}`}
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Brut imposable</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>IRSA</th>
                      </React.Fragment>
                    ) : (
                      <React.Fragment key={i}>
                        <th style={{ padding: '12px', textAlign: 'center' }}>
                          {moisTries[i] || `Mois ${i+1}`}
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Sal. brut</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Salarial (1%)</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Patronal (13%)</th>
                      </React.Fragment>
                    )
                  ))}
                  <th style={{ padding: '12px', textAlign: 'right', background: '#003d47' }}>
                    {type === 'IRSA' ? 'Total IRSA' : 'Total sal.'}
                  </th>
                  {type !== 'IRSA' && (
                    <th style={{ padding: '12px', textAlign: 'right', background: '#003d47' }}>
                      Total pat.
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {donnees.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {d.matricule}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{d.nom}</td>
                    {Array.from({ length: moisTries.length || (type === 'IRSA' ? 2 : 3) }, (_, j) => {
                      const m = moisDeColonne(d, j, moisTries);
                      if (!m) return type === 'IRSA'
                        ? <React.Fragment key={j}>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                          </React.Fragment>
                        : <React.Fragment key={j}>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                            <td style={{ padding: '10px', color: '#ccc' }}>—</td>
                          </React.Fragment>;

                      return type === 'IRSA' ? (
                        <React.Fragment key={j}>
                          <td style={{ padding: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            {m.periode}
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right' }}>
                            {Number(m.brut_imposable).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#c62828' }}>
                            {Number(m.irsa).toLocaleString('fr-FR')}
                          </td>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={j}>
                          <td style={{ padding: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            {m.periode}
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right' }}>
                            {Number(m.salaire_brut).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#1565c0' }}>
                            {Number(m.salarial).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#e65100' }}>
                            {Number(m.patronal).toLocaleString('fr-FR')}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                      textAlign: 'right', background: '#f5f5f5' }}>
                      {Number(type === 'IRSA' ? d.total_irsa : d.total_salarial).toLocaleString('fr-FR')}
                    </td>
                    {type !== 'IRSA' && (
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                        textAlign: 'right', background: '#f5f5f5' }}>
                        {Number(d.total_patronal).toLocaleString('fr-FR')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <td colSpan={2} style={{ padding: '12px', fontWeight: 'bold' }}>TOTAL</td>
                  {Array.from({ length: moisTries.length || (type === 'IRSA' ? 2 : 3) }, (_, j) => (
                    type === 'IRSA'
                      ? <React.Fragment key={j}><td colSpan={3}></td></React.Fragment>
                      : <React.Fragment key={j}><td colSpan={4}></td></React.Fragment>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                    {donnees.reduce((s, d) =>
                      s + Number(type === 'IRSA' ? d.total_irsa : d.total_salarial), 0
                    ).toLocaleString('fr-FR')}
                  </td>
                  {type !== 'IRSA' && (
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {donnees.reduce((s, d) => s + Number(d.total_patronal), 0).toLocaleString('fr-FR')}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}