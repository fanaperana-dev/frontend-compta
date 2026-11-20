/** Tarif mensuel net d'une entreprise (mêmes règles que le serveur : services/tarifEntreprise.js). */
const arrondir2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

export function calculerTarifNet(tarif, type = 'AUCUNE', valeur = 0) {
  const t = Number(tarif) || 0, v = Number(valeur) || 0;
  let remise = 0;
  if (type === 'POURCENT') remise = (t * v) / 100;
  else if (type === 'MONTANT') remise = v;
  remise = arrondir2(Math.min(Math.max(remise, 0), t));
  return { tarif: arrondir2(t), remise, net: arrondir2(arrondir2(t) - remise) };
}

export const ar = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Ar`;

export function libelleRemise(type, valeur) {
  if (type === 'POURCENT') return `${Number(valeur).toLocaleString('fr-FR')} %`;
  if (type === 'MONTANT') return ar(valeur);
  return '';
}
