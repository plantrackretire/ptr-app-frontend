import { ClearIcon } from '../../assets/ClearIcon';
import { Fragment, MouseEventHandler } from 'react';
import './ClearButton.css';

interface IClearButton {
  handleClearButtonClick: MouseEventHandler<HTMLButtonElement>,
  isClearAll?: boolean,
  lightColor?: boolean,
}

export const ClearButton: React.FC<IClearButton> = ({ handleClearButtonClick, isClearAll, lightColor }) => {
  return (
    <Fragment>
    { handleClearButtonClick ?
        <button className={'clear-button button-el' + (lightColor ? ' light' : '')} onClick={handleClearButtonClick}>
          <div>{isClearAll ? "clear all" : "clear"}</div>
          <div className="clear-button--icon svg-container">
            <ClearIcon title={isClearAll ? "Clear All" : "Clear"} />
          </div>
        </button>
      :
        <div className={'clear-button' + (lightColor ? ' light' : '')}>
          <div>{isClearAll ? "clear all" : "clear"}</div>
          <div className="clear-button--icon svg-container">
            <ClearIcon title={isClearAll ? "Clear All" : "Clear"} />
          </div>
        </div>
    }
    </Fragment>
  );
};
