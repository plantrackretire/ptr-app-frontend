import { Fragment } from 'react';
import { IAccount, IAccountGroup, IAccountViewColumns } from '..';
import { AccountGroupCategoryHeading } from './AccountGroupCategoryHeading';
import { AccountRec } from '../AccountRec';
import { BasicTable } from '../../BasicTable';
import { BasicTableColHeadings, IBasicTableColHeadingsSet } from '../../BasicTable/BasicTableColHeadings';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableHeading } from '../../BasicTable/BasicTableHeading';
import { HoldingsFilterTypes, IHoldingsFilter } from '../../HoldingView';
import './AccountGroupList.css';


interface IAccountGroupList {
  accountGroups: IAccountGroup[],
  columns: IAccountViewColumns,
  accountSortFunction: (a: IAccount, b: IAccount) => number,
  accountGroupCategoryFilterType: HoldingsFilterTypes,
  holdingsFilters: IHoldingsFilter[],
  setHoldingsFilters: (filters: IHoldingsFilter[]) => void,
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
}

export const AccountGroupList: React.FC<IAccountGroupList> = ({ accountGroups, columns, accountSortFunction, accountGroupCategoryFilterType,
  holdingsFilters, setHoldingsFilters, sortColumn, sortDirection, setSortColumn, setSortDirection }) => {
  const headingSet: IBasicTableColHeadingsSet[] = [];
  headingSet.push({ name: "Name", sortColumn: "name" },);
  if('allocationPercentage' in columns && columns.allocationPercentage) {
    headingSet.push({ name: "% Alloc", sortColumn: "alloc", infoButtonContent: percentAllocInfo });
  }
  if('ytdChange' in columns && columns.ytdChange) {
    headingSet.push({ name: "YTD Chg", sortColumn: "change", infoButtonContent: ytdChgInfo });
  }
  if('value' in columns && columns.value) {
    headingSet.push({ name: "Value", sortColumn: "balance" });
  }
  if('ytdReturn' in columns && columns.ytdReturn) {
    headingSet.push({ name: "YTD Return", sortColumn: "ytdReturn", infoButtonContent: ytdReturnInfo });
  }
  if('costBasis' in columns && columns.costBasis) {
    headingSet.push({ name: "Cost Basis", sortColumn: "costBasis" });
  }
  if('unrealizedGain' in columns && columns.unrealizedGain) {
    headingSet.push({ name: "Unrealized", sortColumn: "unrealized" });
  }

  return (
    <div className="account-view-table">
      <BasicTable areRowsClickable={true} highlightRowsOnHover={true}>
        <Fragment>
          <BasicTableColHeadings
            headingSet={headingSet}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            setSortColumn={setSortColumn}
            setSortDirection={setSortDirection}
          />
          {
            accountGroups.map((accountGroup) => {
              if(accountGroup.hasNonZeroAccounts) {
                return (
                  <Fragment key={accountGroup.accountGroupCategory.accountGroupCategoryName}>
                    
                      <BasicTableHeading>
                        <AccountGroupCategoryHeading
                          accountGroupCategory={accountGroup.accountGroupCategory} 
                          columns={columns}
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
                          <Fragment key={account.accountId}>
                            {
                              account.hasNonZeroHoldings &&
                                <AccountRec
                                  account={account}
                                  columns={columns}
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
                            }
                          </Fragment>
                        ))
                      }
                    </BasicTableBody>
                  </Fragment>
                )
              } else {
                return <Fragment key={accountGroup.accountGroupCategory.accountGroupCategoryName}></Fragment>
              }
            })
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

const percentAllocInfo = 
<div className="info-button--info">
  <h2>Allocation Percentage (% Alloc)</h2>
  <div>The "Allocation Percentage" shows how much a specific record makes up of the whole for its group.</div>
  <div>For example, if the record is an account type, the percentage tells you how much that account type represents compared to all other account types in your portfolio.</div>
</div>;

const ytdChgInfo = 
<div className="info-button--info">
  <h2>Year to Date Change (YTD Chg)</h2>
  <div>The "Year-to-Date Change" shows how much the value of something has changed from the start of the year up to a specific end date.</div>
  <div>The end date is set by the 'As of Date' filter, and the comparison starts from the beginning of that same year.</div>
  <div><br /></div>
  <div>It’s important to know that this is not the same as measuring how well an investment is doing.</div>
  <div className="info-button--info-indent">For example, if you buy more of something during the year, the value will go up, but this doesn’t mean you’ve earned a return—just that you’ve added more of it. That’s why the increase shows up as a change in value, not as investment performance.</div>
</div>;

const ytdReturnInfo = 
<div className="info-button--info">
  <h2>Year to Date Return (YTD Return)</h2>
  <div>The "Year to Date Return" shows the Internal Rate of Return (IRR) for the year up to the 'As of Date.'</div>
  <ul>
    <li className="info-button--info-indent">If the 'As of Date' is today, it shows your current return for the year.</li>
    <li className="info-button--info-indent">If the 'As of Date' is in a past year, it shows the return from the start of that year up to the selected date. For example, if the 'As of Date' is August 15, 2015, the Year to Date Return will cover January 1, 2015, to August 15, 2015.</li>
  </ul>
  <div><br /></div>
  <div>The Year to Date Return is not annualized; it reflects the return for that specific time period only.</div>
</div>;
