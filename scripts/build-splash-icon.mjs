/**
 * Génère l'icône VECTORIELLE de l'écran de démarrage Android 12+.
 *
 * Pourquoi ce script existe. Le thème de lancement pointait sur
 * `@mipmap/ic_launcher` : un PNG de 192 px au maximum, que l'API SplashScreen
 * étire sur un gabarit de 288 dp (≈ 790 px sur un écran 440 dpi). D'où le flou
 * mesuré à l'écran. Et comme ce mipmap est une icône ADAPTATIVE, le système —
 * et plus encore les surcouches (MIUI) — lui applique son masque : le fond
 * crème cuit dans l'icône se retrouvait découpé en carré arrondi, dont le bord
 * antialiasé traçait la bordure visible sur fond crème quasi identique.
 *
 * La réponse aux deux défauts est la même : un `VectorDrawable` sans fond.
 * Net à toute densité, et non adaptatif donc jamais masqué.
 *
 * La composition n'est pas l'icône du lanceur mais le PREMIER TEMPS de l'écran
 * d'attente d'`index.html` : la pousse au centre de la couronne de couverture.
 * Cette couronne est l'instrument de Kumy (le rayon d'une station) et déjà la
 * signature de l'écran suivant. Les trois temps du démarrage — splash système,
 * splash Capacitor, écran web — partagent enfin un même objet.
 *
 * Ce qui n'y est PAS, volontairement :
 *   - aucun texte : le seul emplacement offert par l'API (`brandingImage`) est
 *     bitmap, ce qui réintroduirait le flou qu'on corrige ici. Les mots
 *     commencent au temps suivant.
 *   - aucune animation : le splash se retire dès la première image de l'app.
 *     Une séquence coupée à un instant arbitraire se lit comme un raté. Le
 *     mouvement appartient aux temps 2 et 3, où il va jusqu'au bout.
 *   - aucun marqueur en orbite : ce sont eux l'indicateur de chargement de
 *     l'écran d'attente. Les poser ici, figés, les viderait de leur sens.
 *
 * Sortie : android/app/src/main/res/drawable/splash_kumy.xml
 * Usage  : `npm run assets:native` (ou `node scripts/build-splash-icon.mjs`)
 */
import { readFile, writeFile } from 'node:fs/promises';

// --- Gabarit imposé par l'API SplashScreen ---------------------------------
// Sans fond d'icône, Android dessine un gabarit de 288 dp dont seul le disque
// central de 192 dp est garanti visible. Toute la composition tient dedans.
const GABARIT = 288;
const CENTRE = GABARIT / 2;
const ZONE_SURE = 192;

/** Couronne : Ø 176, soit la zone sûre moins une marge d'air de 8 de chaque côté. */
const RAYON_COURONNE = 88;
/** 80 points, comme `.ks-couronne` dans index.html — même rythme, même densité. */
const NB_POINTS = 80;
/**
 * Rapport point/rayon repris de l'écran d'attente (trait 2,3 pour r 94), pour
 * que la trame ait la même finesse d'un temps à l'autre.
 */
const RAYON_POINT = RAYON_COURONNE / 41 / 2;

/**
 * Pousse : côté le plus long de son ENCRE, en unités du gabarit.
 * 96 sur une couronne de 176, soit 55 % : elle habite le cercle sans le remplir.
 */
const TAILLE_POUSSE = 96;

// Tokens Kumy. Aucune couleur inventée ici.
const VERT_KUMY = '#018675'; // couronne — le vert profond qui tient sur le crème
const VERT_POUSSE = '#41B782'; // la marque, inchangée (cf. medaillon de bienvenue)
const OPACITE_COURONNE = 0.48; // identique à `.ks-couronne`

// --- Transformation du tracé de la marque ----------------------------------
// `logo-mark.svg` porte sa pousse dans un groupe tourné : matrix(0,-1,1,0,e,f).
// Un VectorDrawable saurait faire tourner un <group>, mais l'ordre des
// transformations y est une source d'erreur classique. On aplatit donc la
// rotation DANS les nombres du tracé, et on vérifie le résultat au pixel
// (voir scripts/verif-splash-icon.mjs).
const ROT_E = -0.0014;
const ROT_F = 846.6678;

/** Rotation seule : les coordonnées d'origine vers l'espace redressé. */
const redresser = ([x, y]) => [y + ROT_E, ROT_F - x];

/**
 * Lit le tracé et le rend en points ABSOLUS redressés.
 *
 * Ne gère que les commandes présentes dans `logo-mark.svg` (M, m, l, c, z) et
 * REFUSE tout le reste : un arc ou un `h` silencieusement ignoré produirait une
 * pousse déformée que la revue visuelle pourrait laisser passer.
 */
function lireTrace(d) {
  const jetons = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const segments = [];
  let commande = '';
  let i = 0;
  let courant = [0, 0];
  let depart = [0, 0];

  const nombre = () => {
    const valeur = Number(jetons[i++]);
    if (Number.isNaN(valeur)) throw new Error(`Nombre attendu, reçu « ${jetons[i - 1]} »`);
    return valeur;
  };
  const absolu = () => [nombre(), nombre()];
  const relatif = () => {
    const [dx, dy] = absolu();
    return [courant[0] + dx, courant[1] + dy];
  };

  while (i < jetons.length) {
    if (/[A-Za-z]/.test(jetons[i])) commande = jetons[i++];

    switch (commande) {
      case 'M':
      case 'm': {
        courant = commande === 'M' ? absolu() : relatif();
        depart = courant;
        segments.push({ type: 'M', points: [courant] });
        // Un M suivi d'autres paires enchaîne des L implicites.
        commande = commande === 'M' ? 'L' : 'l';
        break;
      }
      case 'L':
      case 'l': {
        courant = commande === 'L' ? absolu() : relatif();
        segments.push({ type: 'L', points: [courant] });
        break;
      }
      case 'C':
      case 'c': {
        const points = [];
        for (let n = 0; n < 3; n += 1) points.push(commande === 'C' ? absolu() : relatif());
        courant = points[2];
        segments.push({ type: 'C', points });
        break;
      }
      case 'z':
      case 'Z':
        courant = depart;
        segments.push({ type: 'Z', points: [] });
        break;
      default:
        throw new Error(`Commande « ${commande} » non gérée par le convertisseur`);
    }
  }

  return segments.map((s) => ({ ...s, points: s.points.map(redresser) }));
}

