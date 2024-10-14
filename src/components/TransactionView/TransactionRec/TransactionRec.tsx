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