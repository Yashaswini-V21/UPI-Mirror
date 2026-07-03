import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production you'd send to Sentry/Datadog here
    console.error('[Kira ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '100vh',
            background: '#03040a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '40px 24px',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {/* Kira logo mark */}
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800 }}>
            K
          </div>

          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '8px' }}>
              Kira hit an unexpected error. Your data is safe — this is a UI crash, not a data loss event.
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: 'rgba(239,68,68,0.8)',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '120px',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
