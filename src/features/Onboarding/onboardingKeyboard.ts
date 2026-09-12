import { createContext, useContext } from 'react';

/** Contexte : vrai quand le clavier virtuel est ouvert (alimenté par OnboardingLayout). */
export const KeyboardContext = createContext(false);

/** Vrai quand le clavier virtuel masque une partie de l'écran. */
export const useKeyboardOpen = (): boolean => useContext(KeyboardContext);
