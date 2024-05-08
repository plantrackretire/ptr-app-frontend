import { Fragment } from 'react';
import { IAccount, IAccountTypeCategoryGroup } from '..';
import { AccountTypeCategoryHeading } from './AccountTypeCategoryHeading';
import { AccountRec } from '../AccountRec';
import { BasicTable } from '../../BasicTable';
import { BasicTableColHeadings } from '../../BasicTable/BasicTableColHeadings';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableHeading } from '../../BasicTable/BasicTableHeading';
import './AccountTypeCategoryList.css';
import { IHoldingsFilterValue } from '../../../pages/Networth';


interface IAccountTypeCategoryList {
  accountTypeCategoryGroups: IAccountTypeCategoryGroup[],
  accountSortFunction: (a: IAccount, b: IAccount) => number,
  filterType: string,
  filterValue: IHoldingsFilterValue,
  setFilterType: (type: string) => void,
  setFilterValue: (value: IHoldingsFilterValue) => void,
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
}

export const AccountTypeCategoryList: React.FC<IAccountTypeCategoryList> = ({ accountTypeCategoryGroups, accountSortFunction, 
  filterValue, filterType, setFilterType, setFilterValue, sortColumn, sortDirection, setSortColumn, setSortDirection }) => {
  return (
    <div className="account-view-table">
      <BasicTable areRowsClickable={true} highlightRowsOnHover={true}>
        <Fragment>
          <BasicTableColHeadings
            headingSet={[
              { name: "Name", sortColumn: "name" },
              { name: "YTD Chg", sortColumn: "change" },
              { name: "Value", sortColumn: "balance" },
            ]}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            setSortColumn={setSortColumn}
            setSortDirection={setSortDirection}
          />
          {
            accountTypeCategoryGroups.map((accountTypeCategoryGroup) => (
              <Fragment key={accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryName}>
                <BasicTableHeading>
                  <AccountTypeCategoryHeading
                    accountTypeCategory={accountTypeCategoryGroup.accountTypeCategory} 
                    handleAccountTypeCategoryButtonClick={() => { 
                      setFilterType("accountTypeCategory");
                      setFilterValue({
                        id: accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryId,
                        label: accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryName
                      }); 
                    }}
                    isActive={filterType === "accountTypeCategory" && 
                      filterValue.id === accountTypeCategoryGroup.accountTypeCategory.accountTypeCategoryId}
                  />
                </BasicTableHeading>
                <BasicTableBody>
                  {
                    Object.values(accountTypeCategoryGroup.accounts).sort(accountSortFunction).map((account) => (
                      <AccountRec
                        key={account.accountId}
                        account={account}
                        handleAccountTypeCategoryButtonClick={() => { 
                          setFilterType("account");
                          setFilterValue({
                            id: account.accountId,
                            label: account.accountName
                          }); 
                        }}
                        isActive={filterType === "account" && filterValue.id === account.accountId}
                      />
                    ))
                  }
                </BasicTableBody>
              </Fragment>
            ))
          }
        </Fragment>
      </BasicTable>
    </div>
  );
};
