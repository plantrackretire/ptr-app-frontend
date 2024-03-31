import './AccountTypeCategoryList.css';
import { Fragment } from 'react';
import { IAccount, IAccountTypeCategoryGroup } from '..';
import { AccountTypeCategoryHeading } from './AccountTypeCategoryHeading';
import { AccountRec } from '../AccountRec';


interface IAccountTypeCategoryList {
  accountTypeCategoryGroups: IAccountTypeCategoryGroup[],
  accountSortFunction: (a: IAccount, b: IAccount) => number,
  filterType: string,
  filterValue: string,
  setFilterType: (type: string) => void,
  setFilterValue: (value: string) => void,
}

export const AccountTypeCategoryList: React.FC<IAccountTypeCategoryList> = ({ accountTypeCategoryGroups, accountSortFunction, 
  filterValue, filterType, setFilterType, setFilterValue }) => {
  return (
    <table className="basic-table basic-table--clickable-rows">
      {
        accountTypeCategoryGroups.map((accountTypeCategoryGroup) => (
          <Fragment key={accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryName}>
            <AccountTypeCategoryHeading
              accountTypeCategory={accountTypeCategoryGroup.accountTypeCategory} 
              handleAccountTypeCategoryButtonClick={() => { 
                setFilterType("accountTypeCategory");
                setFilterValue(accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryName); 
              }}
              isActive={filterType === "accountTypeCategory" && 
                filterValue === accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryName}
            />
            <tbody>
            {
              Object.values(accountTypeCategoryGroup.accounts).sort(accountSortFunction).map((account) => (
                <AccountRec
                  key={account.accountId}
                  account={account}
                  handleAccountTypeCategoryButtonClick={() => { 
                    setFilterType("account");
                    setFilterValue(account.accountName); 
                  }}
                  isActive={filterType === "account" && filterValue === account.accountName}
                />
              ))
            }
            </tbody>
          </Fragment>
        ))
      }
    </table>
  );
};
