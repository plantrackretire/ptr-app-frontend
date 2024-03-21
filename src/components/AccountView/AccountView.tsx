import { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import './AccountView.css';
import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useState } from 'react';
import { AccountTypeCategoryList } from './AccountTypeCategoryList';
import { IHolding } from '../HoldingView';
import { IAggValueChange, calcAggChange, initAggChangeWithRecord, processAggChangeRecord } from '../../utils/calcs';
import { SortSelector } from '../SortSelector';
import { DropdownListOptionsType } from '../DropdownList';


interface IAccountView {
  asOfDate: DayValue,
  accounts: { [index: string]: IAccount },
  holdings: IHolding[],
  filterType: string,
  filterValue: string,
  setFilterType: (type: string) => void,
  setFilterValue: (value: string) => void,
}
export interface IAccountTypeCategoryGroup {
  accountTypeCategory: IAccountTypeCategory,
  accounts: { [index: string]: IAccount },
}
export interface IAccountTypeCategory {
  accountTypeCategoryId: string,
  accountTypeCategoryName: string,
  aggValueChange: IAggValueChange,
  balance: number,
  ytdChangePercentage: number,
}
export interface IAccount {
  accountId: string,
  accountTypeCategoryId: string,
  accountTypeCategoryName: string,
  accountTypeName: string,
  accountCustodian: string,
  accountName: string,
  aggValueChange?: IAggValueChange,
  balance?: number,
  ytdChangePercentage?: number,
}

export const AccountView: React.FC<IAccountView> = ({ asOfDate, accounts, holdings, 
  filterType, filterValue, setFilterType, setFilterValue }) => {
  const [sortOrder, setSortOrder] = useState<DropdownListOptionsType>([accountSortOrderOptions[0]]);
  const [sortDirection, setSortDirection] = useState<string>("asc");

  const accountTypeCategoryGroups = createAccountTypeCategoryGroups(holdings, accounts);
  
  const sortFunctionsFirstLevel = sortFunctionSetFirstLevel[sortOrder[0].value][sortDirection];
  const sortFunctionsSecondLevel = sortFunctionSetSecondLevel[sortOrder[0].value][sortDirection];
  const accountTypeCategoryGroupsSorted = Object.values(accountTypeCategoryGroups).sort(sortFunctionsFirstLevel);

  return (
    <div className='account-view'>
      <div className="sortable-section-heading">
        <SectionHeading
          size={SectionHeadingSizeType.medium} 
          label="Accounts"
          subLabel={ "As of " + asOfDate?.month.toString() + " / " + asOfDate?.day.toString() + " / " + asOfDate?.year.toString() } 
          handleActionButtonClick={() => { setFilterType("All"); setFilterValue("All"); }}
          isActive={filterType === "All" ? true : false}
        />
        <SortSelector
          sortOrderOptions={accountSortOrderOptions}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          setSortOrder={setSortOrder}
          setSortDirection={setSortDirection}
        />
      </div>
      <AccountTypeCategoryList
        accountTypeCategoryGroups={accountTypeCategoryGroupsSorted}
        accountSortFunction={sortFunctionsSecondLevel}
        filterType={filterType}
        filterValue={filterValue}
        setFilterType={setFilterType}
        setFilterValue={setFilterValue}
      />
    </div>
  );
};

const createAccountTypeCategoryGroups = (holdings: IHolding[], accounts: { [index: string]: IAccount }): { [index: string]: IAccountTypeCategoryGroup } => {
  let atcg: { [index: string]: IAccountTypeCategoryGroup } = {};
  const accountTypeCategoryGroups = holdings.reduce((atcg, holding) => {
    const holdingAccount = accounts[holding.accountId];
    
    // Process account type category, create new IAccountTypeCategoryGroup (to hold category and related accounts) if it doesn't exist
    // aggValueChange records hold two calculated aggregates to calc the aggregate gain/loss for each agg level (account and account type category)
    if(!atcg[holdingAccount.accountTypeCategoryId]) {
      atcg[holdingAccount.accountTypeCategoryId] = {
        accountTypeCategory: {
          accountTypeCategoryId: holdingAccount.accountTypeCategoryId,
          accountTypeCategoryName: holdingAccount.accountTypeCategoryName,
          aggValueChange: initAggChangeWithRecord(holding.balance, holding.ytdChangePercentage),
          balance: holding.balance,
          ytdChangePercentage: 0,
        },
        accounts: {},
      }
    } else  { // Account type category group exists, update category totals
      const rec = atcg[holdingAccount.accountTypeCategoryId];
      rec.accountTypeCategory.balance += holding.balance;
      processAggChangeRecord(rec.accountTypeCategory.aggValueChange, holding.balance, holding.ytdChangePercentage);
    }

    // Process account
    const accountTypeCategory = atcg[holdingAccount.accountTypeCategoryId];
    if(!accountTypeCategory.accounts[holdingAccount.accountId]) {
      const account = {...holdingAccount};
      account.balance = holding.balance;
      account.ytdChangePercentage = 0;
      account.aggValueChange = initAggChangeWithRecord(holding.balance, holding.ytdChangePercentage);
      accountTypeCategory.accounts[holdingAccount.accountId] = account;
    } else {
      const account = accountTypeCategory.accounts[holdingAccount.accountId];
      account.balance! += holding.balance;
      processAggChangeRecord(account.aggValueChange!, holding.balance, holding.ytdChangePercentage);
    }

    return atcg;
  }, atcg);

  // Loop through the account type categories, as well as the accounts within it, to calc aggregate gain/loss for each
  // Uses the agg values that were accumulated during the reduce function above
  Object.values(accountTypeCategoryGroups).forEach(accountTypeCategoryGroup => {
    accountTypeCategoryGroup.accountTypeCategory.ytdChangePercentage = calcAggChange(accountTypeCategoryGroup.accountTypeCategory.aggValueChange);
    Object.values(accountTypeCategoryGroup.accounts).forEach(account => {
      account.ytdChangePercentage = calcAggChange(account.aggValueChange!);
    });
  });

  return accountTypeCategoryGroups;
}

const sortFunctionSetFirstLevel: { [index: number]: { [index: string]: (a: IAccountTypeCategoryGroup, b: IAccountTypeCategoryGroup) => number } } = {
  1: 
    {
      'asc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
        a.accountTypeCategory.accountTypeCategoryName >= b.accountTypeCategory.accountTypeCategoryName ? 1 : -1,
      'desc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
        a.accountTypeCategory.accountTypeCategoryName <= b.accountTypeCategory.accountTypeCategoryName ? 1 : -1,
    },
  2: 
  {
    'asc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      a.accountTypeCategory.balance >= b.accountTypeCategory.balance ? 1 : -1,
    'desc': (a: IAccountTypeCategoryGroup,b: IAccountTypeCategoryGroup) => 
      a.accountTypeCategory.balance <= b.accountTypeCategory.balance ? 1 : -1,
  },
};

const sortFunctionSetSecondLevel: { [index: number]: { [index: string]: (a: IAccount, b: IAccount) => number } } = {
  1: 
    {
      'asc': (a: IAccount,b: IAccount) => a.accountName >= b.accountName ? 1 : -1,
      'desc': (a: IAccount,b: IAccount) => a.accountName <= b.accountName ? 1 : -1,
    },
  2: 
  {
    'asc': (a: IAccount,b: IAccount) => a.balance! >= b.balance! ? 1 : -1,
    'desc': (a: IAccount,b: IAccount) => a.balance! <= b.balance! ? 1 : -1,
  },
};


const accountSortOrderOptions = [
  { value: 1, label: "Name" },
  { value: 2, label: "Balance" },
];
