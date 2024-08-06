import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useEffect, useState } from 'react';
import { AggregateValues, getReturn, isNumber } from '../../utils/calcs';
import { HoldingGroupList } from './HoldingGroupList';
import { compareDates } from '../../utils/dates';
import { HoldingViewPlaceholder } from './HoldingViewPlaceholder';
import { ModalType, useModalContext } from '../../providers/Modal';
import { IFilterBarValues } from '../FilterBar';
import { TransactionView } from '../TransactionView';
import { IAccount } from '../AccountView';
import { IReturn } from '../../pages/Investments/Performance';
import './HoldingView.css';


export interface IHoldingViewColumns {
  price?: boolean,
  quantity?: boolean,
  balance?: boolean,
  ytdChangeUnderBalance?: boolean,
  ytdReturn?: boolean,
  costBasis?: boolean,
  unrealizedGain?: boolean,
}
interface IHoldingView {
  columns: IHoldingViewColumns;
  startDate: Date,
  asOfDate: Date,
  filters: IHoldingsFilter[],
  holdings: IHolding[] | null,
  accounts: {[index: number]: IAccount} | null,
  filterBarValues: IFilterBarValues,
  handleZeroFilterResults?: () => void, // If included, function is called when filtering results in zero records
  includeSubRows?: boolean,
  returns?: { [index: string]: { [index: string]: IReturn } } | null, // Required if ytdChange being included.
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
  costBasis: number | null,
  lastQuantityUpdateDate?: Date,
  lastPriceUpdateDate?: Date,
  startDatePositionDate?: Date,
  startDateValue?: number,
  changeInValue?: number,
  overrideAssetClassId?: number,
  returnValue?: number | string | null,
}

export enum HoldingsFilterTypes {
  all = "all",
  accountTypeCategory = "accountTypeCategory",
  assetClass = "assetClass",
  account = "account",
};
export interface IHoldingsFilter {
  type: HoldingsFilterTypes,
  id: number,
  label: string,
  filterValue: number[],
}
export const holdingsFilterAll: IHoldingsFilter = {
  type: HoldingsFilterTypes.all,
  id: 0, 
  label: "All",
  filterValue: [0],
}
// At least one pair is required.
export interface IHandleHoldingActionButtonClick {
  securityId?: number, securityName?: string, accountId?: number, accountName?: string,
  accountTypeCategoryId?: number, accountTypeCategoryName?: string,
  assetClassIdList?: number[], assetClassName?: string,
};

