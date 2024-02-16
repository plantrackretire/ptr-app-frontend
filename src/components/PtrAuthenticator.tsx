import { ReactElement, createContext, useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import config from '../../../ptr-app-backend/cdk-outputs.json'
import { MouseEventHandler } from 'react';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.PtrAppAuthStack.PtrAppUserPoolId,
      userPoolClientId: config.PtrAppAuthStack.PtrAppUserPoolClientId,
    },
  }
});

export interface IPtrAuthenticatorContext {
  userid: string,
  username: string,
  email: string,
  family_name: string,
  given_name: string,
  signOut: MouseEventHandler<HTMLAnchorElement> | undefined
}
export const PtrAuthenticatorContext = createContext<IPtrAuthenticatorContext | null>(null);

interface PtrAuthenticatorProps {
  children: ReactElement
}

const PtrAuthenticator = ({children}: PtrAuthenticatorProps) => {
  const { user, signOut } = useAuthenticator((context) => [context.user]); // passed in function limits changes that cause re-render
  const [appUserAttributes, setAppUserAttributes] = useState({userid: '', username: '', email: '', family_name: '', given_name: '', signOut: signOut })
  
  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    if(appUserAttributes.username !== user.username) {
      console.log(appUserAttributes.username);
      console.log(user.username);
      const getUserAttributes = async() => {
        const attributes = await fetchUserAttributes();
        
        if(!ignoreResults) {
          setAppUserAttributes({
            userid: user.userId,
            username: user.username,
            email: attributes.email || '',
            family_name: attributes.family_name || '',
            given_name: attributes.given_name || '',
            signOut: signOut
          })
        }
      }

      getUserAttributes();
    }

    return () => { ignoreResults = true };
  }, [user.username])
  
  return (
    <PtrAuthenticatorContext.Provider value={appUserAttributes}>
      { appUserAttributes.userid ?
        <div>
          { children }
        </div>
      :
        <h1>Logging In...</h1>
      }
    </PtrAuthenticatorContext.Provider>
  );
};


const PtrAuthenticatorProvider = ({children}: PtrAuthenticatorProps) => {
  return (
    <Authenticator formFields={formFields} hideSignUp={false}>
      <PtrAuthenticator>
        { children }
      </PtrAuthenticator>
    </Authenticator>
  );
};

export default PtrAuthenticatorProvider;


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