import { IHandleHoldingActionButtonClick, IHolding, IHoldingGroup, IHoldingsFilter } from '..';
import { Fragment } from 'react';
import { HoldingRec } from './HoldingRec';
import { AccountHolding } from './AccountHolding';
import { BasicTable } from '../../BasicTable';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableColHeadings } from '../../BasicTable/BasicTableColHeadings';
import './HoldingGroupList.css';
import { IAccountViewColumns } from '../../AccountView';


interface IHoldingGroupList {
  holdingGroups: IHoldingGroup[],
  columns: IAccountViewColumns,
  includeSubRows: boolean,
  filters: IHoldingsFilter[],
  handleHoldingActionButtonClick: (params: IHandleHoldingActionButtonClick) => void,
  accountHoldingSortFunction: (a: IHolding, b: IHolding) => number,
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
}

export const HoldingGroupList: React.FC<IHoldingGroupList> = ({ holdingGroups, columns, includeSubRows, filters, handleHoldingActionButtonClick, accountHoldingSortFunction,
  sortColumn, sortDirection, setSortColumn, setSortDirection
  }) => {
  const headingSet = [{ name: "Ticker", sortColumn: "securityShortName" }, { name: "Name", subName: "Account", sortColumn: "securityName" },];
  if('price' in columns && columns.price) {
    headingSet.push({ name: "Price", subName: "Last Upd", sortColumn: "price" });
  }
  if('quantity' in columns && columns.quantity) {
    headingSet.push({ name: "Quantity", subName: "Last Upd", sortColumn: "quantity" });
  }
  if(('balance' in columns && columns.balance) && ('ytdChangeUnderBalance' in columns && columns.ytdChangeUnderBalance)) {
    headingSet.push({ name: "Value", subName: "YTD Chg", sortColumn: "balance" });
  } else if('balance' in columns && columns.balance) {
    headingSet.push({ name: "Value", sortColumn: "balance" });
  }
  if('ytdReturn' in columns && columns.ytdReturn) {
    headingSet.push({ name: "YTD Return", sortColumn: "ytdReturn" });
  }
  if('costBasis' in columns && columns.costBasis) {
    headingSet.push({ name: "Cost Basis", sortColumn: "costBasis" });
  }
  if('unrealizedGain' in columns && columns.unrealizedGain) {
    headingSet.push({ name: "Unrealized", sortColumn: "unrealized" });
  }

  return (
    <div className="holding-group-list">
      <BasicTable areRowsClickable={true} highlightRowsOnHover={true}>
        <BasicTableColHeadings
          headingSet={headingSet}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          setSortColumn={setSortColumn}
          setSortDirection={setSortDirection}
        />
        <BasicTableBody>
          {
            holdingGroups.map((holdingGroup) => {
              if(holdingGroup.hasNonZeroHoldings) {
                return (
                  <Fragment key={holdingGroup.holdingId}>
                    <HoldingRec
                      holding={holdingGroup}
                      columns={columns}
                      filters={filters}
                      handleHoldingActionButtonClick={handleHoldingActionButtonClick}
                    />
                    { 
                      (includeSubRows && holdingGroup.holdings.length > 1) && 
                      holdingGroup.holdings.sort(accountHoldingSortFunction).map((accountHolding) => (
                        <Fragment key={accountHolding.accountId}>
                          {
                            accountHolding.balance !== 0 &&
                              <AccountHolding
                                accountHolding={accountHolding}
                                columns={columns}
                                handleHoldingActionButtonClick={handleHoldingActionButtonClick}
                              />
                          }
                        </Fragment>
                      ))
                    }
                  </Fragment>
                )
              } else {
                return <Fragment key={holdingGroup.holdingId}></Fragment>;
              }
            })
          }
        </BasicTableBody>
      </BasicTable>
    </div>
  );
};