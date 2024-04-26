import { Fragment, MouseEventHandler } from 'react';
import { ActionIcon } from '../../assets/ActionIcon';
import './ActionButton.css';

interface IActionButton {
  handleActionButtonClick?: MouseEventHandler<HTMLButtonElement>,
  title: string | null | undefined,
}

export const ActionButton: React.FC<IActionButton> = ({ handleActionButtonClick, title }) => {
  return (
    <Fragment>
      { handleActionButtonClick ?
        <button className='action-button button-el svg-container' onClick={handleActionButtonClick}>
          <ActionIcon title={title ? title : ''} />
        </button>
      :
        <div className='action-button svg-container'>
          <ActionIcon title={title ? title : ''} />
        </div>
      }
    </Fragment>
  );
};
