import { type FunctionComponent, type ReactNode } from 'react';

import { useViewportHeight } from '@/shared/hooks/useViewportHeight';

import { OnboardingContent, OnboardingPage } from './onboarding.styled';
import { KeyboardContext, useKeyboardOpen } from './onboardingKeyboard';

interface OnboardingLayoutProps {
  children: ReactNode;
  /**
   * Indice externe « clavier ouvert », combiné (OR) avec la détection
   * `visualViewport`. Utile quand un champ auto-focus ouvre le clavier et que
   * le viewport iOS ne le voit pas toujours (ex. saisie PIN) : passer le focus
   * de l'input garantit le repli du medallion.
   */
  keyboardOpen?: boolean;
}

/**
 * Enveloppe commune des écrans onboarding/auth. Lie la hauteur du conteneur au
 * `visualViewport` : à l'ouverture du clavier, la page se recale dans la bande
 * visible et le contenu (centré + scrollable) reste au-dessus du clavier — le
 * CTA n'est plus masqué. Expose l'état clavier via `useKeyboardOpen()`.
 */
export const OnboardingLayout: FunctionComponent<OnboardingLayoutProps> = ({
  children,
  keyboardOpen: keyboardHint = false,
}) => {
  const { height, isOpen } = useViewportHeight();
  const keyboardOpen = isOpen || keyboardHint;

  return (
    <KeyboardContext.Provider value={keyboardOpen}>
      <OnboardingPage style={height ? { height: `${height}px`, minHeight: `${height}px` } : undefined}>
        <OnboardingContent style={keyboardOpen ? { paddingTop: 24, paddingBottom: 20 } : undefined}>
          {children}
        </OnboardingContent>
      </OnboardingPage>
    </KeyboardContext.Provider>
  );
};

/**
 * Masque ses enfants quand le clavier est ouvert (ex. le medallion), pour
 * dégager de la place et garder le champ + le CTA visibles sur petits écrans.
 */
export const CollapseOnKeyboard: FunctionComponent<{ children: ReactNode }> = ({ children }) => {
  const keyboardOpen = useKeyboardOpen();
  return keyboardOpen ? null : <>{children}</>;
};
