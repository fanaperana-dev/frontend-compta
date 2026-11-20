// Styles et formats partagés par les onglets du module Production
export const styles = {
  boutonPrimaire: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  boutonSecondaire: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  boutonDanger: { background: 'white', color: '#c62828', border: '2px solid #c62828', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  input: { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  inputPetit: { width: '100%', padding: '7px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: '12px', padding: '28px', width: '860px', maxWidth: '96vw', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  th: { padding: '10px', textAlign: 'left', fontSize: '12px', color: '#555', borderBottom: '2px solid #e0e0e0' },
  td: { padding: '10px', fontSize: '13px' },
};

export const ar = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Ar`;
export const qte = (n) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 4 });
