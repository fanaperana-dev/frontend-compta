import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { comptabiliteService } from '../services/api';
import * as XLSX from 'xlsx';

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
  boutonDanger: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
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
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '550px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

function LigneResultat({ label, montant, niveau = 0, gras = false, couleur = null, sousTitre = false }) {
  return (
    <tr style={{
      background: sousTitre ? '#f5f5f5' : 'white',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <td style={{
        padding: '8px 12px',
        paddingLeft: `${12 + niveau * 20}px`,
        fontSize: sousTitre ? '13px' : '13px',
        fontWeight: gras || sousTitre ? 'bold' : 'normal',
        color: sousTitre ? '#004d5a' : '#333'
      }}>
        {label}
      </td>
      <td style={{
        padding: '8px 12px', textAlign: 'right',
        fontSize: '13px',
        fontWeight: gras ? 'bold' : 'normal',
        color: couleur || (montant < 0 ? '#c62828' : '#333')
      }}>
        {montant !== undefined && montant !== null
          ? `${Number(montant).toLocaleString('fr-FR')} Ar`
          : ''}
      </td>
    </tr>
  );
}

function ModalOperation({ onSave, onCancel }) {
  const [form, setForm] = useState({
    type: 'PRODUIT',
    numero_compte: '',
    libelle: '',
    montant: 0,
    date_operation: new Date().toISOString().split('T')[0]
  });
  const [enCours, setEnCours] = useState(false);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          ➕ Ajouter une opération
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Type *</label>
            <select style={styles.input} value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="PRODUIT">Produit (recette)</option>
              <option value="CHARGE">Charge (dépense)</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Numéro de compte PCG</label>
            <input style={styles.input} value={form.numero_compte}
              onChange={e => setForm({ ...form, numero_compte: e.target.value })}
              placeholder="Ex: 75, 67..." />
          </div>
          <div>
            <label style={styles.label}>Libellé *</label>
            <input style={styles.input} value={form.libelle}
              onChange={e => setForm({ ...form, libelle: e.target.value })}
              placeholder="Ex: Subvention reçue, Charge financière..." />
          </div>
          <div>
            <label style={styles.label}>Montant (Ar) *</label>
            <input style={styles.input} type="number" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date *</label>
            <input style={styles.input} type="date" value={form.date_operation}
              onChange={e => setForm({ ...form, date_operation: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onSave(form);
              setEnCours(false);
            }}>
            {enCours ? '⏳ Ajout...' : '✅ Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComptabiliteResultatPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getCompteResultat(entreprise.id, annee);
      setResultat(res.data);
    } catch (err) {
      toast.error('Erreur chargement compte de résultat.');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterOperation(form) {
    try {
      await comptabiliteService.ajouterAutreOperation({
        ...form,
        entreprise_id: entreprise.id,
        annee
      });
      toast.success('Opération ajoutée !');
      setModalOuvert(false);
      charger();
    } catch (err) {
      toast.error('Erreur ajout opération.');
    }
  }

  async function supprimerOperation(id) {
    if (!window.confirm('Supprimer cette opération ?')) return;
    try {
      await comptabiliteService.supprimerAutreOperation(id);
      toast.success('Opération supprimée.');
      charger();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }
  async function exporterPDF() {
    setExportEnCours(true);
    try {
      const res = await comptabiliteService.exportPDFCompteResultat(entreprise.id, annee);
      window.open(res.data.url, '_blank');
      toast.success('PDF généré !');
    } catch (err) {
      toast.error('Erreur génération PDF.');
    } finally {
      setExportEnCours(false);
    }
  }
  {/*function exporterExcel() {
    if (!resultat) return;
    const wb = XLSX.utils.book_new();
    const data = [
      [`COMPTE DE RÉSULTAT — ${resultat.entreprise} — Exercice ${annee}`],
      [`Régime fiscal : ${resultat.regime_fiscal}`],
      [],
      ['PRODUITS', 'Montant (Ar)'],
      ['Ventes (70)', resultat.produits.ventes],
      ...(resultat.produits.autres.map(p => [
        `${p.numero_compte ? p.numero_compte + ' - ' : ''}${p.libelle}`,
        p.montant
      ])),
      ['TOTAL PRODUITS', resultat.produits.total],
      [],
      ['CHARGES', 'Montant (Ar)'],
      ['Achats fournisseurs (60)', resultat.charges.fournisseurs],
      ['Autres charges externes (62)', resultat.charges.tiers],
      ['Charges de personnel (64)', resultat.charges.personnel.total],
      ['  dont salaires', resultat.charges.personnel.salaires],
      ['  dont charges patronales', resultat.charges.personnel.patronales],
      ['Dotations amortissements (68)', resultat.charges.amortissements],
      ...(resultat.charges.autres.map(c => [
        `${c.numero_compte ? c.numero_compte + ' - ' : ''}${c.libelle}`,
        c.montant
      ])),
      ['TOTAL CHARGES', resultat.charges.total],
      [],
      ['RÉSULTAT D\'EXPLOITATION', resultat.resultats.exploitation],
      ['RÉSULTAT AVANT IMPÔT', resultat.resultats.avant_impot],
      [`IMPÔT (${resultat.regime_fiscal})`, resultat.resultats.impot],
      ['RÉSULTAT NET', resultat.resultats.net]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, `CR ${annee}`);
    XLSX.writeFile(wb, `Compte_Resultat_${annee}.xlsx`);
    toast.success('Export Excel généré !');
  }*/}

  return (
    <div>
      {modalOuvert && (
        <ModalOperation
          onSave={ajouterOperation}
          onCancel={() => setModalOuvert(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📊 Compte de résultat</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...styles.input, width: '120px' }}
            value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {/*<button style={styles.boutonSecondaire} onClick={() => setModalOuvert(true)}>
            + Opération manuelle
          </button>
          <button style={styles.boutonSecondaire} onClick={exporterExcel}>
            📥 Export Excel
          </button>*/}
          <button style={{ ...styles.boutonSecondaire, opacity: exportEnCours ? 0.6 : 1 }}
            disabled={exportEnCours}
            onClick={exporterPDF}>
            {exportEnCours ? '⏳ Génération...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          ⏳ Chargement...
        </div>
      ) : resultat && (
        <>
          {/* Info régime */}
          <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '12px',
            marginBottom: '20px', fontSize: '13px', color: '#1565c0' }}>
            <strong>Régime fiscal :</strong> {resultat.regime_fiscal === 'IS'
              ? 'Impôt Synthétique (IS) — 5% du CA'
              : 'Impôt sur le Revenu (IR) — 20% du bénéfice net'} |
            <strong> Système :</strong> {resultat.systeme_comptable === 'SMT'
              ? 'Système Minimal de Trésorerie'
              : 'Système Normal PCG 2005'}
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              Compte de résultat — Exercice {annee}
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px' }}>
                    Libellé
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>
                    Montant (Ar)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* PRODUITS */}
                <LigneResultat label="PRODUITS D'EXPLOITATION" sousTitre />
                <LigneResultat label="70 — Ventes et prestations"
                  montant={resultat.produits.ventes} niveau={1} />
                {resultat.produits.autres.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                      {p.numero_compte ? `${p.numero_compte} — ` : ''}{p.libelle}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end',
                        alignItems: 'center', gap: '10px' }}>
                        {Number(p.montant).toLocaleString('fr-FR')} Ar
                        <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                          onClick={() => supprimerOperation(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                <LigneResultat label="TOTAL PRODUITS"
                  montant={resultat.produits.total}
                  gras couleur="#2e7d32" />

                {/* CHARGES */}
                <LigneResultat label="CHARGES D'EXPLOITATION" sousTitre />
                <LigneResultat label="60 — Achats fournisseurs"
                  montant={resultat.charges.fournisseurs} niveau={1} />
                <LigneResultat label="62 — Autres charges externes (tiers)"
                  montant={resultat.charges.tiers} niveau={1} />
                <LigneResultat label="64 — Charges de personnel"
                  montant={resultat.charges.personnel.total} niveau={1} />
                <LigneResultat label="dont salaires"
                  montant={resultat.charges.personnel.salaires} niveau={2} />
                <LigneResultat label="dont charges patronales"
                  montant={resultat.charges.personnel.patronales} niveau={2} />
                <LigneResultat label="68 — Dotations aux amortissements"
                  montant={resultat.charges.amortissements} niveau={1} />
                {resultat.charges.autres.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '8px 12px', paddingLeft: '32px', fontSize: '13px' }}>
                      {c.numero_compte ? `${c.numero_compte} — ` : ''}{c.libelle}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end',
                        alignItems: 'center', gap: '10px' }}>
                        {Number(c.montant).toLocaleString('fr-FR')} Ar
                        <button style={{ ...styles.boutonDanger, padding: '2px 6px', fontSize: '11px' }}
                          onClick={() => supprimerOperation(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                <LigneResultat label="TOTAL CHARGES"
                  montant={resultat.charges.total}
                  gras couleur="#c62828" />

                {/* RÉSULTATS */}
                <LigneResultat label="RÉSULTAT D'EXPLOITATION" sousTitre />
                <LigneResultat
                  label="Résultat d'exploitation"
                  montant={resultat.resultats.exploitation}
                  gras
                  couleur={resultat.resultats.exploitation >= 0 ? '#2e7d32' : '#c62828'}
                />

                <LigneResultat label="RÉSULTAT AVANT IMPÔT" sousTitre />
                <LigneResultat
                  label="Résultat avant impôt"
                  montant={resultat.resultats.avant_impot}
                  gras
                  couleur={resultat.resultats.avant_impot >= 0 ? '#2e7d32' : '#c62828'}
                />

                <LigneResultat label="IMPÔT" sousTitre />
                <LigneResultat
                  label={`${resultat.regime_fiscal} — ${resultat.regime_fiscal === 'IS'
                    ? '5% du CA'
                    : '20% du bénéfice net (min 1 000 000 + 1% CA)'}`}
                  montant={resultat.resultats.impot}
                  niveau={1}
                />

                {/* RÉSULTAT NET */}
                <tr style={{ background: '#004d5a' }}>
                  <td style={{ padding: '12px', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                    RÉSULTAT NET DE L'EXERCICE {annee}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right',
                    color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                    {Number(resultat.resultats.net).toLocaleString('fr-FR')} Ar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Résumé */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: 'CA Total', value: resultat.ca_total, couleur: '#1565c0' },
              { label: 'Total Produits', value: resultat.produits.total, couleur: '#2e7d32' },
              { label: 'Total Charges', value: resultat.charges.total, couleur: '#c62828' },
              { label: 'Résultat Net', value: resultat.resultats.net,
                couleur: resultat.resultats.net >= 0 ? '#2e7d32' : '#c62828' }
            ].map(item => (
              <div key={item.label} style={{ ...styles.card, marginBottom: 0,
                borderLeft: `4px solid ${item.couleur}` }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.couleur }}>
                  {Number(item.value).toLocaleString('fr-FR')} Ar
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}