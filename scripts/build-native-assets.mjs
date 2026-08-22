/**
 * Génère les sources d'icônes et de splash natifs à partir des logos de `public/`.
 *
 * Pourquoi un script plutôt qu'un simple `capacitor-assets generate` : l'app a
 * besoin de DEUX visuels distincts, que le mode « easy » ne sait pas produire
 * depuis une source unique.
 *
 *   - Icône d'application → la POUSSE seule (`public/logo-mark.svg`). Le verrou
 *     complet « pousse + kumy » est large (340×250) : réduit au carré puis rogné
 *     par le masque adaptatif Android, le mot deviendrait illisible.
 *   - Splash → le VERROU complet (`public/logo-kumy.svg`), qui a la place de
 *     s'afficher en entier et identifie la marque.
 *
 * Sortie : les cinq fichiers du mode « contrôle total » de @capacitor/assets,
 * dans `assets/`. Enchaîner ensuite `npx capacitor-assets generate --android`.
 *
 * Usage : `npm run assets:native`
 */
import { mkdir, writeFile } from 'node:fs/promises';

import sharp from 'sharp';

/** Fond crème Kumy — aligné sur capacitor.config.ts et le fond de l'app. */
const CREME = { r: 0xf7, g: 0xf4, b: 0xe9, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const ICONE = 1024;
const SPLASH = 2732;

/** Rend un SVG à la largeur voulue, puis le centre sur un canevas carré. */
async function centrer({ source, largeurLogo, canevas, fond }) {
  const logo = await sharp(source, { density: 600 })
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

// Icône pleine (iOS, PWA) : la pousse occupe 68 % du carré.
await writeFile(
  'assets/icon-only.png',
  await centrer({ source: 'public/logo-mark.svg', largeurLogo: Math.round(ICONE * 0.68), canevas: ICONE, fond: CREME }),
);

// Avant-plan de l'icône adaptative Android. Plus petit (60 %) : le système
// rogne hors de la zone sûre centrale et anime cette couche indépendamment.
await writeFile(
  'assets/icon-foreground.png',
  await centrer({
    source: 'public/logo-mark.svg',
    largeurLogo: Math.round(ICONE * 0.6),
    canevas: ICONE,
    fond: TRANSPARENT,
  }),
);

// Arrière-plan de l'icône adaptative : aplat, sans motif (il subit le masque).
await writeFile(
  'assets/icon-background.png',
  await sharp({ create: { width: ICONE, height: ICONE, channels: 4, background: CREME } })
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
      source: 'public/logo-mark.svg',
      largeurLogo: Math.round(taille * 0.68),
      canevas: taille,
      fond: CREME,
    }),
  );
}

// Variante `maskable` : la zone sûre est le disque central de 80 %. La pousse
// n'occupe donc que 55 % du carré, sans quoi le masque d'Android lui couperait
// les feuilles.
await writeFile(
  'public/icon-maskable-512.png',
  await centrer({ source: 'public/logo-mark.svg', largeurLogo: Math.round(512 * 0.55), canevas: 512, fond: CREME }),
);

// iOS n'applique aucun masque et ne gère pas la transparence : fond opaque.
await writeFile(
  'public/apple-touch-icon.png',
  await centrer({ source: 'public/logo-mark.svg', largeurLogo: Math.round(180 * 0.68), canevas: 180, fond: CREME }),
);

console.log('assets/ : icon-only, icon-foreground, icon-background, splash, splash-dark');
console.log('public/ : icon-192, icon-512, icon-maskable-512, apple-touch-icon');
