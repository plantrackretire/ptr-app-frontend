import { TargetAADisplayTypes } from '../AssetAllocation';
import './ChartsOptions.css';


interface IChartsOptions {
  maxLevel: number | null,
  currentLevel: number,
  setLevel: (value: number) => void,
  displayTargetAssetClassAllocations: TargetAADisplayTypes,
  targetsSource: string,
}

export const ChartsOptions: React.FC<IChartsOptions> = ({ currentLevel, maxLevel, setLevel, targetsSource, displayTargetAssetClassAllocations }) => {
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
    case TargetAADisplayTypes.display: 
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
    case TargetAADisplayTypes.invalidFilter: 
      targetsSourceString =
        <div className="charts-options--scope">
          <span className="warning">
            Targets not available when filtering on accounts and/or assets
          </span>
        </div>
      break;
    case TargetAADisplayTypes.noTargetsForTag: 
      targetsSourceString =
        <div className="charts-options--scope">
          <span className="warning">
            No targets found for selected tag
          </span>
        </div>
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
      <div className="charts-options--levels">
        <span className="charts-options--label">
          Display Level:
        </span>
        <div className="charts-options--levels-options">
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
      { targetsSourceString }
      {/* { targetsSource !== null &&
        <div className="charts-options--scope">
          <span className="charts-options--label">
            Targets Shown For:
          </span>
          <span className="charts-options--value">
            {targetsSource}
          </span>
        </div>
      }
      { targetsSource === null &&
        <div className="charts-options--scope">
          <span className="warning">
            Targets not available when filtering on accounts and/or assets.
          </span>
        </div>
      } */}
    </div>
  );
};