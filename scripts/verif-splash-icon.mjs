/**
 * Vérifie que la pousse du VectorDrawable est la MÊME forme que celle de
 * `public/logo-mark.svg`.
 *
 * Pourquoi ce garde-fou : `build-splash-icon.mjs` réécrit à la main les
 * nombres du tracé pour y aplatir la rotation. Une erreur de signe y produirait
 * une pousse retournée ou décalée — un défaut qu'une relecture du XML ne voit
 * pas, et qu'on ne découvrirait qu'au lancement de l'app.
 *
 * Méthode : on rend deux fois la même pousse à 2400 px, une fois avec le tracé
 * aplati, une fois en laissant le moteur SVG appliquer lui-même la matrice
 * d'origine, puis on compare pixel à pixel. Seul le liseré antialiasé doit
 * différer.
 *
 * Usage : `npm run assets:verif`
 */
import { readFile } from 'node:fs/promises';

import sharp from 'sharp';

const { tracePousse, boite, GABARIT, CENTRE, TAILLE_POUSSE, VERT_POUSSE } = await import('./build-splash-icon.mjs');

const echelle = TAILLE_POUSSE / Math.max(boite.largeur, boite.hauteur);
const dx = CENTRE - (boite.minX + boite.largeur / 2) * echelle;
const dy = CENTRE - (boite.minY + boite.hauteur / 2) * echelle;

const svgOrigine = await readFile('public/logo-mark.svg', 'utf8');
const groupeOrigine = svgOrigine.match(/<g transform[\s\S]*<\/g>/)?.[0];
if (!groupeOrigine) throw new Error('Groupe transformé introuvable dans public/logo-mark.svg');

const rendre = (contenu) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${GABARIT}" height="${GABARIT}" viewBox="0 0 ${GABARIT} ${GABARIT}">${contenu}</svg>`,
    ),
    // 600 dpi : le rendu monte à 2400 px, assez fin pour qu'un décalage d'un
    // demi-point du gabarit ressorte franchement.
    { density: 600 },
  )
    .raw()
    .toBuffer({ resolveWithObject: true });

const { data: aplati, info } = await rendre(`<path fill="${VERT_POUSSE}" fill-rule="evenodd" d="${tracePousse}"/>`);
const { data: origine } = await rendre(
  `<g fill-rule="evenodd" transform="translate(${dx},${dy}) scale(${echelle})">${groupeOrigine}</g>`,
);

const total = aplati.length / info.channels;
let differents = 0;
for (let p = 0; p < aplati.length; p += info.channels) {
  let ecart = 0;
  for (let c = 0; c < info.channels; c += 1) ecart = Math.max(ecart, Math.abs(aplati[p + c] - origine[p + c]));
  // 24 sur 255 : au-dessus du bruit d'antialiasing, très en dessous d'un
  // pixel qui bascule du vert au vide.
  if (ecart > 24) differents += 1;
}

// 0,01 % du rendu. Un liseré antialiasé en occupe environ dix fois moins ; une
// pousse déplacée ou retournée en occuperait plusieurs pourcents.
const SEUIL = total * 0.0001;
const proportion = ((differents / total) * 100).toFixed(4);
console.log(`rendu ${info.width}×${info.height} — ${differents} pixels d'écart (${proportion} %), seuil ${Math.round(SEUIL)}`);

if (differents > SEUIL) {
  console.error('ÉCHEC : la pousse aplatie ne correspond plus à public/logo-mark.svg');
  process.exit(1);
}
console.log('OK : forme fidèle, seul le liseré antialiasé diffère');
