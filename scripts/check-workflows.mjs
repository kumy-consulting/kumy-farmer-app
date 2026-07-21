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

if (failures.length) {
  console.error('Workflows invalides :');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Workflows valides.');
