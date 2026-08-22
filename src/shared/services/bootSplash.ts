/**
 * Retrait de l'écran d'attente déclaré dans `index.html`.
 *
 * Il vit HORS de `#root` : React efface le contenu de `#root` à son premier
 * rendu, et `App` ne rend rien tant que la session n'est pas initialisée. Un
 * loader placé dedans laisserait donc un écran vide pendant toute
 * l'authentification — exactement le moment qu'il doit couvrir.
 */

const SPLASH_ID = 'kumy-splash';
const DUREE_FONDU_MS = 420; // doit rester aligné sur la transition d'index.html

let retire = false;

/**
 * Fait disparaître l'écran d'attente. Idempotent : appelable depuis plusieurs
 * chemins (session prête, échec d'initialisation) sans risque de double retrait.
 */
export function dismissBootSplash(): void {
  if (retire) return;
  retire = true;

  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return;

  splash.classList.add('is-gone');

  // On retire le nœud plutôt que de le laisser transparent : il est en position
  // fixe sur toute la surface et intercepterait sinon les gestes de l'app.
  window.setTimeout(() => splash.remove(), DUREE_FONDU_MS);
}
