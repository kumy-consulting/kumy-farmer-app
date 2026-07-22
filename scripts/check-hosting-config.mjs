// Vérifie la forme des configurations Firebase Hosting.
// Exécuté manuellement et par la CI (job build).
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf-8'));

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const CASES = [
  { file: 'firebase.dev.json', site: 'kumy-farmer-dev', service: 'agripilot-backoffice-api-dev' },
  { file: 'firebase.prod.json', site: 'kumy-farmer-prod', service: 'agripilot-backoffice-api' },
];

for (const { file, site, service } of CASES) {
  const cfg = read(file);
  const h = cfg.hosting;
  check(!!h, `${file}: bloc "hosting" manquant`);
  check(h?.site === site, `${file}: hosting.site attendu "${site}", reçu "${h?.site}"`);
  check(h?.public === 'dist', `${file}: hosting.public doit valoir "dist"`);
  check(!cfg.firestore, `${file}: bloc "firestore" interdit (risque de clobber des index)`);

  const rewrites = h?.rewrites ?? [];
  const api = rewrites.find((r) => r.source === '/api/**');
  check(!!api, `${file}: rewrite "/api/**" manquant`);
  check(api?.run?.serviceId === service, `${file}: serviceId attendu "${service}", reçu "${api?.run?.serviceId}"`);
  check(api?.run?.region === 'europe-west1', `${file}: région attendue "europe-west1"`);
  check(
    rewrites.indexOf(api) < rewrites.findIndex((r) => r.source === '**'),
    `${file}: le rewrite "/api/**" doit précéder le catch-all "**"`,
  );
  check(
    rewrites.some((r) => r.source === '**' && r.destination === '/index.html'),
    `${file}: rewrite SPA "**" -> /index.html manquant`,
  );

  // Le bloc générique d'assets (**/*.@(...|js|...)) DOIT rester en cache long,
  // sinon l'app perd le bénéfice du cache pour ses assets statiques.
  const headers = h?.headers ?? [];
  const genericAssetsIndex = headers.findIndex((entry) => entry.source === '**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2|ttf|eot)');
  const genericAssets = headers[genericAssetsIndex];
  check(
    genericAssets?.headers?.some((x) => x.key === 'Cache-Control' && x.value === 'max-age=31536000'),
    `${file}: header max-age=31536000 manquant pour le bloc générique d'assets`,
  );

  // Le service worker DOIT être servi en no-cache, sinon l'app se fige chez l'utilisateur.
  const noCacheIndex = (source) =>
    headers.findIndex(
      (entry) =>
        entry.source === source &&
        entry.headers.some((x) => x.key === 'Cache-Control' && x.value === 'no-cache'),
    );
  for (const source of ['/index.html', '/sw.js', '/registerSW.js', '/workbox-*.js']) {
    const idx = noCacheIndex(source);
    check(idx !== -1, `${file}: header no-cache manquant pour "${source}"`);

    // sw.js / registerSW.js / workbox-*.js sont aussi des ".js" : ils matchent le bloc
    // générique d'assets ci-dessus (max-age=31536000). Firebase Hosting applique les
    // headers de TOUS les blocs qui matchent, dans l'ORDRE du tableau — si le bloc
    // générique arrivait après l'override no-cache, ce dernier serait écrasé et le
    // service worker se retrouverait servi en cache long (l'app se figerait chez
    // l'utilisateur, exactement le bug que cet override est censé empêcher).
    if (idx !== -1 && source !== '/index.html' && genericAssetsIndex !== -1) {
      check(
        genericAssetsIndex < idx,
        `${file}: le bloc générique d'assets doit précéder l'override no-cache de "${source}" ` +
          `(sinon max-age=31536000 écrase le no-cache et le service worker reste en cache long)`,
      );
    }
  }
}

const rc = read('.firebaserc');
check(rc.projects?.development === 'kumy-agripilot-dev', '.firebaserc: alias development incorrect');
check(rc.projects?.production === 'kumy-agripilot-prod', '.firebaserc: alias production incorrect');

if (failures.length) {
  console.error('Configuration Hosting invalide :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Configuration Hosting valide.');
