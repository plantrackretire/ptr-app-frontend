import { AaDisplayTypes } from '../../AssetAllocation';
import { TargetAaDisplayReasons } from '..';
import './ChartsOptions.css';
import { InfoButton } from '../../../../../components/InfoButton';


interface IChartsOptions {
  maxLevel: number | null,
  currentLevel: number,
  setLevel: (value: number) => void,
  aaDisplay: AaDisplayTypes,
  setAaDisplay: (value: AaDisplayTypes) => void,
  displayTargets: boolean,
  displayTargetsReason: TargetAaDisplayReasons,
  targetsSource: string,
}

export const ChartsOptions: React.FC<IChartsOptions> = ({ currentLevel, maxLevel, setLevel, aaDisplay, setAaDisplay, displayTargets, displayTargetsReason, targetsSource }) => {
  if(maxLevel === null) {
    return (
      <div className='charts--options'>
        <div className="placeholder placeholder-heading2"><br /></div>
      </div>
    );
  }

  const levels = Array.from({ length: maxLevel+1 }, (_v, i) => i+1);

  let targetsSourceString;
  if(displayTargets) {
    targetsSourceString = 
    <div className="charts-options--scope">
      <span className="charts-options--options--options-set--label">
        <span>Targets Shown For</span>
        <InfoButton content={targetsShownForInfo} />
        <span>:</span>
      </span>
      <span className="charts-options--value">
        {targetsSource}
      </span>
    </div>;
  } else {
    switch(displayTargetsReason) {
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
      case TargetAaDisplayReasons.okToDisplay: // It is ok to display but not currently displaying (that is why we fell into the switch statement). 
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
  }

  return (
    <div className="charts-options">
      <div className="charts-options--options">
        { (displayTargetsReason === TargetAaDisplayReasons.okToDisplay) &&
          <div className="charts-options--options--options-set">
            <span className="charts-options--options--options-set--label">
              <span>Display Type</span>
              <InfoButton content={displayTypeInfo} />
              <span>:</span>
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
        }
        { maxLevel > 0 &&
          <div className="charts-options--options--options-set">
            <span className="charts-options--options--options-set--label">
              <span>Display Level</span>
              <InfoButton content={displaLevelInfo} />
              <span>:</span>
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

const displayTypeInfo = 
<div className="info-button--info">
  <h2>Display Type</h2>
  <div>The "Display Type" lets you choose how to organize and view your allocations. It helps you decide whether to focus on actual allocations, target allocations, or compare both:</div>
  <ul>
    <li className="info-button--info-indent"><strong>Actuals: </strong>Shows only how your investments are currently allocated, ignoring target allocations. This is useful if you want to see the real details of where your money is invested.</li>
    <li className="info-button--info-indent"><strong>Targets: </strong>Shows only your target allocations, ignoring actual ones. This is helpful when you want to see your goals without the added detail of your current investments.</li>
    <li className="info-button--info-indent"><strong>Actuals vs Targets (default): </strong>Compares your actual allocations to your target allocations. If your actual investments are more specific (e.g., in Equities: Small Cap: Value) than your target (e.g., Equities: Small Cap), the actual allocation will be grouped under the target to make comparison easier. If the actual allocation is broader than the target, it will be displayed separately from the target. This makes it easier to spot differences between your actual and target allocations.</li>
  </ul>
</div>;

const displaLevelInfo = 
<div className="info-button--info">
  <h2>Display Level</h2>
  <div>The "Display Level" controls how detailed you want to see your asset classes. It lets you zoom in or out on your allocations:</div>
  <ul>
    <li className="info-button--info-indent"><strong>Level 1: </strong>Shows the broadest categories, like Equities.</li>
    <li className="info-button--info-indent"><strong>Level 2: </strong>Adds more detail, like Equities: Large Cap.</li>
    <li className="info-button--info-indent"><strong>Level 3 and beyond: </strong>Shows even more specific categories (e.g., Equities: Large Cap: Growth).</li>
  </ul>
  <div><br /></div>
  <div>Each asset class has a color that matches the pie charts, so you can easily compare them.</div>
  <div><br /></div>
  <div><strong>Keep in mind</strong>, there’s a limit on how many asset classes can be shown in the pie charts. Anything beyond that limit will be grouped under 'Other' and have the same color in the table.</div>
  <div><br /></div>
  <div>If an asset class is more detailed than the Display Level you choose, it will be "rolled up" to match the selected level. For example, if you have an allocation in Equities: Large Cap: Growth but you’re viewing at Level 2, it will be grouped under Equities: Large Cap.</div>
  <div>If an asset class is less detailed than the Display Level, it stays as is. So if you’re at Level 3 and have an allocation in Equities: Large Cap, it will still show up as Equities: Large Cap.</div>
</div>;

const targetsShownForInfo = 
<div className="info-button--info">
  <h2>Targets Shown For</h2>
  <div>The "Target Shown For" explains where your target allocations are coming from—either for the entire portfolio or for a specific Tag selected in the Filter Bar.</div>
  <ul>
    <li className="info-button--info-indent">If no Tag is selected, targets are based on the entire portfolio.</li>
    <li className="info-button--info-indent">If a Tag is selected, targets are based on that Tag.</li>
  </ul>
  <div><br /></div>
  <div>Keep in mind that if you apply any other filters (besides dates), target allocations won’t be shown, since targets can only be defined for Tags, not for other types of filters.</div>
</div>;
