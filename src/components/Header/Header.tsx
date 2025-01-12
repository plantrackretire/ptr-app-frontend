import { useContext } from 'react';
import { UserIcon } from '../../assets/UserIcon';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { ModalType, useModalContext } from '../../providers/Modal';
import { INavItem, Navlist } from '../Navlist';
import './Header.css';


export enum PageType {
  investmentReview,
  investmentActions,
};

interface IHeader {
  page: PageType,
  setPage: (value: any) => void,
}

export const Header: React.FC<IHeader> = ({ page, setPage }) => {
  const appUserAttributes = useContext(AuthenticatorContext);
  const modalContext = useModalContext();

  const handleUserIconClicked = async () => {
    const result = await modalContext.showModal(
      ModalType.confirmWithCancel,
      'Are you sure you want to sign out?',
    );

    if(result.status) {
      appUserAttributes!.signOutFunction!();
    }
  }

  const handlePageClicked = (page: PageType) => setPage(page);

  const pageItems: INavItem[] = appUserAttributes?.givenName === "Peter" ? 
    [
      {
        label: "Investment Review",
        value: PageType.investmentReview,
        title: 'Investment Review',
      },
      {
        label: "Investment Actions",
        value: PageType.investmentActions,
        title: 'Investment Actions',
      },
    ] :
    [
      {
        label: "Investment Review",
        value: PageType.investmentReview,
        title: 'Investment Review',
      },
    ];

  // Set current page to active in page list
  pageItems.forEach(navItem => (navItem.value === page) ? navItem.isActive = true : navItem.isActive = false);
  
  return (
    <div className='header'>
      <div className='header--nav'>
          <h1>My Finance App</h1>
          <Navlist
            navItems={pageItems}
            setCurrentNavItem={handlePageClicked}
            iconWidth="1em" 
            displayHorizontal={true}
          />
      </div>
      <div className='header--user'>
        <button className="button-el svg-container" onClick={handleUserIconClicked}>
          <UserIcon title='Sign Out' />
        </button>
      </div>
    </div>
  );
};  
