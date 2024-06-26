import { useContext } from 'react';
import { UserIcon } from '../../assets/UserIcon';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { ModalType, useModalContext } from '../../providers/Modal';
import './Header.css';


export const Header: React.FC = () => {
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

  return (
    <div className='header'>
      <div className='header--logo'>
          <h1>My Finance App</h1>
      </div>
      <div className='header--nav'>
        <button className="button-el svg-container" onClick={handleUserIconClicked}>
          <UserIcon title='Sign Out' />
        </button>
      </div>
    </div>
  );
};  