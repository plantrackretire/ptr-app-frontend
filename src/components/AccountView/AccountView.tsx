import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useState } from 'react';
import { AccountGroupList } from './AccountGroupList';
import { IHolding, IHoldingsFilter, HoldingsFilterTypes, holdingsFilterAll } from '../HoldingView';
import { AggregateValues, getReturn, isNumber } from '../../utils/calcs';
import { AccountViewPlaceholder } from './AccountViewPlaceholder';
import { IReturn } from '../../pages/Investments/Performance';
import './AccountView.css';


export interface IAccountViewColumns {
  allocationPercentage?: boolean,
  value?: boolean,
  ytdChange?: boolean,
  ytdReturn?: boolean,
  costBasis?: boolean,
  unrealizedGain?: boolean,
}
interface IAccountView {
  title: string,
  startDate: Date,
  asOfDate: Date,
  accounts: { [index: number]: IAccount } | null,
  holdings: IHolding[] | null,
  getAccountGroupValues: (holding: IHolding, account: IAccount) => IAccountGroupCategoryValues, // Caller must implement to provide accoung group id, name, and filter values
  accountGroupCategoryFilterType: HoldingsFilterTypes, // Type of filter to apply when an account group category is clicked
  holdingsFilters: IHoldingsFilter[],
  setHoldingsFilters: (filters: IHoldingsFilter[]) => void,
  columns: IAccountViewColumns,
  returns?: { [index: string]: { [index: string]: IReturn } } | null, // Required if ytdChange being included.
}
export interface IAccountGroup {
  accountGroupCategory: IAccountGroupCategory,
  accounts: { [index: number]: IAccount },
  hasNonZeroAccounts: boolean,
}
export interface IAccountGroupCategoryValues {
  accountGroupCategoryType: string,
  accountGroupCategoryId: number,
  accountGroupCategoryName: string,
  accountGroupCategoryFilterValue: number[],
  returnValue?: number | string | null,
}
export interface IAccountGroupCategory extends IAccountGroupCategoryValues {
  aggValues: AggregateValues, // Used to track start and end agg balances and to calc change in value
}
export interface IAccount {
  accountId: number,
  accountTypeCategoryId: number,
  accountTypeCategoryName: string,
  accountTypeId: number,
  accountTypeName: string,
  accountCustodian: string,
  accountName: string,
  aggValues?: AggregateValues, // Used to track start and end agg balances and to calc change in value
  hasNonZeroHoldings?: boolean,
  returnValue?: number | string | null,
}

export const AccountView: React.FC<IAccountView> = ({ title, startDate, asOfDate, accounts, holdings, getAccountGroupValues, accountGroupCategoryFilterType,
  holdingsFilters, setHoldingsFilters, columns, returns}) => {
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<string>("asc");

  if(holdings === null || accounts === null) {
    return <AccountViewPlaceholder />
  }
  if(holdings.length === 0) {
    return <h1>No data found, please adjust your filters.</h1>
  }

  const includeReturns = ('ytdReturn' in columns && columns.ytdReturn) ? true : false;
  const accountGroups = createAccountGroups(startDate, asOfDate, holdings, accounts, getAccountGroupValues, includeReturns, includeReturns ? returns! : null);

  const sortFunctionsFirstLevel = sortFunctionSetFirstLevel[sortColumn][sortDirection];
  const sortFunctionsSecondLevel = sortFunctionSetSecondLevel[sortColumn][sortDirection];
  const accountGroupsSorted = Object.values(accountGroups).sort(sortFunctionsFirstLevel);

  return (
    <div className='account-view'>
      <SectionHeading
        size={SectionHeadingSizeType.medium} 
        label={title}
        subLabel={ "As of " + (asOfDate?.getMonth()+1) + " / " + asOfDate?.getDate() + " / " + asOfDate?.getFullYear() } 
        handleActionButtonClick={() => setHoldingsFilters([holdingsFilterAll]) }
        isActive={holdingsFilters[0].type === HoldingsFilterTypes.all ? true : false}
      />
      <AccountGroupList
        accountGroups={accountGroupsSorted}
        columns={columns}
        accountSortFunction={sortFunctionsSecondLevel}
        accountGroupCategoryFilterType={accountGroupCategoryFilterType}
        holdingsFilters={holdingsFilters}
        setHoldingsFilters={setHoldingsFilters}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        setSortColumn={setSortColumn}
        setSortDirection={setSortDirection}
      />
    </div>
  );
};

