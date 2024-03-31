import './AppAuthenticatorProvider.css';
import { ReactElement, createContext, useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, Flex, Text, useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes, fetchAuthSession } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import config from '../../../../ptr-app-backend/cdk-outputs.json'
import { MouseEventHandler } from 'react';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.PtrAppAuthStack.PtrAppUserPoolId,
      userPoolClientId: config.PtrAppAuthStack.PtrAppUserPoolClientId,
    },
  }
});

interface IAuthenticatorContext {
  userid: string,
  username: string,
  email: string,
  family_name: string,
  given_name: string,
  jwtToken: string,
  signOutFunction: MouseEventHandler | undefined
}

export const AuthenticatorContext = createContext<IAuthenticatorContext | null>(null);

interface AuthenticatorProps {
  children: ReactElement
}

const AppAuthenticator = ({children}: AuthenticatorProps) => {
  const { user, signOut } = useAuthenticator((context) => [context.user]); // Passed in function limits changes that cause re-render
  const [appUserAttributes, setAppUserAttributes] = 
    useState({userid: '', username: '', email: '', family_name: '', given_name: '', jwtToken: '', signOutFunction: signOut })
  
  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    if(appUserAttributes.username !== user.username) {
      const getUserAttributes = async() => {
        const attributes = await fetchUserAttributes();

        const jwtToken = (await fetchAuthSession()).tokens?.idToken?.toString() as string;
      
        if(!ignoreResults) {
          setAppUserAttributes({
            userid: user.userId,
            username: user.username,
            email: attributes.email || '',
            family_name: attributes.family_name || '',
            given_name: attributes.given_name || '',
            jwtToken: jwtToken,
            signOutFunction: signOut
          })
        }
      }

      getUserAttributes();
    }

    return () => { ignoreResults = true };
  }, [user.username])
  
  return (
    <AuthenticatorContext.Provider value={appUserAttributes}>
      { appUserAttributes.userid ?
        <div>
          { children }
        </div>
      :
        <h1>Logging In...</h1>
      }
    </AuthenticatorContext.Provider>
  );
};

export const AppAuthenticatorProvider = ({children}: AuthenticatorProps) => {
  const components = {
    Header: () => { return header(undefined) },
    Footer: footer
  };  

  return (
    <Authenticator components={components} formFields={formFields} hideSignUp={false}>
      <AppAuthenticator>
        { children }
      </AppAuthenticator>
    </Authenticator>
  );
};

const header = (message: string | undefined) => {
  return ( 
    <div style={{ margin: "30px"}}>
    <Flex justifyContent="center">
      <h1 className="login-title">Finance App</h1>
    </Flex>
    { message &&
      <Flex justifyContent="center">
        <h3 className="login-message">{message}</h3>
      </Flex>
    }
    </div>
  );
}
const footer = () => {
  return (
    <Flex justifyContent="center" padding="10px">
      <Text>&copy; All Rights Reserved</Text>
    </Flex>
  );
}
  

const formFields = {
  signIn: {
    username: {
      order: 1,
      labelHidden: true,
      label: 'User Name:',
      placeholder: 'User Name',
      isRequired: true,
    },
    password: {
      order: 5,
      labelHidden: true,
      label: 'Password:',
      placeholder: 'Password',
      isRequired: true,
    },
  },
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