import './HoldingView.css';
import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { DropdownListOptionsType } from '../DropdownList';
import { useState } from 'react';
import { SortSelector } from '../SortSelector';
import { AggregateValues } from '../../utils/calcs';
import { HoldingGroupList } from './HoldingGroupList';
import { compareDates } from '../../utils/dates';


interface IHoldingView {
  startDate: Date,
  asOfDate: Date,
  scope: string,
  holdings: IHolding[],
}

// Used to aggregate calculations to determine the aggregate gain/loss for a grouping
export interface IHoldingGroup extends IHolding {
  holdings: IHolding[],
  aggValues: AggregateValues, // Used to track start and end balance and calc change in value
  hasNonZeroHoldings: boolean,
}

export interface IHolding {
  holdingId: number,
  securityId: number,
  securityShortName: string
  securityName: string,
  assetClassId: number,
  fullAssetClass: string,
  accountId: number,
  accountName: string,
  holdingDate: Date,
  balance: number,
  quantity: number,
  price: number,
  lastQuantityUpdateDate?: Date,
  lastPriceUpdateDate?: Date,
  startDatePositionDate?: Date,
  startDateValue?: number,
  changeInValue?: number,
}

export const HoldingView: React.FC<IHoldingView> = ({ startDate, asOfDate, scope, holdings }) => {
  const [sortOrder, setSortOrder] = useState<DropdownListOptionsType>([holdingsSortOrderOptions[0]]);
  const [sortDirection, setSortDirection] = useState<string>("asc");

  const handleHoldingActionButtonClick = () => {
    alert("Show transactions for holding.");
  }

  const holdingGroups = createHoldingGroups(startDate, asOfDate, holdings);

  const sortFunctions = sortFunctionSet[sortOrder[0].value][sortDirection];
  const holdingGroupsSorted = Object.values(holdingGroups).sort(sortFunctions['firstLevel']);
  const accountHoldingSortFunction = sortFunctions['secondLevel'];

  return (
    <div className='holding-view'>
      <div className="sortable-section-heading">
        <SectionHeading
          size={SectionHeadingSizeType.medium} 
          label="Holdings"
          subLabel={scope} 
        />
        <SortSelector
          sortOrderOptions={holdingsSortOrderOptions}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          setSortOrder={setSortOrder}
          setSortDirection={setSortDirection}
        />
      </div>
      <HoldingGroupList
        holdingGroups={holdingGroupsSorted}
        handleHoldingActionButtonClick={handleHoldingActionButtonClick}
        accountHoldingSortFunction={accountHoldingSortFunction}
      />
    </div>
  );
};

// Group holdings by security, calculating aggregate numbers and a list of holdings per security
const createHoldingGroups = (startDate: Date, asOfDate: Date, holdings: IHolding[]): { [index: string]: IHoldingGroup } => {
  let gh: { [index: string]: IHoldingGroup } = {};
  const groupedHoldings = holdings.reduce((gh, item) => {
    if(item.securityName === "Brookside LXV") {
      console.log(item);
    }
    if(!gh[item.securityId]) {
      gh[item.securityId] = {
        ...item,
        holdings: [item],
        aggValues: new AggregateValues(startDate, asOfDate),
        hasNonZeroHoldings: item.quantity != 0,
      }
      gh[item.securityId].aggValues.addValues(item.startDateValue || 0, item.balance);
    } else  {
      const rec = gh[item.securityId];
      rec.quantity += item.quantity;
      rec.balance += item.balance;
      rec.accountId = 0;
      rec.accountName = 'Multi';
      if('lastPriceUpdateDate' in rec && compareDates(rec.lastPriceUpdateDate!, item.lastPriceUpdateDate!))
        delete rec.lastPriceUpdateDate;
      if('lastQuantityUpdateDate' in rec && compareDates(rec.lastQuantityUpdateDate!, item.lastQuantityUpdateDate!))
        delete rec.lastQuantityUpdateDate;
      rec.aggValues.addValues(item.startDateValue || 0, item.balance);
      if(!rec.hasNonZeroHoldings && item.quantity != 0)
        rec.hasNonZeroHoldings = true;
      rec.holdings.push(item);
    }
    return gh;
  }, gh);
  // Update each grouped holding so the IHolding record has a changeInValue
  Object.values(groupedHoldings).forEach(groupedHolding => {
    const changeResult = groupedHolding.aggValues.calcChangeInValuePercentage();
    groupedHolding.changeInValue = changeResult === null ? 0 : changeResult;
  });

  return groupedHoldings;
}


const sortFunctionSet: { [index: number]: { [index: string]: { [index: string]: (a: IHolding, b: IHolding) => number } } } = {
  1: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.securityName >= b.securityName ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName >= b.accountName ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.securityName <= b.securityName ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName <= b.accountName ? 1 : -1,
        },
  },
  2: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.balance >= b.balance ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.balance >= b.balance ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.balance <= b.balance ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.balance <= b.balance ? 1 : -1,
        },
    },
};

const holdingsSortOrderOptions = [
  { value: 1, label: "Name" },
  { value: 2, label: "Balance" },
];
