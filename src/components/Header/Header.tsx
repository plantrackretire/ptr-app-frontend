import { useContext } from 'react';
import './Header.css';
import { UserIcon } from '../../assets/UserIcon';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';


export const Header: React.FC = () => {
  const appUserAttributes = useContext(AuthenticatorContext);

  return (
    <div className='header'>
      <div className='header--logo'>
          <h1>My Finance App</h1>
      </div>
      <div className='header--nav'>
        <button className="button-el svg-container" onClick={appUserAttributes?.signOutFunction}>
          <UserIcon title='Sign Out' />
        </button>
      </div>
    </div>
  );
};  