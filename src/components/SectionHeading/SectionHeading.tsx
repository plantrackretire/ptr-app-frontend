import { ClearButton } from '../ClearButton';
import { ActionButton } from '../ActionButton';
import './SectionHeading.css';
import { InfoButton } from '../InfoButton';


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
  infoButtonContent?: JSX.Element,
  isClearAll?: boolean,
  actionText?: string,
  isActive?: boolean,
  lightColor?: boolean,
}

export const SectionHeading: React.FC<ISectionHeading> = ({ label, subLabel, size, handleActionButtonClick, handleClearButtonClick, infoButtonContent,
  isClearAll, actionText, isActive, lightColor }) => {
  const activeClass = isActive ? " active" : "";
  let heading = <h4 className={activeClass}>{label}</h4>;
  let subHeading = typeof(subLabel) === 'string' ? 
    <small className={"section-heading--sub-heading"  + (lightColor ? " section-heading-light" : "")}>{subLabel}</small> : subLabel;

  switch(size) {
    case SectionHeadingSizeType.tiny: heading = <small className={activeClass}>{label}</small>; break;
    case SectionHeadingSizeType.regular: heading = <span className={activeClass}>{label}</span>; break;
    case SectionHeadingSizeType.medium: heading = <h3 className={activeClass}>{label}</h3>; break;
    case SectionHeadingSizeType.large: heading = <h2 className={activeClass}>{label}</h2>; break;
  }
  const sizeClass = " section-heading--size-" + SectionHeadingSizeType[size];

  return (
    <div>
      <div className={"section-heading" + (lightColor ? " section-heading-light" : "")}>
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
          infoButtonContent && 
          <div className={"section-heading--info-button" + sizeClass}>
            <InfoButton content={infoButtonContent} lightColor={lightColor} />
          </div>
        }
        { 
          handleClearButtonClick && 
          <div className={"section-heading--clear-button" + sizeClass + activeClass}>
            <ClearButton handleClearButtonClick={() => handleClearButtonClick()} isClearAll={isClearAll} lightColor={lightColor ? true : false}/>
          </div>
        }
      </div>
      { subLabel ? subHeading : '' }
    </div>
  );
};