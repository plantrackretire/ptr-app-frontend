import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useState } from 'react';
import { AccountTypeCategoryList } from './AccountTypeCategoryList';
import { IHolding } from '../HoldingView';
import { AggregateValues } from '../../utils/calcs';
import { SortSelector } from '../SortSelector';
import { DropdownListOptionsType } from '../DropdownList';
import { AccountViewPlaceholder } from './AccountViewPlaceholder';
import './AccountView.css';


interface IAccountView {
  startDate: Date,
  asOfDate: Date,
  accounts: { [index: number]: IAccount } | null,
  holdings: IHolding[] | null,
  filterType: string,
  filterValue: string,
  setFilterType: (type: string) => void,
  setFilterValue: (value: string) => void,
}
export interface IAccountTypeCategoryGroup {
  accountTypeCategory: IAccountTypeCategory,
  accounts: { [index: number]: IAccount },
  hasNonZeroAccounts: boolean,
}
export interface IAccountTypeCategory {
  accountTypeCategoryName: string,
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

export const AccountView: React.FC<IAccountView> = ({ startDate, asOfDate, accounts, holdings,
  filterType, filterValue, setFilterType, setFilterValue }) => {
    const [sortColumn, setSortColumn] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<string>("asc");

  if(holdings === null || accounts === null) {
    return <AccountViewPlaceholder />
  }
  if(holdings.length === 0) {
    return ""
  }

  const accountTypeCategoryGroups = createAccountTypeCategoryGroups(startDate, asOfDate, holdings, accounts);

  const sortFunctionsFirstLevel = sortFunctionSetFirstLevel[sortColumn][sortDirection];
  const sortFunctionsSecondLevel = sortFunctionSetSecondLevel[sortColumn][sortDirection];
  const accountTypeCategoryGroupsSorted = Object.values(accountTypeCategoryGroups).sort(sortFunctionsFirstLevel);

  return (
    <div className='account-view'>
      <div className="sortable-section-heading">
        <SectionHeading
          size={SectionHeadingSizeType.medium} 
          label="Accounts"
          subLabel={ "As of " + (asOfDate?.getMonth()+1) + " / " + asOfDate?.getDate() + " / " + asOfDate?.getFullYear() } 
          handleActionButtonClick={() => { setFilterType("All"); setFilterValue("All"); }}
          isActive={filterType === "All" ? true : false}
        />
      </div>
      <AccountTypeCategoryList
        accountTypeCategoryGroups={accountTypeCategoryGroupsSorted}
        accountSortFunction={sortFunctionsSecondLevel}
        filterType={filterType}
        filterValue={filterValue}
        setFilterType={setFilterType}
        setFilterValue={setFilterValue}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        setSortColumn={setSortColumn}
        setSortDirection={setSortDirection}
      />
    </div>
  );
};

const createAccountTypeCategoryGroups = (startDate: Date, asOfDate: Date, 
  holdings: IHolding[], accounts: { [index: string]: IAccount }): { [index: string]: IAccountTypeCategoryGroup } => {
  let atcg: { [index: string]: IAccountTypeCategoryGroup } = {};
  const accountTypeCategoryGroups = holdings.reduce((atcg, holding) => {
    const holdingAccount = accounts[holding.accountId];

    // Create new IAccountTypeCategoryGroup (to hold category and related accounts) if it doesn't exist
    if(!atcg[holdingAccount.accountTypeCategoryName]) {
      atcg[holdingAccount.accountTypeCategoryName] = {
        accountTypeCategory: {
          accountTypeCategoryName: holdingAccount.accountTypeCategoryName,
          aggValues: new AggregateValues(startDate, asOfDate),
        },
        accounts: {},
        hasNonZeroAccounts: false,
      }
    }

    const rec = atcg[holdingAccount.accountTypeCategoryName];
    // Update aggregates on account type category
    rec.accountTypeCategory.aggValues.addValues(holding.startDateValue ? holding.startDateValue : 0, holding.balance);

    // Process account
    // If account does not exist on account type category group
    if(!rec.accounts[holdingAccount.accountId]) {
      const account = {...holdingAccount,
        changeInValue: 0,
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

    return atcg;
  }, atcg);

  return accountTypeCategoryGroups;
}

const sortFunctionSetFirstLevel: { [index: string]: { [index: string]: (a: IAccountTypeCategoryGroup, b: IAccountTypeCategoryGroup) => number } } = {
  'name': 
    {
      'asc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
        a.accountTypeCategory.accountTypeCategoryName >= b.accountTypeCategory.accountTypeCategoryName ? 1 : -1,
      'desc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
        a.accountTypeCategory.accountTypeCategoryName <= b.accountTypeCategory.accountTypeCategoryName ? 1 : -1,
    },
  'change': 
  {
    'asc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      (a.accountTypeCategory.aggValues.calcChangeInValuePercentage() || 0) >= (b.accountTypeCategory.aggValues.calcChangeInValuePercentage() || 0) ? 1 : -1,
    'desc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      (a.accountTypeCategory.aggValues.calcChangeInValuePercentage() || 0) <= (b.accountTypeCategory.aggValues.calcChangeInValuePercentage() || 0) ? 1 : -1,
  },
  'balance': 
  {
    'asc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      a.accountTypeCategory.aggValues.getAggregateEndValue() >= b.accountTypeCategory.aggValues.getAggregateEndValue() ? 1 : -1,
    'desc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      a.accountTypeCategory.aggValues.getAggregateEndValue() <= b.accountTypeCategory.aggValues.getAggregateEndValue() ? 1 : -1,
  },
};

const sortFunctionSetSecondLevel: { [index: string]: { [index: string]: (a: IAccount, b: IAccount) => number } } = {
  'name': 
    {
      'asc': (a: IAccount,b: IAccount) => a.accountName >= b.accountName ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => a.accountName <= b.accountName ? 1 : -1,
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


const accountSortOrderOptions = [
  { value: 1, label: "Name" },
  { value: 2, label: "Balance" },
];
