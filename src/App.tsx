import { ReactElement, createContext, useContext, useEffect, useState } from 'react';
// import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import LoadingOverlay from 'react-loading-overlay-ts';
// import LoadingSpinner from './LoadingSpinner';
import { useAuthenticator } from '@aws-amplify/ui-react'
import { fetchUserAttributes } from '@aws-amplify/auth';


const UserContext = createContext('');

const App = (props:any): ReactElement => {
  console.log("IN COMPONENT");
  const { user, signOut } = useAuthenticator((context) => [context.user]); // passed in function limits changes that cause re-render
  const [appUserAttributes, setAppUserAttributes] = useState({userid: '', username: '', email: '', family_name: '', given_name: '' })
  
  useEffect(() => {
    console.log("IN USE EFFECT")
    // This avoids race conditions by ensuring the async call is only made once.
    let setUserAttributes = true;

    if(appUserAttributes.username !== user.username) {
      const getUserAttributes = async() => {
        const attributes = await fetchUserAttributes();
        
        if(setUserAttributes) {
          setAppUserAttributes({
            userid: user.userId,
            username: user.username,
            email: attributes.email || '',
            family_name: attributes.family_name || '',
            given_name: attributes.given_name || '',
          })
        }
      }

      getUserAttributes();
      console.log("DONE WITH USE EFFECT")
    }

    return () => { setUserAttributes = false };
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  
  console.log("ABOUT TO RETURN JSX");
  return (
    <main>
      <h1>
        Welcome {appUserAttributes.given_name}
      </h1>
      <h2>
        Click <a href="." onClick={signOut}>here</a> to logout
      </h2>
    </main>
  );
  console.log("EXITING COMPONENT");
};

export default App;

/* <LoadingOverlay
active={isLoading}
spinner={<LoadingSpinner />}
>
<BrowserRouter>
    <Routes>
      <Route path='/' element={<Survey />}/>
    </Routes>
</BrowserRouter>
</LoadingOverlay> */