const createAccountGroups = (startDate: Date, asOfDate: Date, 
    holdings: IHolding[], accounts: { [index: string]: IAccount },
    getAccountGroupValues: (holding: IHolding, account: IAccount) => IAccountGroupCategoryValues,
    includeReturns: boolean, returns: { [index: string]: { [index: string]: IReturn } } | null
  ): { [index: string]: IAccountGroup } => {
  let ag: { [index: string]: IAccountGroup } = {};
  let total = 0;

  const accountGroups = holdings.reduce((ag, holding) => {
    const holdingAccount = accounts[holding.accountId];

    const accountGroupValues: IAccountGroupCategoryValues = getAccountGroupValues(holding, holdingAccount);
    total += holding.balance;

    // Create new IAccountGroup (to hold category and related accounts) if it doesn't exist
    if(!ag[accountGroupValues.accountGroupCategoryId]) {
      const newAg: IAccountGroup = {
        accountGroupCategory: {
          ...accountGroupValues,
          aggValues: new AggregateValues(startDate, asOfDate),
        },
        accounts: {},
        hasNonZeroAccounts: false,
      }
      if(includeReturns) {
        // Set return to null if returns are null (denotes a placeholder should be displayed).
        const ytdReturn = returns === null ? null : getReturn(returns ? returns.accountTypeCategories : {}, accountGroupValues.accountGroupCategoryId);
        newAg.accountGroupCategory.returnValue = ytdReturn;
      }
      ag[accountGroupValues.accountGroupCategoryId] = newAg;
    }

    const rec = ag[accountGroupValues.accountGroupCategoryId];
    // Update aggregates on category
    rec.accountGroupCategory.aggValues.addValues(holding.startDateValue ? holding.startDateValue : 0, holding.balance, holding.costBasis ? holding.costBasis : 0);

    // Process account
    // If account does not exist on category group then add it
    if(!rec.accounts[holdingAccount.accountId]) {
      const account: IAccount = {...holdingAccount,
        aggValues: new AggregateValues(startDate, asOfDate),
        hasNonZeroHoldings: false,
      }
      if(includeReturns) {
        // Set return to null if returns are null (denotes a placeholder should be displayed).
        const ytdReturn = returns === null ? null : getReturn(returns ? returns.accounts : {}, account.accountId);
        account.returnValue = ytdReturn;
      }
      rec.accounts[holdingAccount.accountId] = account;
    }
    const account = rec.accounts[holdingAccount.accountId];
    account.aggValues!.addValues(holding.startDateValue ? holding.startDateValue : 0, holding.balance, holding.costBasis ? holding.costBasis : 0);
    if(!account.hasNonZeroHoldings && holding.quantity != 0) {
      account.hasNonZeroHoldings = true;
      if(!rec.hasNonZeroAccounts)
        rec.hasNonZeroAccounts = true;
    }

    return ag;
  }, ag);

  // Loop through groupings and pass in total value to calcuate the percentage of the total each group represents.
  Object.values(accountGroups).forEach(rec => rec.accountGroupCategory.aggValues.setPercentageOfTotal(total));

  return accountGroups;
}

