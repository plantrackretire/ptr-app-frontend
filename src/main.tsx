import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css';
import { AppAuthenticatorProvider } from './providers/AppAuthenticatorProvider';
import App from './App';
import { ConfigProvider } from './providers/ConfigProvider';
import { ModalContextProvider } from './providers/Modal';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppAuthenticatorProvider>
      <ConfigProvider>
        <ModalContextProvider>
          <App />
        </ModalContextProvider>
      </ConfigProvider>
    </AppAuthenticatorProvider>
  </React.StrictMode>
)
