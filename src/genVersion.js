// Lancé automatiquement avant chaque build (voir "build" dans package.json).
// Écrit un numéro de version unique dans :
//   - public/version.json  (lu par le navigateur pour savoir s'il existe une version plus récente)
//   - src/buildVersion.js  (la version embarquée dans l'application chargée)
const fs = require('fs');
const path = require('path');

const version = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12) || String(Date.now());
const racine = __dirname; // ce fichier est à la racine du projet front, à côté de package.json

fs.writeFileSync(path.join(racine, 'public', 'version.json'), JSON.stringify({ version }) + '\n');
fs.writeFileSync(path.join(racine, 'src', 'buildVersion.js'), `export const BUILD_VERSION = '${version}';\n`);
console.log('[version] ' + version);