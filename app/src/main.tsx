import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mysten/dapp-kit/dist/index.css';
import './styles/theme.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { networkConfig } from './networkConfig.ts';
import { NETWORK } from './lib/config.ts';
import { walletTheme } from './components/brand/walletTheme.ts';
import { ToastProvider } from './components/layout/Toasts.tsx';

const queryClient = new QueryClient();

// Silence noise from unrelated injected browser-extension providers (e.g. EVM wallets).
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('ethereum') || args[0].includes('WELLDONE'))) {
    return;
  }
  originalError(...args);
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
          <WalletProvider autoConnect theme={walletTheme}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
