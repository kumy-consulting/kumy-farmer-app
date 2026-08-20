import '@testing-library/jest-dom/vitest';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// `main.tsx` fixe la locale au démarrage de l'app ; les tests ne le chargent pas
// et dayjs y repartait en anglais. Toute assertion sur une date écrite en toutes
// lettres échouait donc pour une raison qui n'a rien à voir avec le code testé.
dayjs.locale('fr');
