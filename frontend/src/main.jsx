import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0b0b0f', color: '#f8fafc',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>T CLOCK Resto Cafe</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 420, marginBottom: 20 }}>
            {this.state.error?.toString() || 'An unexpected error occurred while loading.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff',
              border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