export const HoldingView: React.FC<IHoldingView> = ({ columns, startDate, asOfDate, filters, holdings, accounts, filterBarValues, handleZeroFilterResults, includeSubRows, returns }) => {
  const [sortColumn, setSortColumn] = useState<string>("securityName");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  const modalContext = useModalContext();

  let filteredHoldings: IHolding[] = [];
  if(holdings !== null && accounts !== null) {
    filteredHoldings = filterHoldingsViewHoldings(holdings, accounts, filters);
  }

  useEffect(() => {
    // If filtering results in zero records but there are holdings then call this function to allow caller to take action.
    if(handleZeroFilterResults && filteredHoldings.length === 0 && (holdings && holdings.length > 0)) {
      handleZeroFilterResults();
    }  
  }, [holdings, accounts, filters]);

  if(holdings === null || accounts === null) {
    return <HoldingViewPlaceholder />
  }
  if(filteredHoldings.length === 0) {
    return <h1>No data found, please adjust your filters.</h1>
  }

  const handleHoldingActionButtonClick = async({securityId, securityName, accountId, accountName, 
    accountTypeCategoryId, accountTypeCategoryName, assetClassIdList, assetClassName}: IHandleHoldingActionButtonClick) => {
    await modalContext.showModal(
      ModalType.closable,
      <TransactionView
        securityId={securityId}
        securityName={securityName}
        accountId={accountId ? accountId : undefined}
        accountName={accountName ? accountName : undefined}
        accountTypeCategoryId={accountTypeCategoryId ? accountTypeCategoryId : undefined}
        accountTypeCategoryName={accountTypeCategoryName ? accountTypeCategoryName : undefined}
        assetClassIdList={assetClassIdList ? assetClassIdList : undefined}
        assetClassName={assetClassName ? assetClassName : undefined}
        filterBarValues={filterBarValues}
        freezeHeadings={true}
        maxHeight='80vh'
      />
    );
  }

  const includeReturns = ('ytdReturn' in columns && columns.ytdReturn) ? true : false;

  const holdingGroups = createHoldingGroups(startDate, asOfDate, filteredHoldings, includeReturns, includeReturns ? returns! : null);

  const sortFunctions = sortFunctionSet[sortColumn][sortDirection];
  const holdingGroupsSorted = Object.values(holdingGroups).sort(sortFunctions['firstLevel']);
  const accountHoldingSortFunction = sortFunctions['secondLevel'];

  const includeSubRowsFinal = includeSubRows ? includeSubRows : false;

  // If more than one filter concatenates all non-account labels and appends ' in ' <account> on the end if there is an account filter.
  let filterScope = '';
  let accountFilter: IHoldingsFilter | null = null;
  filters.forEach((filter) => {
    if(filter.type === HoldingsFilterTypes.account) {
      accountFilter = filter;
    } else {
      filterScope += (filterScope.length ? ', ' : '') + filter.label;
    }
  });
  
  let accountTypeCategoryId: number | null = null; let accountTypeCategoryName: string | null = null;
  let assetClassIdList: number[] | null = null; let assetClassName: string | null = null;
  if(accountFilter) {
    filterScope = (filterScope.length > 0 ? filterScope + ' in ' : '') + accountFilter['label'];

    // Look for asset class and account type category filters for clicking 'Holdings' heading.
    // 'Holdings' heading only available to click when an account is selected, but handling both in case that changes in the future.
    const accountTypeCategoryFilter = filters.find(el => el.type === HoldingsFilterTypes.accountTypeCategory);
    if(accountTypeCategoryFilter) {
      accountTypeCategoryId = accountTypeCategoryFilter.filterValue[0];
      accountTypeCategoryName = accountTypeCategoryFilter.label;
    }
    const assetClassFilter = filters.find(el => el.type === HoldingsFilterTypes.assetClass);
    if(assetClassFilter) {
      assetClassIdList = assetClassFilter.filterValue;
      assetClassName = assetClassFilter.label;
    }
  } else {
    filterScope = filterScope + " Accounts";
  }

  return (
    <div className='holding-view'>
      <SectionHeading
        size={SectionHeadingSizeType.medium} 
        label="Holdings"
        subLabel={filterScope} 
        handleActionButtonClick={ accountFilter ? 
          () => handleHoldingActionButtonClick({
            securityId: 0, 
            securityName: '', 
            accountId: accountFilter!.id, 
            accountName: accountFilter!.label,
            accountTypeCategoryId: accountTypeCategoryId ? accountTypeCategoryId : undefined,
            accountTypeCategoryName: accountTypeCategoryName ? accountTypeCategoryName : undefined,
            assetClassIdList: assetClassIdList ? assetClassIdList : undefined,
            assetClassName: assetClassName ? assetClassName : undefined,
          }) :
            async() => await modalContext.showModal(
              ModalType.confirm,
              'Please select an individual account to view all transactions.',
          )
        }
      />
      <HoldingGroupList
        holdingGroups={holdingGroupsSorted}
        columns={columns}
        includeSubRows={includeSubRowsFinal}
        filters={filters}
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
const createHoldingGroups = (startDate: Date, asOfDate: Date, holdings: IHolding[], includeReturns: boolean, 
  returns: { [index: string]: { [index: string]: IReturn } } | null): { [index: string]: IHoldingGroup } => {
  let gh: { [index: string]: IHoldingGroup } = {};
  const groupedHoldings = holdings.reduce((gh, item) => {
    if(!gh[item.securityId]) {
      gh[item.securityId] = {
        ...item,
        holdings: [item],
        aggValues: new AggregateValues(startDate, asOfDate),
        hasNonZeroHoldings: item.quantity != 0,
      }
      if(gh[item.securityId].costBasis === null) gh[item.securityId].costBasis = 0;
      gh[item.securityId].aggValues.addValues(item.startDateValue || 0, item.balance, item.costBasis ? item.costBasis : 0);
      if(includeReturns) {
        // Set return to null if returns are null (denotes a placeholder should be displayed).
        const ytdReturn = returns === null ? null : getReturn(returns ? returns.assets : {}, item.securityId);
        gh[item.securityId].returnValue = ytdReturn;
      }
    } else  {
      const rec = gh[item.securityId];
      rec.quantity += item.quantity;
      rec.balance += item.balance;
      rec.costBasis! += item.costBasis ? item.costBasis : 0;
      rec.accountId = 0;
      rec.accountName = 'Multi';
      if('lastPriceUpdateDate' in rec && compareDates(rec.lastPriceUpdateDate!, item.lastPriceUpdateDate!))
        delete rec.lastPriceUpdateDate;
      if('lastQuantityUpdateDate' in rec && compareDates(rec.lastQuantityUpdateDate!, item.lastQuantityUpdateDate!))
        delete rec.lastQuantityUpdateDate;
      rec.aggValues.addValues(item.startDateValue || 0, item.balance, item.costBasis ? item.costBasis : 0);
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

export const filterHoldingsViewHoldings = (holdings: IHolding[], accounts: {[index: number]: IAccount}, filters: IHoldingsFilter[]): IHolding[] => {
  let filteredHoldings: IHolding[] = [];

  if(filters.length === 1 && filters[0].type === HoldingsFilterTypes.all) {
    return holdings;
  }
  
  filteredHoldings = holdings.filter((record) => 
      applyFilterToRecord(record, accounts ? accounts : {}, filters)
  );

  return filteredHoldings;
}

const applyFilterToRecord = (record: IHolding, accounts: {[index: number]: IAccount}, filters: IHoldingsFilter[]) => {
  let validRec = true;
  let index = 0;

  while(validRec && index < filters.length) {
    const filter = filters[index];

    switch(filter.type) {
      case HoldingsFilterTypes.accountTypeCategory:
        if(!filter.filterValue.includes(accounts[record.accountId].accountTypeCategoryId)) {
          validRec = false;
        };
        break;
      case HoldingsFilterTypes.assetClass:
        if(!filter.filterValue.includes(record.assetClassId)) {
          validRec = false;
        };
        break;
      case HoldingsFilterTypes.account:
        if(!filter.filterValue.includes(record.accountId)) {
          validRec = false;
        };
        break;
      case HoldingsFilterTypes.all:
          return true;
      default:
          // TODO: Throw exception
          console.log("INVALID filterType in applyFilterToRecord for Holdings");
          break;
    }

    index++;
  }

  return validRec;
};

// Returns total start value, total end value, and change in value.
export const calcHoldingsTotals = (holdings: IHolding[], includeUniqueAssetClasses: boolean): 
  { startTotal: number, endTotal: number, changeInValue: number | null, uniqueAssetClasses?: number } => {
  let totalStart = 0;
  let totalEnd = 0;
  const uniqueAssetClasses: { [index: number]: number } = {};

  holdings.forEach(holding => {
    totalStart += holding.startDateValue ? holding.startDateValue : 0;
    totalEnd += holding.balance ? holding.balance : 0;
    if(includeUniqueAssetClasses && !(holding.assetClassId in uniqueAssetClasses)) {
      uniqueAssetClasses[holding.assetClassId] = holding.assetClassId;
    }
  });

  let changeInValue: number | null = null;
  if(totalStart !== 0) {
    changeInValue = (totalEnd - totalStart) / totalStart
  }
  if(includeUniqueAssetClasses) {
    return {
      startTotal: totalStart, 
      endTotal: totalEnd, 
      changeInValue: changeInValue,
      uniqueAssetClasses: Object.values(uniqueAssetClasses).length,
    };
  } else {
    return {
      startTotal: totalStart, 
      endTotal: totalEnd, 
      changeInValue: changeInValue,
    };
  }
};


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
  ytdReturn: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => {
            const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
            const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
            return aReturnValue! >= bReturnValue! ? 1 : -1
          },
          'secondLevel': (a: IHolding,b: IHolding) => {
            const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
            const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
            return aReturnValue! >= bReturnValue! ? 1 : -1
          },
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => {
            const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
            const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
            return aReturnValue! <= bReturnValue! ? 1 : -1
          },
          'secondLevel': (a: IHolding,b: IHolding) => {
            const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
            const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
            return aReturnValue! <= bReturnValue! ? 1 : -1
          },
        },
    },
  costBasis: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => ('costBasis' in a && a.costBasis ? a.costBasis : 0) >= ('costBasis' in b && b.costBasis ? b.costBasis : 0) ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => ('costBasis' in a && a.costBasis ? a.costBasis : 0) >= ('costBasis' in b && b.costBasis ? b.costBasis : 0) ? 1 : -1,
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => ('costBasis' in a && a.costBasis ? a.costBasis : 0) <= ('costBasis' in b && b.costBasis ? b.costBasis : 0) ? 1 : -1,
          'secondLevel': (a: IHolding,b: IHolding) => ('costBasis' in a && a.costBasis ? a.costBasis : 0) <= ('costBasis' in b && b.costBasis ? b.costBasis : 0) ? 1 : -1,
        },
    },
  unrealized: 
    {
      'asc': 
        {
          'firstLevel': (a: IHolding,b: IHolding) => {
            const aUnrealized = a.balance - (('costBasis' in a && a.costBasis ? a.costBasis : 0));
            const bUnrealized = b.balance - (('costBasis' in b && b.costBasis ? b.costBasis : 0));
            return aUnrealized >= bUnrealized ? 1 : -1
          },
          'secondLevel': (a: IHolding,b: IHolding) => {
            const aUnrealized = a.balance - (('costBasis' in a && a.costBasis ? a.costBasis : 0));
            const bUnrealized = b.balance - (('costBasis' in b && b.costBasis ? b.costBasis : 0));
            return aUnrealized >= bUnrealized ? 1 : -1
          },
        },
      'desc':
        {
          'firstLevel': (a: IHolding,b: IHolding) => {
            const aUnrealized = a.balance - (('costBasis' in a && a.costBasis ? a.costBasis : 0));
            const bUnrealized = b.balance - (('costBasis' in b && b.costBasis ? b.costBasis : 0));
            return aUnrealized <= bUnrealized ? 1 : -1
          },
          'secondLevel': (a: IHolding,b: IHolding) => {
            const aUnrealized = a.balance - (('costBasis' in a && a.costBasis ? a.costBasis : 0));
            const bUnrealized = b.balance - (('costBasis' in b && b.costBasis ? b.costBasis : 0));
            return aUnrealized <= bUnrealized ? 1 : -1
          },
        },
    },
};
