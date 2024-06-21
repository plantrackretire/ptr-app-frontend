import { IHandleHoldingActionButtonClick, IHolding, IHoldingGroup, IHoldingsFilter } from '..';
import { Fragment } from 'react';
import { HoldingRec } from './HoldingRec';
import { AccountHolding } from './AccountHolding';
import { BasicTable } from '../../BasicTable';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableColHeadings } from '../../BasicTable/BasicTableColHeadings';
import './HoldingGroupList.css';


interface IHoldingGroupList {
  holdingGroups: IHoldingGroup[],
  filters: IHoldingsFilter[],
  handleHoldingActionButtonClick: (params: IHandleHoldingActionButtonClick) => void,
  accountHoldingSortFunction: (a: IHolding, b: IHolding) => number,
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
}

export const HoldingGroupList: React.FC<IHoldingGroupList> = ({ holdingGroups, filters, handleHoldingActionButtonClick, accountHoldingSortFunction,
  sortColumn, sortDirection, setSortColumn, setSortDirection
  }) => {
  return (
    <div className="holding-group-list">
      <BasicTable areRowsClickable={true} highlightRowsOnHover={true}>
        <BasicTableColHeadings
          headingSet={[
            { name: "Ticker", sortColumn: "securityShortName" },
            { name: "Name", subName: "Account", sortColumn: "securityName" },
            { name: "Price", subName: "Last Upd", sortColumn: "price" },
            { name: "Quantity", subName: "Last Upd", sortColumn: "quantity" },
            { name: "Value", subName: "YTD Chg", sortColumn: "balance" },
          ]}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          setSortColumn={setSortColumn}
          setSortDirection={setSortDirection}
        />
        <BasicTableBody>
          {
            holdingGroups.map((holdingGroup) => (
              <Fragment key={holdingGroup.holdingId}>
                <HoldingRec
                  holding={holdingGroup}
                  filters={filters}
                  handleHoldingActionButtonClick={handleHoldingActionButtonClick}
                />
                {
                  holdingGroup.holdings.length > 1 && 
                  holdingGroup.holdings.sort(accountHoldingSortFunction).map((accountHolding) => (
                    <AccountHolding
                      key={accountHolding.accountId}
                      accountHolding={accountHolding}
                      handleHoldingActionButtonClick={handleHoldingActionButtonClick}
                    />
                  ))
                }
              </Fragment>
            ))
          }
        </BasicTableBody>
      </BasicTable>
    </div>
  );
};