import React from 'react';
import AppRouter from './routes/AppRouter';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Replace with your error reporting service (Sentry, Datadog, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '1rem',
            fontFamily: 'sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', maxWidth: '480px' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.href = '/';
            }}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Go home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AuthInit() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthInit />
      <AppRouter />
    </ErrorBoundary>
  );
}