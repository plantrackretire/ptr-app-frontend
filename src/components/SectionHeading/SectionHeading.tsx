import './SectionHeading.css';
import { ClearButton } from '../ClearButton';
import { ActionButton } from '../ActionButton';


export enum SectionHeadingSizeType {
  tiny,
  regular,
  small,
  medium,
  large,
};

interface ISectionHeading {
  label: string,
  subLabel?: string,
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
  let heading = <h4 className={"button-el" + activeClass}>{label}</h4>;
  let subHeading = <small className="section-heading--sub-heading">{subLabel}</small>;

  switch(size) {
    case SectionHeadingSizeType.tiny: heading = <small className={"button-el" + activeClass}>{label}</small>; break;
    case SectionHeadingSizeType.regular: heading = <span className={"button-el" + activeClass}>{label}</span>; break;
    case SectionHeadingSizeType.medium: heading = <h3 className={"button-el" + activeClass}>{label}</h3>; break;
    case SectionHeadingSizeType.large: heading = <h2 className={"button-el" + activeClass}>{label}</h2>; break;
  }
  const sizeClass = " section-heading--size-" + SectionHeadingSizeType[size];

  return (
    <div>
      <div className="section-heading">
        <button className="section-heading--main-heading button-el" onClick={handleActionButtonClick}>
          {heading}
          { 
            handleActionButtonClick && 
            <div className={"section-heading--action-button" + sizeClass + activeClass}>
              <ActionButton title={actionText} />
            </div>
          }
        </button>
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