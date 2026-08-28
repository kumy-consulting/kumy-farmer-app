import { describe, expect, it } from 'vitest';

import { router } from './index';

describe('table de routage', () => {
  it('garde les bonnes pratiques hors de la coquille AppLayout', () => {
    // `AppLayout` court-circuite l'`Outlet` pour un compte sans domaine : il rend
    // l'écran d'attente à la place. Une route rangée parmi ses enfants serait
    // donc inatteignable pour ceux à qui celle-ci s'adresse d'abord.
    //
    // Ce test échouerait si quelqu'un « rangeait » la route avec les autres —
    // un geste raisonnable, dont la conséquence ne se voit qu'à l'exécution, sur
    // un compte neuf.
    const racines = router.routes.filter((route) => route.path === '/bonnes-pratiques');
    expect(racines).toHaveLength(1);

    const enfantsDeLaCoquille = router.routes.flatMap((route) => route.children ?? []).map((route) => route.path);
    expect(enfantsDeLaCoquille).not.toContain('/bonnes-pratiques');
  });
});
