import './index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppAuthenticatorProvider } from './providers/AppAuthenticatorProvider';
import App from './App';
import { ConfigProvider } from './providers/ConfigProvider';
import { ModalContextProvider } from './providers/Modal';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModalContextProvider>
      <AppAuthenticatorProvider>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </AppAuthenticatorProvider>
    </ModalContextProvider>
  </React.StrictMode>
)
