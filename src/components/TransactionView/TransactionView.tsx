import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useContext, useEffect, useState } from 'react';
import { TransactionList } from './TransactionList';
import { createDateFromDayValue, createDateStringFromDate, createLocalDateFromDateTimeString, getPriorMonthEnd } from '../../utils/dates';
import { TransactionViewPlaceholder } from './TransactionViewPlaceholder';
import { ModalType, useModalContext } from '../../providers/Modal';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { IFilterBarValues, formatFilterBarValuesForServer } from '../FilterBar';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { fetchData, getUserToken } from '../../utils/general';
import './TransactionView.css';


interface ITransactionView {
  filterBarValues: IFilterBarValues,
  securityId?: number,
  securityName?: string,
  accountId?: number,
  accountName?: string,
  freezeHeadings?: boolean,
  maxHeight?: string, // Required to scroll table data
}

export interface ITransaction {
  transactionId: number,
  transactionDate: Date,
  securityId: number,
  securityShortName: string
  securityName: string,
  assetClassId: number,
  fullAssetClass: string,
  accountId: number,
  accountName: string,
  transactionTypeId: number,
  transactionTypeName: string,
  comment: string,
  quantity: number,
  price: number,
  amount: number,
  fee: number,
}

export const TransactionView: React.FC<ITransactionView> = ({ filterBarValues, securityId, securityName, accountId, accountName, freezeHeadings, maxHeight }) => {
  const [dbTransactions, setDbTransactions] = useState<ITransaction[] | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("transactionDate");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const appUserAttributes = useContext(AuthenticatorContext);
  const modalContext = useModalContext();

  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    let mergedFilterBarValues = filterBarValues;
    if(securityId || accountId) {
      mergedFilterBarValues = {...filterBarValues};
      if(securityId) {
        mergedFilterBarValues.assets =  [{label: '', value: securityId}];
        mergedFilterBarValues.assetClasses = [];
      }
      if(accountId) {
        mergedFilterBarValues.accounts =  [{label: '', value: accountId}];
        mergedFilterBarValues.accountTypes = [];
      }
    }
    
    const formattedFilterBarValues = formatFilterBarValuesForServer(mergedFilterBarValues);
    const formattedEndDate = getPriorMonthEnd(createDateFromDayValue(filterBarValues.asOfDate));

    const getData = async() => {
        const url = PtrAppApiStack.PtrAppApiEndpoint + "GetTransactions";
        const bodyTransactions = { userId: appUserAttributes!.userId, queryType: "transactions", 
            endDate: createDateStringFromDate(formattedEndDate), filters: formattedFilterBarValues };

        const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

        const results = await fetchData(url, bodyTransactions, token);
        if(results === null) {
            await modalContext.showConfirmation(
                ModalType.confirm,
                'Error retreiving transactions, please try again.',
            );
            setDbTransactions([]);
            return () => { ignoreResults = true };
        }
        const transactions = results.transactions;
        // Create javascript dates in holding objects
        createDates(transactions);
                
        if(!ignoreResults) {
            setDbTransactions(transactions);
        }
    }

    getData();

    return () => { ignoreResults = true };
  }, [filterBarValues, securityId, accountId])

  if(dbTransactions === null) {
    return <TransactionViewPlaceholder />
  }

  let securityScope = securityId ? 
    <div>
      <span><b>Security: </b></span>
      <span className="de-emphasize">{securityName}</span>
    </div>
  : '';
  let accountScope = accountId ? 
    <div>
      <span><b>Account: </b></span>
      <span className='de-emphasize'>{accountName}</span>
    </div>
  : '';

  const scope =
    <div className="transaction-view--heading">
      { accountScope }
      { securityScope }
    </div>;

  const sortFunction = sortFunctionSet[sortColumn][sortDirection];
  const transactionsSorted = Object.values(dbTransactions).sort(sortFunction);

  const style = maxHeight ? { maxHeight: maxHeight } : {};

  return (
    <div className='transaction-view' style={style}>
      <SectionHeading
        size={SectionHeadingSizeType.medium} 
        label="Transactions"
        subLabel={scope} 
      />
      { (transactionsSorted.length > 0) ?
        <div className="transaction-view--table">
          <TransactionList
            transactions={transactionsSorted}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            setSortColumn={setSortColumn}
            setSortDirection={setSortDirection}
            freezeHeadings={freezeHeadings ? freezeHeadings : false}
            excludeAccountCol={accountId ? true : false}
            excludeSecurityCol={securityId ? true : false}
          />
        </div>
      :
        <div className="transaction-view--no-transactions">
          <h2>No Transactions Found.</h2>
        </div>
      }
    </div>
  );
};

const createDates = (transactions: ITransaction[]) => {
  transactions.forEach((transaction) => {
    transaction.transactionDate = createLocalDateFromDateTimeString(transaction.transactionDate as unknown as string)
  })
};


const sortFunctionSet: { [index: string]: { [index: string]: (a: ITransaction, b: ITransaction) => number } } = {
  transactionDate: {
      'asc': (a: ITransaction,b: ITransaction) => a.transactionDate >= b.transactionDate ? 1 : -1,
      'desc': (a: ITransaction,b: ITransaction) => a.transactionDate <= b.transactionDate ? 1 : -1,
  },
  accountName: {
    'asc': (a: ITransaction,b: ITransaction) => a.accountName >= b.accountName ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.accountName <= b.accountName ? 1 : -1,
  },
  securityName: {
    'asc': (a: ITransaction,b: ITransaction) => a.securityName >= b.securityName ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.securityName <= b.securityName ? 1 : -1,
  },
  transactionType: {
    'asc': (a: ITransaction,b: ITransaction) => a.transactionTypeName >= b.transactionTypeName ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.transactionTypeName <= b.transactionTypeName ? 1 : -1,
  },
  quantity: {
    'asc': (a: ITransaction,b: ITransaction) => a.quantity >= b.quantity ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.quantity <= b.quantity ? 1 : -1,
  },
  price: {
    'asc': (a: ITransaction,b: ITransaction) => a.price >= b.price ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.price <= b.price ? 1 : -1,
  },
  amount: {
    'asc': (a: ITransaction,b: ITransaction) => a.amount >= b.amount ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.amount <= b.amount ? 1 : -1,
  },
  fee: {
    'asc': (a: ITransaction,b: ITransaction) => a.fee >= b.fee ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.fee <= b.fee ? 1 : -1,
  },
  comment: {
    'asc': (a: ITransaction,b: ITransaction) => a.comment >= b.comment ? 1 : -1,
    'desc': (a: ITransaction,b: ITransaction) => a.comment <= b.comment ? 1 : -1,
  },
};