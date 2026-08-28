/**
 * Génère les sources d'icônes et de splash natifs à partir des logos de `public/`.
 *
 * Pourquoi un script plutôt qu'un simple `capacitor-assets generate` : le mode
 * « easy » ne sait produire ni les cinq fichiers du mode « contrôle total », ni
 * deux fonds différents.
 *
 * Icône d'application et splash portent tous deux le VERROU complet
 * (`public/logo-kumy.svg`, pousse + « kumy »). L'icône reprend les proportions
 * MESURÉES sur celle d'AgriPilot — verrou à 48 % du carré, fond blanc — pour
 * que les deux applications de la suite se reconnaissent d'un coup d'œil sur
 * l'écran d'accueil.
 *
 * Le verrou est large (340×250). À 48 % il reste dans la zone sûre du masque
 * adaptatif d'Android, y compris circulaire ; plus haut, les surcouches qui
 * masquent serré rogneraient le mot.
 *
 * Sortie : les cinq fichiers du mode « contrôle total » de @capacitor/assets,
 * dans `assets/`. Enchaîner ensuite `npx capacitor-assets generate --android`.
 *
 * Usage : `npm run assets:native`
 */
import { mkdir, writeFile } from 'node:fs/promises';

import sharp from 'sharp';

/** Fond crème Kumy — aligné sur capacitor.config.ts et le fond de l'app. Splash. */
const CREME = { r: 0xf7, g: 0xf4, b: 0xe9, alpha: 1 };
/** Fond des ICÔNES : blanc, comme celle d'AgriPilot. */
const BLANC = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const ICONE = 1024;
const SPLASH = 2732;

/**
 * Largeur du verrou dans l'icône, en fraction du carré.
 *
 * Calée non pas sur le FICHIER d'AgriPilot (48 % de son carré) mais sur son
 * rendu À L'ÉCRAN, les deux icônes côte à côte dans le tiroir d'applications :
 * Android ne présente pas de la même façon une icône adaptative native et
 * l'icône maskable d'une WebAPK, et 48 % donnait un verrou 10 % trop petit.
 *
 * 54 % rétablit l'égalité. À cette taille le verrou reste dans le disque du
 * masque le plus serré : son demi-diagonal vaut 32 % du carré, pour un rayon
 * visible de 50 %.
 */
const VERROU = 0.54;

/**
 * Rend un SVG à la largeur voulue, puis le centre sur un canevas carré.
 *
 * On rogne d'abord sur l'ENCRE. `logo-kumy.svg` porte une marge interne large :
 * son encre ne fait que 48 % de la largeur de sa viewBox. Dimensionner le
 * canevas du SVG donnait donc un verrou deux fois trop petit que la proportion
 * demandée — mesuré, et visible à l'œil à côté de l'icône d'AgriPilot.
 */
