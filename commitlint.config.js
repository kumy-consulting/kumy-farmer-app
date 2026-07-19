export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nouvelle fonctionnalité
        'fix', // Correction de bug
        'docs', // Documentation
        'style', // Formatage, point-virgules manquants, etc.
        'refactor', // Refactorisation du code
        'perf', // Amélioration des performances
        'test', // Ajout de tests
        'chore', // Tâches de maintenance
        'revert', // Annulation d'un commit précédent
        'build', // Changements du système de build
        'ci', // Changements de CI/CD
      ],
    ],
    'subject-case': [0], // Désactive la vérification de la casse du sujet
  },
};
