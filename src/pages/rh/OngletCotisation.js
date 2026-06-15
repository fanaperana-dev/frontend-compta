import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

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

const moisListe = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PLAFOND_CNAPS = 2101440;

export default function OngletCotisation({ type }) {
  const { entreprise } = useAuth();
  const [donnees, setDonnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moisSelectionnes, setMoisSelectionnes] = useState([]);
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
        nbMois: moisSelectionnes.length || (type === 'IRSA' ? 2 : 3),
        annee: filtreAnnee,
        ...(moisSelectionnes.length > 0 && { mois: moisSelectionnes.join(',') })
      });
      const res = await fetch(
        `http://localhost:5000/api/rh/cotisations/${entreprise.id}?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      setDonnees(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  function exporterExcel() {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();

    if (type === 'IRSA') {
      const donnees_export = [];

      donnees.forEach(d => {
        const total_salaire_brut = d.mois.reduce((s, m) => s + Number(m.salaire_brut || 0), 0);
        const total_avantages_nature = d.mois.reduce((s, m) => s + Number(m.total_avantages_nature || 0), 0);
        const total_cnaps = d.mois.reduce((s, m) => s + Number(m.cnaps_salarial || 0), 0);
        const total_ostie = d.mois.reduce((s, m) => s + Number(m.ostie_salarial || 0), 0);
        const total_brut_imposable = d.mois.reduce((s, m) => s + Number(m.brut_imposable || 0), 0);
        const total_irsa = d.mois.reduce((s, m) => s + Number(m.irsa || 0), 0);
        const nb_enfants = d.mois[0]?.nb_enfants || 0;
        const reduction = nb_enfants * 3000 * d.mois.length;
        const periodes = d.mois.map(m => m.periode).join(', ');

        donnees_export.push({
          'Période': periodes,
          'Nom et Prénom': d.nom,
          'Fonction': d.fonction || '',
          'N° CIN': d.cin || '',
          'N° CNAPS': d.numero_cnaps || '',
          'Salaire brut': total_salaire_brut,
          'Montant avantages en nature imposables': total_avantages_nature,
          'Montant CNAPS': total_cnaps,
          'Montant OSTIE': total_ostie,
          'Salaire net imposable': total_brut_imposable,
          'IRSA': total_irsa,
          'Nombre de personnes à charge': nb_enfants,
          'Réduction pour personnes à charge': reduction,
          'Impôt net (min 3 000 Ar)': total_irsa
        });
      });

      // Ligne total
      if (donnees_export.length > 0) {
        donnees_export.push({
          'Période': 'TOTAL',
          'Nom et Prénom': '',
          'Fonction': '',
          'N° CIN': '',
          'N° CNAPS': '',
          'Salaire brut': donnees_export.reduce((s, r) => s + Number(r['Salaire brut'] || 0), 0),
          'Montant avantages en nature imposables': donnees_export.reduce((s, r) => s + Number(r['Montant avantages en nature imposables'] || 0), 0),
          'Montant CNAPS': donnees_export.reduce((s, r) => s + Number(r['Montant CNAPS'] || 0), 0),
          'Montant OSTIE': donnees_export.reduce((s, r) => s + Number(r['Montant OSTIE'] || 0), 0),
          'Salaire net imposable': donnees_export.reduce((s, r) => s + Number(r['Salaire net imposable'] || 0), 0),
          'IRSA': donnees_export.reduce((s, r) => s + Number(r['IRSA'] || 0), 0),
          'Nombre de personnes à charge': '',
          'Réduction pour personnes à charge': donnees_export.reduce((s, r) => s + Number(r['Réduction pour personnes à charge'] || 0), 0),
          'Impôt net (min 3 000 Ar)': donnees_export.reduce((s, r) => s + Number(r['Impôt net (min 3 000 Ar)'] || 0), 0)
        });
      }

      const ws = XLSX.utils.json_to_sheet(donnees_export);
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'IRSA');

    } else if (type === 'CNAPS') {
  const ws_data = [];

  // En-tête ligne 1
  const moisHeaders = moisSelectionnes.length > 0
    ? moisSelectionnes
    : ['M1', 'M2', 'M3'];

  const header1 = [
    'N° CNAPS travailleur',
    'N° CIN',
    'Nom',
    'Prénom',
    'N° CNAPS employeur',
    'Date Embauche',
    'Date Débauche'
  ];

  moisHeaders.forEach((m, i) => {
    header1.push(`M${i+1} - ${m}`, '', '', '');
  });

  header1.push('Occasionnel', 'Téléphone', 'Email');
  ws_data.push(header1);

  // En-tête ligne 2 (sous-colonnes)
  const header2 = ['', '', '', '', '', '', ''];
  moisHeaders.forEach(() => {
    header2.push('Salaire', 'Avantage', 'Nb Heures', 'Plafond');
  });
  header2.push('', '', '');
  ws_data.push(header2);

  // Données
  donnees.forEach(d => {
    const ligne = [
      d.numero_cnaps || '',
      d.cin || '',
      d.nom,
      d.prenom || '',
      '', // N° CNAPS employeur — à remplir depuis infos entreprise
      d.date_embauche
        ? new Date(d.date_embauche).toLocaleDateString('fr-FR')
        : '',
      d.date_sortie
        ? new Date(d.date_sortie).toLocaleDateString('fr-FR')
        : ''
    ];

    const nbMoisAffiches = moisSelectionnes.length || 3;
    for (let i = 0; i < nbMoisAffiches; i++) {
      const m = d.mois[i];
      if (m) {
        ligne.push(
          m.salaire_brut || 0,
          m.total_avantages_nature || 0,
          d.nb_heures_mois || 173.33,
          PLAFOND_CNAPS
        );
      } else {
        ligne.push('', '', d.nb_heures_mois || 173.33, PLAFOND_CNAPS);
      }
    }

    ligne.push(
      d.occasionnel || 'N',
      d.telephone || '',
      d.email || ''
    );

    ws_data.push(ligne);
  });

  // Ligne total
  const nbMoisAffiches = moisSelectionnes.length || 3;
  const ligneTotal = ['TOTAL', '', '', '', '', '', ''];
  for (let i = 0; i < nbMoisAffiches; i++) {
    const totalSalaire = donnees.reduce((s, d) =>
      s + Number(d.mois[i]?.salaire_brut || 0), 0);
    const totalAvantage = donnees.reduce((s, d) =>
      s + Number(d.mois[i]?.total_avantages_nature || 0), 0);
    ligneTotal.push(totalSalaire, totalAvantage, '', '');
  }
  ligneTotal.push('', '', '');
  ws_data.push(ligneTotal);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Fusionner cellules en-tête M1/M2/M3
  ws['!merges'] = [];
  moisHeaders.forEach((_, i) => {
    const col = 7 + (i * 4);
    ws['!merges'].push({
      s: { r: 0, c: col },
      e: { r: 0, c: col + 3 }
    });
  });

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
    { wch: 18 }, { wch: 15 }, { wch: 15 },
    ...Array(nbMoisAffiches * 4).fill({ wch: 12 }),
    { wch: 12 }, { wch: 15 }, { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'CNAPS');


} else if (type === 'OSTIE') {
  const ws_data = [];
  const nbMoisAffiches = moisSelectionnes.length || 3;
  const PLAFOND_OSTIE = 2101440;

  // En-tête
  
const header = [
  'N°',
  'Matricule',
  'Nom du travailleur',
  'Prénoms du travailleur',
  'Sexe',
  'Date de naissance',
  'Date d\'embauche',
  'Date de débauche',
  'Fonction',
  'N° CNAPS',
  'N° CIN',
];

// Colonnes salaire par mois
for (let i = 0; i < nbMoisAffiches; i++) {
  const labelMois = moisSelectionnes[i]
    ? `Salaire - ${moisSelectionnes[i]}`
    : i === 0 ? 'Salaire 1er mois'
    : i === 1 ? 'Salaire 2ème mois'
    : 'Salaire 3ème mois';
  header.push(labelMois);
}

header.push(
  'Totaux salaires non plafonnés',
  'Totaux salaires plafonnés',
  'Part employeur 5%',
  'Part travailleur 1%'
);

ws_data.push(header);

// Données
donnees.forEach((d, index) => {
  const ligne = [
    index + 1,  // N°
    d.matricule,
    d.nom,
    d.prenom || '',
    d.sexe || '',
    d.date_naissance
      ? new Date(d.date_naissance).toLocaleDateString('fr-FR')
      : '',
    d.date_embauche
      ? new Date(d.date_embauche).toLocaleDateString('fr-FR')
      : '',
    d.date_sortie
      ? new Date(d.date_sortie).toLocaleDateString('fr-FR')
      : '',
    d.fonction || '',
    d.numero_cnaps || '',
    d.cin || ''
  ];

  let total_salaire_non_plafonne = 0;
  for (let i = 0; i < nbMoisAffiches; i++) {
    const salaire = Number(d.mois[i]?.salaire_brut || 0);
    total_salaire_non_plafonne += salaire;
    ligne.push(salaire);
  }

  const total_salaire_plafonne = Math.min(
    total_salaire_non_plafonne,
    PLAFOND_OSTIE * nbMoisAffiches
  );
  const part_employeur = total_salaire_plafonne * 0.05;
  const part_travailleur = total_salaire_plafonne * 0.01;

  ligne.push(
    total_salaire_non_plafonne,
    total_salaire_plafonne,
    part_employeur,
    part_travailleur
  );

  ws_data.push(ligne);
});

// Ligne total
const ligneTotal = ['', 'TOTAL', '', '', '', '', '', '', '', '', ''];
for (let i = 0; i < nbMoisAffiches; i++) {
  ligneTotal.push(
    donnees.reduce((s, d) => s + Number(d.mois[i]?.salaire_brut || 0), 0)
  );
}

const total_non_plafonne = donnees.reduce((s, d) => {
  return s + d.mois.reduce((ms, m) => ms + Number(m?.salaire_brut || 0), 0);
}, 0);

const total_plafonne = donnees.reduce((s, d) => {
  const total = d.mois.reduce((ms, m) => ms + Number(m?.salaire_brut || 0), 0);
  return s + Math.min(total, PLAFOND_OSTIE * nbMoisAffiches);
}, 0);

ligneTotal.push(
  total_non_plafonne,
  total_plafonne,
  total_plafonne * 0.05,
  total_plafonne * 0.01
);

ws_data.push(ligneTotal);
const ws = XLSX.utils.aoa_to_sheet(ws_data);

// Largeurs colonnes
ws['!cols'] = [
  { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
  { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
  { wch: 20 }, { wch: 15 }, { wch: 15 },
  ...Array(nbMoisAffiches).fill({ wch: 18 }),
  { wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 18 }
];

 
  XLSX.utils.book_append_sheet(wb, ws, 'OSTIE');
}

    XLSX.writeFile(wb, `${type}_${filtreAnnee}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    toast.success('Export Excel téléchargé !');
  }

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
        <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
          onClick={exporterExcel}>📊 Excel</button>
      </div>

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
                  {Array.from({ length: moisSelectionnes.length || (type === 'IRSA' ? 2 : 3) }, (_, i) => (
                    type === 'IRSA' ? (
                      <React.Fragment key={i}>
                        <th style={{ padding: '12px', textAlign: 'center' }}>
                          {moisSelectionnes[i] || `Mois ${i+1}`}
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Brut imposable</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>IRSA</th>
                      </React.Fragment>
                    ) : (
                      <React.Fragment key={i}>
                        <th style={{ padding: '12px', textAlign: 'center' }}>
                          {moisSelectionnes[i] || `Mois ${i+1}`}
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
                    {Array.from({ length: moisSelectionnes.length || (type === 'IRSA' ? 2 : 3) }, (_, j) => {
                      const m = d.mois[j];
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
                  {Array.from({ length: moisSelectionnes.length || (type === 'IRSA' ? 2 : 3) }, (_, j) => (
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