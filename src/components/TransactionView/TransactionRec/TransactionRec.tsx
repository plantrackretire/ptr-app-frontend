import { formatBalance, formatPrice, formatQuantity } from '../../../utils/general';
import { ITransaction, TransactionViewTypes } from '..';
import { BasicTableRow } from '../../BasicTable/BasicTableRow';
import { Fragment } from 'react';
import { Checkbox } from '../../Inputs/Checkbox';
import { CashflowCategories } from '../../../pages/InvestmentActions/Drawdown';
import './TransactionRec.css';


interface ITransactionRec {
  transactionViewType: TransactionViewTypes,
  transaction: ITransaction,
  excludeAccountCol?: boolean,
  excludeSecurityCol?: boolean,
  handleNotADrawdownChange?: (transactionId: number, value: boolean, handleValueSubmitResult: (result: string) => void) => void,
}

export const TransactionRec: React.FC<ITransactionRec> = ({ transactionViewType, transaction, excludeAccountCol, excludeSecurityCol, handleNotADrawdownChange }) => {
  if(excludeAccountCol === undefined) excludeAccountCol = false;
  if(excludeSecurityCol === undefined) excludeSecurityCol = false;

  return (
    <BasicTableRow>
      <Fragment>
        { (transactionViewType === TransactionViewTypes.transactionCategoryView) &&
          <td className="transaction-view--is-not-drawdown">
            {
              (transaction.cashflowCategory && transaction.cashflowCategory === CashflowCategories.withdrawals) ?
                <Checkbox 
                  initialValue={transaction.isNotDrawdown ? transaction.isNotDrawdown : false}
                  onValueSubmit={(value: boolean, handleValueSubmitResult: (result: string) => void) =>
                    { handleNotADrawdownChange!(transaction.transactionId, value, handleValueSubmitResult)}}
                />
                :
                <br />
            }
          </td>
        }
      </Fragment>
      <td><span className='nowrap'>{transaction.transactionDate.toISOString().split('T')[0]}</span></td>
      <Fragment>
        { !excludeAccountCol &&
          <td>{transaction.accountName}</td>
        }
        { !excludeSecurityCol &&
          <td>{transaction.securityName}</td>
        }
      </Fragment>
      <td>{transaction.transactionTypeName}</td>
      <td className='nowrap'><span className='nowrap'>{transaction.quantity !== null ? formatQuantity(transaction.quantity) : ''}</span></td>
      <td className='nowrap'><span className='nowrap'>{transaction.price !== null ? formatPrice(transaction.price) : ''}</span></td>
      <td className='nowrap'><span className='nowrap'>{transaction.amount !== null ? formatBalance(transaction.amount) : ''}</span></td>
      <td className='nowrap'><span className='nowrap'>{transaction.fee !== null ? formatPrice(transaction.fee) : ''}</span></td>
      <td>{transaction.comment ? transaction.comment : ''}</td>
    </BasicTableRow>
  );
};