/**
 * Boîte serrée de l'ENCRE, pas de la viewBox.
 *
 * `logo-mark.svg` laisse de la marge autour de la pousse, et cette marge n'est
 * pas symétrique : centrer la viewBox faisait pendre la pousse en haut à
 * gauche de la couronne (constaté sur le rendu d'essai). On échantillonne donc
 * les cubiques pour obtenir la vraie étendue du tracé.
 */
function boiteEncre(segments) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const noter = ([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  let courant = [0, 0];
  for (const { type, points } of segments) {
    if (type === 'M' || type === 'L') {
      noter(points[0]);
      courant = points[0];
    } else if (type === 'C') {
      const [p1, p2, p3] = points;
      const ECHANTILLONS = 48;
      for (let n = 0; n <= ECHANTILLONS; n += 1) {
        const t = n / ECHANTILLONS;
        const u = 1 - t;
        noter([
          u * u * u * courant[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * courant[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
      courant = p3;
    }
  }

  return { minX, minY, largeur: maxX - minX, hauteur: maxY - minY };
}

const arrondi = (n) => Number(n.toFixed(3)).toString();

/** Met l'encre à l'échelle voulue et la centre sur le gabarit. */
function poserTrace(segments, boite) {
  const echelle = TAILLE_POUSSE / Math.max(boite.largeur, boite.hauteur);
  const dx = CENTRE - (boite.minX + boite.largeur / 2) * echelle;
  const dy = CENTRE - (boite.minY + boite.hauteur / 2) * echelle;
  const poser = ([x, y]) => `${arrondi(x * echelle + dx)},${arrondi(y * echelle + dy)}`;

  return segments
    .map(({ type, points }) => (type === 'Z' ? 'z' : type + points.map(poser).join(' ')))
    .join(' ');
}

// --- Couronne ---------------------------------------------------------------
// Un VectorDrawable ne connaît PAS `stroke-dasharray` : la trame de l'écran
// d'attente ne peut donc pas être un cercle pointillé. On dessine les 80 points
// un par un, chacun en deux demi-arcs.
function tracerCouronne() {
  const points = [];
  for (let n = 0; n < NB_POINTS; n += 1) {
    const angle = (n / NB_POINTS) * 2 * Math.PI;
    const x = CENTRE + RAYON_COURONNE * Math.cos(angle);
    const y = CENTRE + RAYON_COURONNE * Math.sin(angle);
    const r = arrondi(RAYON_POINT);
    points.push(
      `M${arrondi(x - RAYON_POINT)},${arrondi(y)}a${r},${r} 0 1,0 ${arrondi(RAYON_POINT * 2)},0a${r},${r} 0 1,0 ${arrondi(-RAYON_POINT * 2)},0z`,
    );
  }
  return points.join('');
}

const svgMarque = await readFile('public/logo-mark.svg', 'utf8');
const traceOrigine = svgMarque.match(/\sd="([^"]+)"/)?.[1];
if (!traceOrigine) throw new Error('Tracé introuvable dans public/logo-mark.svg');

const segments = lireTrace(traceOrigine);
const boite = boiteEncre(segments);
const tracePousse = poserTrace(segments, boite);

const xml = `<?xml version="1.0" encoding="utf-8"?>
<!--
    GÉNÉRÉ par scripts/build-splash-icon.mjs — ne pas éditer à la main.
    Source : public/logo-mark.svg. Régénérer avec \`npm run assets:native\`.

    Icône de l'écran de démarrage Android 12+ (attribut
    windowSplashScreenAnimatedIcon, cf. values/styles.xml). Gabarit de ${GABARIT},
    composition contenue dans la zone sûre de ${ZONE_SURE}.
-->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${GABARIT}dp"
    android:height="${GABARIT}dp"
    android:viewportWidth="${GABARIT}"
    android:viewportHeight="${GABARIT}">

    <!-- Couronne de couverture : ${NB_POINTS} points, comme .ks-couronne d'index.html. -->
    <path
        android:fillColor="${VERT_KUMY}"
        android:fillAlpha="${OPACITE_COURONNE}"
        android:pathData="${tracerCouronne()}" />

    <!-- La pousse Kumy. -->
    <path
        android:fillColor="${VERT_POUSSE}"
        android:fillType="evenOdd"
        android:pathData="${tracePousse}" />
</vector>
`;

await writeFile('android/app/src/main/res/drawable/splash_kumy.xml', xml);
console.log(`android/app/src/main/res/drawable/splash_kumy.xml (${(xml.length / 1024).toFixed(1)} Ko)`);
console.log(`encre de la pousse : ${boite.largeur.toFixed(1)} x ${boite.hauteur.toFixed(1)} dans une viewBox de ${795.942}`);

export { tracePousse, tracerCouronne, boite, GABARIT, CENTRE, RAYON_COURONNE, TAILLE_POUSSE, VERT_KUMY, VERT_POUSSE, OPACITE_COURONNE };
