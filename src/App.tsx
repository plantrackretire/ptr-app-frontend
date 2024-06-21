import { ReactElement } from 'react';
// import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import LoadingOverlay from 'react-loading-overlay-ts';
// import LoadingSpinner from './LoadingSpinner';
import { Investments } from './pages/Investments';

const App = (): ReactElement => {
  return (
    <Investments />
  );
};

export default App;



// const appUserAttributes = useContext(PtrAuthenticatorContext);

/* <Fragment>
<h1>
  Welcome {appUserAttributes!.given_name}
</h1>
<h2>
  Click <a href="." onClick={appUserAttributes?.signOut}>here</a> to logout
</h2>
</Fragment> */

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

