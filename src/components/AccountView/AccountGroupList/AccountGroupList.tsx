import { Fragment } from 'react';
import { IAccount, IAccountGroup } from '..';
import { AccountGroupCategoryHeading } from './AccountGroupCategoryHeading';
import { AccountRec } from '../AccountRec';
import { BasicTable } from '../../BasicTable';
import { BasicTableColHeadings } from '../../BasicTable/BasicTableColHeadings';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableHeading } from '../../BasicTable/BasicTableHeading';
import { HoldingsFilterTypes, IHoldingsFilter } from '../../HoldingView';
import './AccountGroupList.css';


interface IAccountGroupList {
  accountGroups: IAccountGroup[],
  accountSortFunction: (a: IAccount, b: IAccount) => number,
  accountGroupCategoryFilterType: HoldingsFilterTypes,
  holdingsFilters: IHoldingsFilter[],
  setHoldingsFilters: (filters: IHoldingsFilter[]) => void,
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
}

export const AccountGroupList: React.FC<IAccountGroupList> = ({ accountGroups, accountSortFunction, accountGroupCategoryFilterType,
  holdingsFilters, setHoldingsFilters, sortColumn, sortDirection, setSortColumn, setSortDirection }) => {
  return (
    <div className="account-view-table">
      <BasicTable areRowsClickable={true} highlightRowsOnHover={true}>
        <Fragment>
          <BasicTableColHeadings
            headingSet={[
              { name: "Name", sortColumn: "name" },
              { name: "% Alloc", sortColumn: "alloc" },
              { name: "YTD Chg", sortColumn: "change" },
              { name: "Value", sortColumn: "balance" },
            ]}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            setSortColumn={setSortColumn}
            setSortDirection={setSortDirection}
          />
          {
            accountGroups.map((accountGroup) => (
              <Fragment key={accountGroup.accountGroupCategory.accountGroupCategoryName}>
                <BasicTableHeading>
                  <AccountGroupCategoryHeading
                    accountGroupCategory={accountGroup.accountGroupCategory} 
                    handleAccountGroupCategoryButtonClick={() => { 
                      setHoldingsFilters([{
                        type: accountGroupCategoryFilterType,
                        id: accountGroup.accountGroupCategory.accountGroupCategoryId,
                        label: accountGroup.accountGroupCategory.accountGroupCategoryName,
                        filterValue: accountGroup.accountGroupCategory.accountGroupCategoryFilterValue,
                      }]); 
                    }}
                    isActive={holdingsFilters.length === 1 && 
                      holdingsFilterExists(holdingsFilters, accountGroupCategoryFilterType, accountGroup.accountGroupCategory.accountGroupCategoryId)}
                  />
                </BasicTableHeading>
                <BasicTableBody>
                  {
                    Object.values(accountGroup.accounts).sort(accountSortFunction).map((account) => (
                      <AccountRec
                        key={account.accountId}
                        account={account}
                        handleAccountButtonClick={() => { 
                          setHoldingsFilters([
                            {
                              type: accountGroupCategoryFilterType,
                              id: accountGroup.accountGroupCategory.accountGroupCategoryId,
                              label: accountGroup.accountGroupCategory.accountGroupCategoryName,
                              filterValue: accountGroup.accountGroupCategory.accountGroupCategoryFilterValue,
                            },
                            {
                              type: HoldingsFilterTypes.account,
                              id: account.accountId,
                              label: account.accountName,
                              filterValue: [account.accountId],
                            }
                          ]); 
                        }}
                        isActive={holdingsFilterExists(holdingsFilters, accountGroupCategoryFilterType, accountGroup.accountGroupCategory.accountGroupCategoryId) &&
                          holdingsFilterExists(holdingsFilters, HoldingsFilterTypes.account, account.accountId)}
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

const holdingsFilterExists = (holdingsFilters: IHoldingsFilter[], type: HoldingsFilterTypes, id: number) => {
  for(const holdingsFilter of holdingsFilters) {
    if(holdingsFilter.type === type && holdingsFilter.id === id) {
      return true;
    }
  }

  return false;
}