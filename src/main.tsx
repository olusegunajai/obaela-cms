import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/Confirm';
import { CurrencyProvider } from './contexts/CurrencyContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfirmProvider>
        <ToastProvider>
          <CurrencyProvider>
            <Router>
              <App />
            </Router>
          </CurrencyProvider>
        </ToastProvider>
      </ConfirmProvider>
    </ErrorBoundary>
  </StrictMode>,
);
