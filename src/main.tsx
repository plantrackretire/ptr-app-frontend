import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css';
import { AppAuthenticatorProvider } from './providers/AppAuthenticatorProvider';
import App from './App';
import { ConfigProvider } from './providers/ConfigProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppAuthenticatorProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </AppAuthenticatorProvider>
  </React.StrictMode>,
)
