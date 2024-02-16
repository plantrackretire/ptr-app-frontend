import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css';
import PtrAuthenticatorProvider from './components/PtrAuthenticator';
import App from './components/App';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PtrAuthenticatorProvider>
      <App />
    </PtrAuthenticatorProvider>
  </React.StrictMode>,
)
