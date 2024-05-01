import { ClearButton } from '../ClearButton';
import { ActionButton } from '../ActionButton';
import './SectionHeading.css';


export enum SectionHeadingSizeType {
  tiny,
  regular,
  small,
  medium,
  large,
};

interface ISectionHeading {
  label: string,
  subLabel?: string | JSX.Element,
  size: SectionHeadingSizeType,
  handleActionButtonClick?: () => void,
  handleClearButtonClick?: () => void,
  isClearAll?: boolean,
  actionText?: string,
  isActive?: boolean,
}

export const SectionHeading: React.FC<ISectionHeading> = ({ label, subLabel, size, handleActionButtonClick, handleClearButtonClick, 
  isClearAll, actionText, isActive }) => {
  const activeClass = isActive ? " active" : "";
  let heading = <h4 className={activeClass}>{label}</h4>;
  let subHeading = typeof(subLabel) === 'string' ? <small className="section-heading--sub-heading">{subLabel}</small> : subLabel;

  switch(size) {
    case SectionHeadingSizeType.tiny: heading = <small className={activeClass}>{label}</small>; break;
    case SectionHeadingSizeType.regular: heading = <span className={activeClass}>{label}</span>; break;
    case SectionHeadingSizeType.medium: heading = <h3 className={activeClass}>{label}</h3>; break;
    case SectionHeadingSizeType.large: heading = <h2 className={activeClass}>{label}</h2>; break;
  }
  const sizeClass = " section-heading--size-" + SectionHeadingSizeType[size];

  return (
    <div>
      <div className="section-heading">
        {
          handleActionButtonClick ?
            <button className="section-heading--main-heading button-el" onClick={handleActionButtonClick}>
              {heading}
              <div className={"section-heading--action-button" + sizeClass + activeClass}>
                <ActionButton title={actionText} />
              </div>
            </button>
          :
            <div className="section-heading--main-heading">
              {heading}
            </div>
        }
        { 
          handleClearButtonClick && 
          <div className={"section-heading--clear-button" + sizeClass + activeClass}>
            <ClearButton handleClearButtonClick={() => handleClearButtonClick()} isClearAll={isClearAll}/>
          </div>
        }
      </div>
      { subLabel ? subHeading : '' }
    </div>
  );
};