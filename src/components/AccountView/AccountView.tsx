import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useState } from 'react';
import { AccountGroupList } from './AccountGroupList';
import { IHolding, IHoldingsFilter, HoldingsFilterTypes, holdingsFilterAll } from '../HoldingView';
import { AggregateValues } from '../../utils/calcs';
import { AccountViewPlaceholder } from './AccountViewPlaceholder';
import './AccountView.css';


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
}
export interface IAccountGroup {
  accountGroupCategory: IAccountGroupCategory,
  accounts: { [index: number]: IAccount },
  hasNonZeroAccounts: boolean,
}
export interface IAccountGroupCategoryValues {
  accountGroupCategoryId: number,
  accountGroupCategoryName: string,
  accountGroupCategoryFilterValue: number[],
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
}

export const AccountView: React.FC<IAccountView> = ({ title, startDate, asOfDate, accounts, holdings, getAccountGroupValues, accountGroupCategoryFilterType,
  holdingsFilters, setHoldingsFilters }) => {
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<string>("asc");

  if(holdings === null || accounts === null) {
    return <AccountViewPlaceholder />
  }
  if(holdings.length === 0) {
    return <h1>No data found, please adjust your filters.</h1>
  }

  const accountGroups = createAccountGroups(startDate, asOfDate, holdings, accounts, getAccountGroupValues);

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
  ): { [index: string]: IAccountGroup } => {
  let ag: { [index: string]: IAccountGroup } = {};
  let total = 0;

  const accountGroups = holdings.reduce((ag, holding) => {
    const holdingAccount = accounts[holding.accountId];

    const accountGroupValues: IAccountGroupCategoryValues = getAccountGroupValues(holding, holdingAccount);
    total += holding.balance;

    // Create new IAccountGroup (to hold category and related accounts) if it doesn't exist
    if(!ag[accountGroupValues.accountGroupCategoryId]) {
      ag[accountGroupValues.accountGroupCategoryId] = {
        accountGroupCategory: {
          ...accountGroupValues,
          aggValues: new AggregateValues(startDate, asOfDate),
        },
        accounts: {},
        hasNonZeroAccounts: false,
      }
    }

    const rec = ag[accountGroupValues.accountGroupCategoryId];
    // Update aggregates on account type category
    rec.accountGroupCategory.aggValues.addValues(holding.startDateValue ? holding.startDateValue : 0, holding.balance);

    // Process account
    // If account does not exist on account type category group then add it
    if(!rec.accounts[holdingAccount.accountId]) {
      const account = {...holdingAccount,
        aggValues: new AggregateValues(startDate, asOfDate),
        hasNonZeroHoldings: false,
      }
      rec.accounts[holdingAccount.accountId] = account;
    }
    const account = rec.accounts[holdingAccount.accountId];
    account.aggValues!.addValues(holding.startDateValue ? holding.startDateValue : 0, holding.balance);
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
};