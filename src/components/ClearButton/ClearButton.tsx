import './ClearButton.css';
import { ClearIcon } from '../../assets/ClearIcon';
import { Fragment, MouseEventHandler } from 'react';

interface IClearButton {
  handleClearButtonClick: MouseEventHandler<HTMLButtonElement>,
  isClearAll?: boolean,
}

export const ClearButton: React.FC<IClearButton> = ({ handleClearButtonClick, isClearAll }) => {
  return (
    <Fragment>
    { handleClearButtonClick ?
        <button className='clear-button button-el' onClick={handleClearButtonClick}>
          <div>{isClearAll ? "clear all" : "clear"}</div>
          <div className="clear-button--icon svg-container">
            <ClearIcon title={isClearAll ? "Clear All" : "Clear"} />
          </div>
        </button>
      :
        <div className='clear-button'>
          <div>{isClearAll ? "clear all" : "clear"}</div>
          <div className="clear-button--icon svg-container">
            <ClearIcon title={isClearAll ? "Clear All" : "Clear"} />
          </div>
        </div>
    }
    </Fragment>
  );
};
