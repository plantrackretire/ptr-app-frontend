import { ITransaction, TransactionViewTypes } from '..';
import { TransactionRec } from '../TransactionRec';
import { BasicTable } from '../../BasicTable';
import { BasicTableBody } from '../../BasicTable/BasicTableBody';
import { BasicTableColHeadings, IBasicTableColHeadingsSet } from '../../BasicTable/BasicTableColHeadings';
import './TransactionList.css';


interface ITransactionList {
  transactionViewType: TransactionViewTypes,
  transactions: ITransaction[],
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
  freezeHeadings?: boolean,
  excludeAccountCol?: boolean,
  excludeSecurityCol?: boolean,
  handleNotADrawdownChange?: (transactionId: number, value: boolean, handleValueSubmitResult: (result: string) => void) => void,
}

export const TransactionList: React.FC<ITransactionList> = ({ transactionViewType, transactions, sortColumn, sortDirection, setSortColumn, setSortDirection, 
  freezeHeadings, excludeAccountCol, excludeSecurityCol, handleNotADrawdownChange }) => {
  const headingSet: IBasicTableColHeadingsSet[] = [];
  
  if(transactionViewType === TransactionViewTypes.transactionCategoryView) {
    headingSet.push({ name: "Not a Drawdown", sortColumn: "notADrawdown" });
  }
  headingSet.push({ name: "Date", sortColumn: "transactionDate" });
  if(!excludeAccountCol) {
    headingSet.push({ name: "Account", sortColumn: "accountName" });
  }
  if(!excludeSecurityCol) {
    headingSet.push({ name: "Security", sortColumn: "securityName" });
  }
  headingSet.push(
    { name: "Type", sortColumn: "transactionType" },
    { name: "Quantity", sortColumn: "quantity" },
    { name: "Price", sortColumn: "price" },
    { name: "Amount", sortColumn: "amount" },
    { name: "Fee", sortColumn: "fee" },
    { name: "Comment", sortColumn: "comment" },
  );

  return (
    <div className="transaction-list">
      <BasicTable areRowsClickable={false} highlightRowsOnHover={true} zebraStripes={true}>
        <BasicTableColHeadings
          headingSet={headingSet}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          setSortColumn={setSortColumn}
          setSortDirection={setSortDirection}
          freezeHeadings={freezeHeadings ? freezeHeadings : false}
        />
        <BasicTableBody>
          {
            transactions.map((transaction) => (
              <TransactionRec key={transaction.transactionId + transaction.transactionTypeName} transactionViewType={transactionViewType} 
                transaction={transaction} excludeAccountCol={excludeAccountCol} excludeSecurityCol={excludeSecurityCol} handleNotADrawdownChange={handleNotADrawdownChange}
              />
            ))
          }
        </BasicTableBody>
      </BasicTable>
    </div>
  );
};