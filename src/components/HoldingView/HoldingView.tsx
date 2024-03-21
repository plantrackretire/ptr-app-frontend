import { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import './HoldingView.css';
import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { DropdownListOptionsType } from '../DropdownList';
import { useState } from 'react';
import { SortSelector } from '../SortSelector';
import { IAggValueChange, calcAggChange, initAggChangeWithRecord, processAggChangeRecord } from '../../utils/calcs';
import { HoldingGroupList } from './HoldingGroupList';
import { compareDayValues } from '../../utils/dates';


interface IHoldingView {
  scope: string,
  holdings: IHolding[],
}

// Used to aggregate calculations to determine the aggregate gain/loss for a grouping
export interface IHoldingGroup extends IHolding {
  holdings: IHolding[],
  aggValueChange: IAggValueChange,
}

export interface IHolding {
  holdingId: string,
  securityId: string,
  shortName: string
  name: string,
  assetClass: string,
  accountId: string,
  accountName: string,
  balance: number,
  quantity: number,
  price: number,
  lastQuantityUpdateDate?: DayValue,
  lastPriceUpdateDate?: DayValue,
  ytdChangePercentage: number,
}

export const HoldingView: React.FC<IHoldingView> = ({ scope, holdings }) => {
  const [sortOrder, setSortOrder] = useState<DropdownListOptionsType>([holdingsSortOrderOptions[0]]);
  const [sortDirection, setSortDirection] = useState<string>("asc");

  const handleHoldingActionButtonClick = () => {
    console.log("HOLDING ACTION");
  }

  const holdingGroups = createHoldingGroups(holdings);

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
const createHoldingGroups = (holdings: IHolding[]): { [index: string]: IHoldingGroup } => {
  let gh: { [index: string]: IHoldingGroup } = {};
  const groupedHoldings = holdings.reduce((gh, item) => {
    if(!gh[item.name]) {
      gh[item.name] = {
        ...item,
        holdings: [item],
        aggValueChange: initAggChangeWithRecord(item.balance, item.ytdChangePercentage),
      }
    } else  {
      const rec = gh[item.name];
      rec.quantity += item.quantity;
      rec.balance += item.balance;
      rec.accountId = 'Multi';
      rec.accountName = 'Multi';
      if('lastPriceUpdateDate' in rec && !compareDayValues(rec.lastPriceUpdateDate, item.lastPriceUpdateDate))
        delete rec.lastPriceUpdateDate;
      if('lastQuantityUpdateDate' in rec && !compareDayValues(rec.lastQuantityUpdateDate, item.lastQuantityUpdateDate))
        delete rec.lastQuantityUpdateDate;
      processAggChangeRecord(rec.aggValueChange, item.balance, item.ytdChangePercentage);
      rec.holdings.push(item);
    }
    return gh;
  }, gh);
  Object.values(groupedHoldings).forEach(groupedHolding => {
    groupedHolding.ytdChangePercentage = 
      calcAggChange(groupedHolding.aggValueChange);
  });

  return groupedHoldings;
}


const sortFunctionSet: { [index: number]: { [index: string]: { [index: string]: (a: IHolding, b: IHolding) => number } } } = {
  1: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.name >= b.name ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName >= b.accountName ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.name <= b.name ? 1 : -1,
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
