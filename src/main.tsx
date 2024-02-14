import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from '../../ptr-app-backend/cdk-outputs.json'
import './index.css';
import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.PtrAppAuthStack.PtrAppUserPoolId,
      userPoolClientId: config.PtrAppAuthStack.PtrAppUserPoolClientId,
    },
  }
});

const formFields = {
  signUp: {
    username: {
      order: 1,
      labelHidden: true,
      label: 'User Name:',
      placeholder: 'User Name',
      isRequired: true,
    },
    email: {
      order: 2,
      labelHidden: true,
      label: 'Email Address:',
      placeholder: 'Email Address',
      isRequired: true,
    },
    given_name: {
      order: 3,
      labelHidden: true,
      label: 'First Name:',
      placeholder: 'First Name',
      isRequired: true,
    },
    family_name: {
      order: 4,
      labelHidden: true,
      label: 'Last Name:',
      placeholder: 'Last Name',
      isRequired: true,
    },
    password: {
      order: 5,
      labelHidden: true,
      label: 'Password:',
      placeholder: 'Password',
      isRequired: true,
    },
    confirm_password: {
      order: 6,
      labelHidden: true,
      label: 'Confirm Password:',
      placeholder: 'Confirm Password',
      isRequired: true,
    },
  },
};    

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator formFields={formFields} hideSignUp={false}>
      {({ signOut, user }) => (
        <App />
      )}
    </Authenticator>
  </React.StrictMode>,
)
