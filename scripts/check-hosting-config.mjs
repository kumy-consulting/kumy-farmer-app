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

  // Le service worker DOIT être servi en no-cache, sinon l'app se fige chez l'utilisateur.
  const noCache = (source) =>
    (h?.headers ?? []).some(
      (entry) =>
        entry.source === source &&
        entry.headers.some((x) => x.key === 'Cache-Control' && x.value === 'no-cache'),
    );
  for (const source of ['/index.html', '/sw.js', '/registerSW.js', '/workbox-*.js']) {
    check(noCache(source), `${file}: header no-cache manquant pour "${source}"`);
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
