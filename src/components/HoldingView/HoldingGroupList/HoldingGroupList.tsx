import './HoldingGroupList.css';
import { IHolding, IHoldingGroup } from '..';
import { Fragment } from 'react';
import { HoldingRec } from './HoldingRec';
import { AccountHolding } from './AccountHolding';


interface IHoldingGroupList {
  holdingGroups: IHoldingGroup[],
  handleHoldingActionButtonClick: () => void,
  accountHoldingSortFunction: (a: IHolding, b: IHolding) => number,
}

export const HoldingGroupList: React.FC<IHoldingGroupList> = ({ holdingGroups, handleHoldingActionButtonClick, accountHoldingSortFunction }) => {
  return (
    <table className="holding-group-list basic-table basic-table--clickable-rows" width="100%">
      <tbody>
        {
          holdingGroups.map((holdingGroup) => (
            <Fragment key={holdingGroup.holdingId}>
              <HoldingRec
                holding={holdingGroup}
                handleHoldingActionButtonClick={handleHoldingActionButtonClick}
              />
              {
                holdingGroup.holdings.length > 1 && 
                holdingGroup.holdings.sort(accountHoldingSortFunction).map((accountHolding) => (
                  <AccountHolding
                    key={accountHolding.accountId}
                    accountHolding={accountHolding}
                    handleHoldingActionButtonClick={handleHoldingActionButtonClick}
                  />
                ))
              }
            </Fragment>
          ))
        }
      </tbody>
    </table>
  );
};