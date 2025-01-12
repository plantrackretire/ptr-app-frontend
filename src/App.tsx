import { ReactElement, useState } from 'react';
import { InvestmentReview } from './pages/InvestmentReview';
import { InvestmentActions } from './pages/InvestmentActions/InvestmentActions';
import { Header, PageType } from './components/Header';
import './App.css';


const App = (): ReactElement => {
  const [page, setPage] = useState<PageType>(PageType.investmentReview);
  
  return (
      <div className='page'>
        <div className='page--header'>
            <Header page={page} setPage={setPage} />
        </div>
        { page === PageType.investmentReview &&
          <InvestmentReview />
        }
        { page === PageType.investmentActions &&
          <InvestmentActions />
        }
    </div>
  );
};

export default App;


// import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import LoadingOverlay from 'react-loading-overlay-ts';
// import LoadingSpinner from './LoadingSpinner';

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

