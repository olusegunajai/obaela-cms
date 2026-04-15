import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/Confirm';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfirmProvider>
        <ToastProvider>
          <CurrencyProvider>
            <AuthProvider>
              <Router>
                <App />
              </Router>
            </AuthProvider>
          </CurrencyProvider>
        </ToastProvider>
      </ConfirmProvider>
    </ErrorBoundary>
  </StrictMode>,
);
