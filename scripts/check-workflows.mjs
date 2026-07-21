// Vérifie les invariants des workflows GitHub Actions.
// L'invariant critique : aucun push sur main ne doit pouvoir livrer en production.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (p) => parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf-8'));

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const deploy = read('.github/workflows/deploy.yml');
// « on » est interprété comme le booléen true par YAML 1.1 ; le paquet `yaml`
// suit YAML 1.2 et renvoie bien la clé "on". On accepte les deux par prudence.
const on = deploy.on ?? deploy[true];

check(!!on.workflow_call, 'deploy.yml: doit exposer workflow_call (appelé par release-please)');
check(
  on.workflow_call?.inputs?.environment?.required === true,
  'deploy.yml: workflow_call doit exiger une entrée "environment"',
);
check(!!on.workflow_dispatch, 'deploy.yml: workflow_dispatch manquant (secours manuel)');
check(on.push?.branches?.includes('main'), 'deploy.yml: doit se déclencher sur push main');
check(on.push?.tags?.includes('v*'), 'deploy.yml: doit se déclencher sur tag v*');
check(on.pull_request?.branches?.includes('main'), 'deploy.yml: doit se déclencher sur PR vers main');

const jobs = deploy.jobs ?? {};
for (const name of ['resolve', 'build', 'deploy-dev', 'deploy-prod']) {
  check(!!jobs[name], `deploy.yml: job "${name}" manquant`);
}

// Invariant structurant : deploy-prod ne se déclenche que si l'env résolu est
// "production". La résolution (job resolve) ne renvoie "production" que sur tag
// ou appel explicite — jamais sur un push de branche.
const prodIf = String(jobs['deploy-prod']?.if ?? '');
check(
  prodIf.includes("== 'production'"),
  'deploy.yml: deploy-prod doit être gardé par une condition sur l environnement résolu',
);
// Symétrique : sans ce garde-fou, on pourrait retirer le `if:` de deploy-dev
// sans que rien ne le signale — une release prod ferait alors AUSSI tourner
// deploy-dev, écrasant le site dev silencieusement.
const devIf = String(jobs['deploy-dev']?.if ?? '');
check(
  devIf.includes("== 'development'"),
  'deploy.yml: deploy-dev doit être gardé par une condition sur l environnement résolu ("== \'development\'")',
);
check(
  jobs['deploy-prod']?.environment === 'production',
  'deploy.yml: deploy-prod doit déclarer environment: production',
);
check(
  jobs['deploy-dev']?.environment === 'development',
  'deploy.yml: deploy-dev doit déclarer environment: development',
);
check(
  jobs['deploy-dev']?.concurrency?.['cancel-in-progress'] === true,
  'deploy.yml: deploy-dev doit annuler les runs concurrents (le canal live est écrasé)',
);
check(
  jobs['deploy-prod']?.concurrency?.['cancel-in-progress'] === false,
  'deploy.yml: deploy-prod ne doit JAMAIS annuler un déploiement prod en cours',
);

// Invariant structurant (bis) : le commentaire en tête de ce fichier promet
// « aucun push sur main ne doit pouvoir livrer en production », mais les
// assertions ci-dessus n'inspectent que les `if:` de deploy-dev/deploy-prod,
// jamais la LOGIQUE qui calcule l'environnement dans le job "resolve". Une
// revue a montré qu'en remplaçant le TARGET="development" par défaut (branche
// push/pull_request) par "production", ce garde-fou passait toujours au vert.
// On inspecte donc directement le texte de l'étape shell "resolve".
const resolveStep = (jobs.resolve?.steps ?? []).find((step) => step?.id === 'resolve');
const resolveRun = String(resolveStep?.run ?? '');
check(!!resolveRun, 'deploy.yml: étape shell "resolve" (id: resolve) introuvable dans le job "resolve"');
check(
  resolveRun.includes('refs/tags/v') && resolveRun.includes('TARGET="production"'),
  'deploy.yml: TARGET ne doit passer à "production" que sous une garde sur un tag refs/tags/v*',
);
check(
  resolveRun.includes('TARGET="development"'),
  'deploy.yml: le défaut (push main / pull_request, hors tag) doit rester TARGET="development" ' +
    '— sinon un push sur main livre en production',
);
check(
  resolveRun.includes('exit 1'),
  'deploy.yml: le job "resolve" doit échouer explicitement (exit 1) si TARGET n est ni development ni production ' +
    '(sinon deploy-dev ET deploy-prod sont skippés silencieusement et le run reste vert sans rien déployer)',
);

// Garde-fou anti-régression : `--if-present` rend l'étape de test silencieuse
// tant qu'aucun script "test" n'existe (cf. package.json). Ça permet aussi de
// supprimer l'étape sans que rien ne s'en aperçoive — cette assertion s'assure
// qu'elle reste présente, pour que la vraie suite (vitest, à venir via
// feature/onboarding-p1-connexion-invitation) soit exécutée automatiquement.
const buildSteps = jobs.build?.steps ?? [];
check(
  buildSteps.some((step) => String(step?.run ?? '').includes('npm run test')),
  'deploy.yml: le job "build" doit conserver une étape exécutant "npm run test" (même via --if-present)',
);

const rp = read('.github/workflows/release-please.yml');
const rpOn = rp.on ?? rp[true];
check(rpOn.push?.branches?.includes('main'), 'release-please.yml: doit se déclencher sur push main');

const rpJobs = rp.jobs ?? {};
check(!!rpJobs['release-please'], 'release-please.yml: job "release-please" manquant');
check(!!rpJobs['deploy-prod'], 'release-please.yml: job "deploy-prod" manquant');
check(
  rpJobs['deploy-prod']?.uses === './.github/workflows/deploy.yml',
  'release-please.yml: deploy-prod doit appeler ./.github/workflows/deploy.yml',
);
check(
  rpJobs['deploy-prod']?.with?.environment === 'production',
  'release-please.yml: deploy-prod doit passer environment: production',
);
check(
  rpJobs['deploy-prod']?.secrets === 'inherit',
  'release-please.yml: deploy-prod doit hériter des secrets',
);
// Sans cette garde, chaque push sur main livrerait en production.
check(
  String(rpJobs['deploy-prod']?.if ?? '').includes('release_created'),
  'release-please.yml: deploy-prod doit être gardé par release_created',
);

const manifest = read('.release-please-manifest.json');
check(typeof manifest['.'] === 'string', '.release-please-manifest.json: clé "." manquante');

const rpCfg = read('release-please-config.json');
check(
  rpCfg.packages?.['.']?.['release-type'] === 'node',
  'release-please-config.json: release-type doit valoir "node"',
);

if (failures.length) {
  console.error('Workflows invalides :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Workflows valides.');
