import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Limite d'erreur applicative. Remplace la limite par défaut (opaque) de React
 * Router : journalise l'erreur AVEC la pile de composants, et l'affiche à l'écran
 * en développement pour diagnostiquer précisément le composant fautif.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Pile de composants complète — c'est CE que la limite RR par défaut masque.
    console.error('[ErrorBoundary] Erreur capturée :', error);
    console.error('[ErrorBoundary] Pile de composants :', info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  render(): ReactNode {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          padding: '24px',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#410002',
          background: '#FFF8F7',
          minHeight: '100dvh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ fontFamily: 'sans-serif', color: '#BA1A1A' }}>Une erreur est survenue</h2>
        <p style={{ fontWeight: 700 }}>{error.message}</p>
        {import.meta.env.DEV && (
          <>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
            {componentStack && (
              <>
                <h3 style={{ fontFamily: 'sans-serif' }}>Pile de composants</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{componentStack}</pre>
              </>
            )}
          </>
        )}
      </div>
    );
  }
}
