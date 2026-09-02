import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            backgroundColor: '#181818',
            border: '1px solid #282828',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#1DB954', marginTop: 0, fontSize: '1.75rem' }}>
              Algo salió mal
            </h2>
            <p style={{ color: '#B3B3B3', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Ocurrió un error inesperado al renderizar la aplicación. Puedes intentar recargar la página para continuar.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: '#121212',
                color: '#ff6b6b',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                overflowX: 'auto',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                backgroundColor: '#1DB954',
                color: '#0A0A0A',
                fontWeight: '700',
                border: 'none',
                borderRadius: '500px',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, transform 0.1s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1ed760')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1DB954')}
            >
              Reintentar
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
