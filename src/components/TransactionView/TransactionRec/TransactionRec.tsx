import { formatBalance, formatPrice, formatQuantity } from '../../../utils/general';
import { ITransaction } from '..';
import { BasicTableRow } from '../../BasicTable/BasicTableRow';
import './TransactionRec.css';
import { Fragment } from 'react';


interface ITransactionRec {
  transaction: ITransaction,
  excludeAccountCol?: boolean,
  excludeSecurityCol?: boolean,
}

export const TransactionRec: React.FC<ITransactionRec> = ({ transaction, excludeAccountCol, excludeSecurityCol }) => {
  if(excludeAccountCol === undefined) excludeAccountCol = false;
  if(excludeSecurityCol === undefined) excludeSecurityCol = false;

  return (
    <BasicTableRow>
      <td className='nowrap'>{transaction.transactionDate.toISOString().split('T')[0]}</td>
      <Fragment>
        { !excludeAccountCol &&
          <td>{transaction.accountName}</td>
        }
        { !excludeSecurityCol &&
          <td>{transaction.securityName}</td>
        }
      </Fragment>
      <td>{transaction.transactionTypeName}</td>
      <td className='nowrap'>{transaction.quantity !== null ? formatQuantity(transaction.quantity) : ''}</td>
      <td className='nowrap'>{transaction.price !== null ? formatPrice(transaction.price) : ''}</td>
      <td className='nowrap'>{transaction.amount !== null ? formatBalance(transaction.amount) : ''}</td>
      <td className='nowrap'>{transaction.fee !== null ? formatPrice(transaction.fee) : ''}</td>
      <td>{transaction.comment ? transaction.comment : ''}</td>
    </BasicTableRow>
  );
};