async function centrer({ source, largeurLogo, canevas, fond }) {
  const rendu = await sharp(source, { density: 600 }).png().toBuffer();
  const logo = await sharp(rendu)
    .trim({ threshold: 1 })
    .resize({ width: largeurLogo, fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: { width: canevas, height: canevas, channels: 4, background: fond },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

await mkdir('assets', { recursive: true });

// Icône pleine : Android < 26 (ic_launcher.png) et iOS. Tout le carré est
// visible, on reprend donc exactement la proportion d'AgriPilot.
await writeFile(
  'assets/icon-only.png',
  await centrer({
    source: 'public/logo-kumy.svg',
    largeurLogo: Math.round(ICONE * VERROU),
    canevas: ICONE,
    fond: BLANC,
  }),
);

// Avant-plan de l'icône adaptative Android (API 26+).
//
// Même proportion, et non une plus petite : `mipmap-anydpi-v26/ic_launcher.xml`
// insère déjà les deux couches de 16,7 %, si bien que ce canevas ne couvre que
// la zone sûre — celle que le masque laisse voir. Le verrou y occupe donc 48 %
// de ce qui est RÉELLEMENT affiché, comme sur l'icône d'AgriPilot.
await writeFile(
  'assets/icon-foreground.png',
  await centrer({
    source: 'public/logo-kumy.svg',
    largeurLogo: Math.round(ICONE * VERROU),
    canevas: ICONE,
    fond: TRANSPARENT,
  }),
);

// Arrière-plan de l'icône adaptative : aplat, sans motif (il subit le masque).
await writeFile(
  'assets/icon-background.png',
  await sharp({ create: { width: ICONE, height: ICONE, channels: 4, background: BLANC } })
    .png()
    .toBuffer(),
);

// Splash des versions ANTÉRIEURES à Android 12 (Android 12+ ignore ce fichier et
// dessine l'icône sur `windowSplashScreenBackground`, cf. values/styles.xml).
//
// Reprend la composition de l'écran d'attente d'`index.html` — dégradé crème
// vers sauge, couronne de points, marqueurs — pour que les deux se succèdent
// sans rupture. Les marqueurs sont figés là où leur orbite les aurait placés.
//
// Les longueurs de tirets sont CALCULÉES ici, alors qu'`index.html` s'appuie sur
// `pathLength`. Vérifié : librsvg, qui rend ce SVG, ignore cet attribut et lisait
// les tirets en unités brutes — le cercle sortait quasi plein. Le facteur de
// Bézier corrige l'écart entre 2·π·r et la longueur réellement parcourue.
// Aucun texte : le rendu SVG dépendrait d'une police installée sur la machine de
// build, ce qu'on ne peut pas garantir. Les mots vivent dans le HTML.
const FOND_SPLASH = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPLASH}" height="${SPLASH}" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F7F4E9"/>
      <stop offset="34%" stop-color="#EDF3EA"/>
      <stop offset="68%" stop-color="#D9E7DB"/>
      <stop offset="100%" stop-color="#BED4C0"/>
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.72"/>
      <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auraReleve">
      <stop offset="34%" stop-color="#018675" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#018675" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auraVigilance">
      <stop offset="34%" stop-color="#C68A1A" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#C68A1A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" fill="url(#ciel)"/>
  <circle cx="100" cy="100" r="26.6" fill="none" stroke="#018675" stroke-opacity="0.48"
          stroke-width="0.651" stroke-linecap="round"
          stroke-dasharray="0.0040 2.0818"/>
  <g>
    <circle cx="123.91" cy="88.34" r="2.688" fill="url(#auraReleve)"/>
    <circle cx="123.91" cy="88.34" r="0.962" fill="#018675"/>
    <circle cx="92.22" cy="125.44" r="2.405" fill="url(#auraVigilance)"/>
    <circle cx="92.22" cy="125.44" r="0.792" fill="#C68A1A"/>
  </g>
  <circle cx="100" cy="100" r="17.5" fill="url(#halo)"/>
</svg>`;

const logoSplash = await sharp('public/logo-kumy.svg', { density: 600 })
  .resize({ width: Math.round(SPLASH * 0.132), fit: 'inside' })
  .png()
  .toBuffer();

const splash = await sharp(Buffer.from(FOND_SPLASH))
  .composite([{ input: logoSplash, gravity: 'centre' }])
  .png()
  .toBuffer();
await writeFile('assets/splash.png', splash);
// L'app est en thème clair uniquement (`color-scheme: light`) : le splash sombre
// reprend donc le même visuel, pour ne pas offrir un fond que rien ne prolonge.
await writeFile('assets/splash-dark.png', splash);

// --- Icônes web (PWA installable, favicon, iOS) -----------------------------
// Le manifeste ne peut pas se contenter du SVG : à l'installation, Android et
// iOS réclament des PNG de taille connue, et `maskable` impose une marge que le
// SVG serré ne laisse pas.
for (const taille of [192, 512]) {
  await writeFile(
    `public/icon-${taille}.png`,
    await centrer({
      source: 'public/logo-kumy.svg',
      largeurLogo: Math.round(taille * VERROU),
      canevas: taille,
      fond: BLANC,
    }),
  );
}

// Variante `maskable` : la zone sûre est le disque central de 80 %. Le verrou y
// est resserré à 40 %, sans quoi le masque couperait le mot par les côtés — il
// est deux fois plus large que haut, c'est lui que le disque contraint.
await writeFile(
  'public/icon-maskable-512.png',
  await centrer({ source: 'public/logo-kumy.svg', largeurLogo: Math.round(512 * 0.4), canevas: 512, fond: BLANC }),
);

// iOS n'applique aucun masque et ne gère pas la transparence : fond opaque.
await writeFile(
  'public/apple-touch-icon.png',
  await centrer({ source: 'public/logo-kumy.svg', largeurLogo: Math.round(180 * VERROU), canevas: 180, fond: BLANC }),
);

console.log('assets/ : icon-only, icon-foreground, icon-background, splash, splash-dark');
console.log('public/ : icon-192, icon-512, icon-maskable-512, apple-touch-icon');
