import { AaDisplayTypes, TargetAaDisplayReasons } from '../AssetAllocation';
import './ChartsOptions.css';


interface IChartsOptions {
  maxLevel: number | null,
  currentLevel: number,
  setLevel: (value: number) => void,
  aaDisplay: AaDisplayTypes,
  setAaDisplay: (value: AaDisplayTypes) => void,
  displayTargetAssetClassAllocations: TargetAaDisplayReasons,
  targetsSource: string,
}

export const ChartsOptions: React.FC<IChartsOptions> = ({ currentLevel, maxLevel, setLevel, aaDisplay, setAaDisplay, targetsSource, displayTargetAssetClassAllocations }) => {
  if(maxLevel === null) {
    return (
      <div className='charts--options'>
        <div className="placeholder placeholder-heading2"><br /></div>
      </div>
    );
  }

  const levels = Array.from({ length: maxLevel+1 }, (_v, i) => i+1);

  let targetsSourceString;
  switch(displayTargetAssetClassAllocations) {
    case TargetAaDisplayReasons.display: 
      targetsSourceString = 
        <div className="charts-options--scope">
          <span className="charts-options--label">
            Targets Shown For:
          </span>
          <span className="charts-options--value">
            {targetsSource}
          </span>
        </div>
      break;
    case TargetAaDisplayReasons.invalidFilter: 
      targetsSourceString =
        <div className="charts-options--scope">
          <span className="warning">
            Targets not available when filtering on accounts and/or assets
          </span>
        </div>
      break;
    case TargetAaDisplayReasons.noTargetsForTag: 
      targetsSourceString =
        <div className="charts-options--scope">
          <span className="warning">
            No targets found for selected tag
          </span>
        </div>
      break;
    case TargetAaDisplayReasons.doNotDisplay: 
      targetsSourceString =
        <div className="charts-options--scope"><br /></div>
      break;
    default: 
      targetsSourceString =
        <div className="charts-options--scope">
          <span className="warning">
            No targets found for portfolio
          </span>
        </div>
      break;
}

  return (
    <div className="charts-options">
      <div className="charts-options--options">
        <div className="charts-options--options--options-set">
          <span className="charts-options--options--options-set--label">
            Display Type:
          </span>
          <div className="charts-options--options--options-set--options">
            <button className={(aaDisplay === AaDisplayTypes.actualsOnly) ? " button-el active" : " button-el"} 
              onClick={() => setAaDisplay(AaDisplayTypes.actualsOnly)} title={"Show actual asset classes only"}
            >
              Actuals
            </button>
            <button className={(aaDisplay === AaDisplayTypes.targetsOnly) ? " button-el active" : " button-el"} 
              onClick={() => setAaDisplay(AaDisplayTypes.targetsOnly)} title={"Show target asset classes only"}
            >
              Targets
            </button>
            <button className={(aaDisplay === AaDisplayTypes.actualsVsTargets) ? " button-el active" : " button-el"} 
              onClick={() => setAaDisplay(AaDisplayTypes.actualsVsTargets)} title={"Show actual vs target asset classes"}
            >
              Actuals vs Targets
            </button>
          </div>
        </div>
        { maxLevel > 0 &&
          <div className="charts-options--options--options-set">
            <span className="charts-options--options--options-set--label">
              Display Level:
            </span>
            <div className="charts-options--options--options-set--options">
              { levels.map(level => (
                <button 
                  key={level}
                  className={((level-1 === currentLevel) || ((level-1 === maxLevel) && (currentLevel === -1))) ? " button-el active" : " button-el"} 
                  onClick={() => setLevel((level-1 === maxLevel ? -1 : level-1))} title={"Show level " + level + " asset classes"}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        }
      </div>
      { targetsSourceString }
    </div>
  );
};