const sortFunctionSetFirstLevel: { [index: string]: { [index: string]: (a: IAccountGroup, b: IAccountGroup) => number } } = {
  'name': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.accountGroupCategoryName >= b.accountGroupCategory.accountGroupCategoryName ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.accountGroupCategoryName <= b.accountGroupCategory.accountGroupCategoryName ? 1 : -1,
    },
  'alloc': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        (a.accountGroupCategory.aggValues.getPercentageOfTotal() || 0) >= (b.accountGroupCategory.aggValues.getPercentageOfTotal() || 0) ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        (a.accountGroupCategory.aggValues.getPercentageOfTotal() || 0) <= (b.accountGroupCategory.aggValues.getPercentageOfTotal() || 0) ? 1 : -1,
    },
  'change': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        (a.accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0) >= (b.accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0) ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        (a.accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0) <= (b.accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0) ? 1 : -1,
    },
  'balance': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.getAggregateEndValue() >= b.accountGroupCategory.aggValues.getAggregateEndValue() ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.getAggregateEndValue() <= b.accountGroupCategory.aggValues.getAggregateEndValue() ? 1 : -1,
    },
  'ytdReturn': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => {
        const aReturnValue = 'returnValue' in a.accountGroupCategory && isNumber(a.accountGroupCategory.returnValue) ? a.accountGroupCategory.returnValue : 0;
        const bReturnValue = 'returnValue' in b.accountGroupCategory && isNumber(b.accountGroupCategory.returnValue) ? b.accountGroupCategory.returnValue : 0;
        return aReturnValue! >= bReturnValue! ? 1 : -1
      },
      'desc': (a: IAccountGroup,b: IAccountGroup) => {
        const aReturnValue = 'returnValue' in a.accountGroupCategory && isNumber(a.accountGroupCategory.returnValue) ? a.accountGroupCategory.returnValue : 0;
        const bReturnValue = 'returnValue' in b.accountGroupCategory && isNumber(b.accountGroupCategory.returnValue) ? b.accountGroupCategory.returnValue : 0;
        return aReturnValue! <= bReturnValue! ? 1 : -1
      },
    },
  'costBasis': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.getAggregateEndCostBasis() >= b.accountGroupCategory.aggValues.getAggregateEndCostBasis() ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.getAggregateEndCostBasis() <= b.accountGroupCategory.aggValues.getAggregateEndCostBasis() ? 1 : -1,
    },
  'unrealized': 
    {
      'asc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.calcUnrealizedGainLoss() >= b.accountGroupCategory.aggValues.calcUnrealizedGainLoss() ? 1 : -1,
      'desc': (a: IAccountGroup,b: IAccountGroup) => 
        a.accountGroupCategory.aggValues.calcUnrealizedGainLoss() <= b.accountGroupCategory.aggValues.calcUnrealizedGainLoss() ? 1 : -1,
    },
};

const sortFunctionSetSecondLevel: { [index: string]: { [index: string]: (a: IAccount, b: IAccount) => number } } = {
  'name': 
    {
      'asc': (a: IAccount,b: IAccount) => a.accountName >= b.accountName ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => a.accountName <= b.accountName ? 1 : -1,
    },
  'alloc': 
    {
      'asc': (a: IAccount,b: IAccount) => (a.accountName || 0) >= (b.accountName || 0) ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => (a.accountName || 0) <= (b.accountName || 0) ? 1 : -1,
    },
  'change': 
    {
      'asc': (a: IAccount,b: IAccount) => (a.aggValues!.calcChangeInValuePercentage() || 0) >= (b.aggValues!.calcChangeInValuePercentage() || 0) ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => (a.aggValues!.calcChangeInValuePercentage() || 0) <= (b.aggValues!.calcChangeInValuePercentage() || 0) ? 1 : -1,
    },
  'balance': 
    {
      'asc': (a: IAccount,b: IAccount) => a.aggValues!.getAggregateEndValue()! >= b.aggValues!.getAggregateEndValue()! ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => a.aggValues!.getAggregateEndValue()! <= b.aggValues!.getAggregateEndValue()! ? 1 : -1,
    },
  'ytdReturn': 
    {
      'asc': (a: IAccount,b: IAccount) => {
        const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
        const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
        return aReturnValue! >= bReturnValue! ? 1 : -1
      },
      'desc': (a: IAccount,b: IAccount) => {
        const aReturnValue = 'returnValue' in a && isNumber(a.returnValue) ? a.returnValue : 0;
        const bReturnValue = 'returnValue' in b && isNumber(b.returnValue) ? b.returnValue : 0;
        return aReturnValue! <= bReturnValue! ? 1 : -1
      },
    },
  'costBasis': 
    {
      'asc': (a: IAccount,b: IAccount) => 
        a.aggValues!.getAggregateEndCostBasis() >= b.aggValues!.getAggregateEndCostBasis() ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => 
        a.aggValues!.getAggregateEndCostBasis() <= b.aggValues!.getAggregateEndCostBasis() ? 1 : -1,
    },
  'unrealized': 
    {
      'asc': (a: IAccount,b: IAccount) => 
        a.aggValues!.calcUnrealizedGainLoss() >= b.aggValues!.calcUnrealizedGainLoss() ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => 
        a.aggValues!.calcUnrealizedGainLoss() <= b.aggValues!.calcUnrealizedGainLoss() ? 1 : -1,
    },
};