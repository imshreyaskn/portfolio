import React, { Component, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F0F1A',
          color: '#EBEBF0',
          padding: '2rem',
          textAlign: 'center',
          minHeight: '200px'
        }}>
          <h2 style={{ fontFamily: 'Italiana, serif', fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '1rem', color: '#7A7A8C', marginBottom: '2rem' }}>
            There was an error loading this section.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#EBEBF0',
              color: '#0F0F1A',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'Jost, sans-serif',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
