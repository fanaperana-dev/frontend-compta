import React, { useEffect, useState } from 'react';
import { BUILD_VERSION } from '../buildVersion';

// Affiche un bandeau « Veuillez actualiser » quand une nouvelle version de l'application a été déployée.
// La vérification se fait une seule fois à l'ouverture de l'application, puis chaque fois que
// l'utilisateur revient sur l'onglet (pas de vérification en boucle).
export default function MiseAJourAuto() {
  const [nouvelleVersion, setNouvelleVersion] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return undefined; // pas en développement local
    let actif = true;

    const verifier = async () => {
      try {
        const rep = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!rep.ok) return;
        const data = await rep.json();
        if (actif && data && data.version && data.version !== BUILD_VERSION) setNouvelleVersion(true);
      } catch (e) { /* hors ligne : on réessaiera au prochain retour sur l'onglet */ }
    };

    verifier();
    const auRetour = () => { if (document.visibilityState === 'visible') verifier(); };
    document.addEventListener('visibilitychange', auRetour);
    return () => { actif = false; document.removeEventListener('visibilitychange', auRetour); };
  }, []);

  if (!nouvelleVersion) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
      background: '#004d5a', color: 'white', padding: '12px 18px', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: 'Arial, sans-serif', fontSize: 14
    }}>
      <span>🔄 Une nouvelle version est disponible, veuillez actualiser.</span>
      <button onClick={() => window.location.reload()} style={{
        background: 'white', color: '#004d5a', border: 'none', borderRadius: 6,
        padding: '6px 14px', fontWeight: 'bold', cursor: 'pointer'
      }}>
        Actualiser
      </button>
    </div>
  );
}