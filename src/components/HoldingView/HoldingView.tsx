import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useState } from 'react';
import { AggregateValues } from '../../utils/calcs';
import { HoldingGroupList } from './HoldingGroupList';
import { compareDates } from '../../utils/dates';
import { HoldingViewPlaceholder } from './HoldingViewPlaceholder';
import './HoldingView.css';
import { ModalType, useModalContext } from '../../providers/Modal';
import { IFilterBarValues } from '../FilterBar';
import { TransactionView } from '../TransactionView';


interface IHoldingView {
  startDate: Date,
  asOfDate: Date,
  scope: string,
  holdings: IHolding[] | null,
  filterBarValues: IFilterBarValues,
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

export const HoldingView: React.FC<IHoldingView> = ({ startDate, asOfDate, scope, holdings, filterBarValues }) => {
  const [sortColumn, setSortColumn] = useState<string>("securityName");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  const modalContext = useModalContext();

  if(holdings === null) {
    return <HoldingViewPlaceholder />
  }
  if(holdings.length === 0) {
    return ""
  }

  const handleHoldingActionButtonClick = async(securityId: number, securityName: string, accountId?: number, accountName?: string) => {
    await modalContext.showConfirmation(
      ModalType.closable,
      <TransactionView
        securityId={securityId}
        securityName={securityName}
        accountId={accountId ? accountId : undefined}
        accountName={accountName ? accountName : undefined}
        filterBarValues={filterBarValues}
        freezeHeadings={true}
        maxHeight='80vh'
      />
    );
  }

  const holdingGroups = createHoldingGroups(startDate, asOfDate, holdings);

  const sortFunctions = sortFunctionSet[sortColumn][sortDirection];
  const holdingGroupsSorted = Object.values(holdingGroups).sort(sortFunctions['firstLevel']);
  const accountHoldingSortFunction = sortFunctions['secondLevel'];

  return (
    <div className='holding-view'>
      <SectionHeading
        size={SectionHeadingSizeType.medium} 
        label="Holdings"
        subLabel={scope} 
      />
      <HoldingGroupList
        holdingGroups={holdingGroupsSorted}
        handleHoldingActionButtonClick={handleHoldingActionButtonClick}
        accountHoldingSortFunction={accountHoldingSortFunction}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        setSortColumn={setSortColumn}
        setSortDirection={setSortDirection}
      />
    </div>
  );
};

// Group holdings by security, calculating aggregate numbers and a list of holdings per security
const createHoldingGroups = (startDate: Date, asOfDate: Date, holdings: IHolding[]): { [index: string]: IHoldingGroup } => {
  let gh: { [index: string]: IHoldingGroup } = {};
  const groupedHoldings = holdings.reduce((gh, item) => {
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


const sortFunctionSet: { [index: string]: { [index: string]: { [index: string]: (a: IHolding, b: IHolding) => number } } } = {
  securityShortName: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.securityShortName >= b.securityShortName ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName >= b.accountName ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.securityShortName <= b.securityShortName ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName <= b.accountName ? 1 : -1,
        },
  },
  securityName: 
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
  price: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.price >= b.price ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName >= b.accountName ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.price <= b.price ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.accountName <= b.accountName ? 1 : -1,
        },
    },
  quantity: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.quantity >= b.quantity ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.quantity >= b.quantity ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => a.quantity <= b.quantity ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => a.quantity <= b.quantity ? 1 : -1,
        },
    },
  balance: 
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