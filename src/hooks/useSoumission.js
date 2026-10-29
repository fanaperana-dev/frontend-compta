import { useState, useRef } from 'react';

/**
 * Anti double-clic pour les boutons Créer / Valider / Enregistrer.
 *   const { enCours, soumettre } = useSoumission();
 *   <button disabled={enCours} onClick={() => soumettre(() => onSave(form))}>
 *     {enCours ? '⏳ Patientez...' : 'Enregistrer'}
 *   </button>
 * Le verrou est posé immédiatement (ref) : un second clic dans la même fraction de seconde est ignoré,
 * avant même que le bouton soit grisé à l'écran. Il se relâche à la fin de l'action (succès ou erreur).
 */
export default function useSoumission() {
  const [enCours, setEnCours] = useState(false);
  const verrou = useRef(false);

  async function soumettre(action) {
    if (verrou.current) return undefined;
    verrou.current = true;
    setEnCours(true);
    try {
      return await action();
    } finally {
      verrou.current = false;
      setEnCours(false);
    }
  }

  return { enCours, soumettre };
}
