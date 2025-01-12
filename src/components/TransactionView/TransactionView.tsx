import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { useEffect, useState } from 'react';
import { TransactionList } from './TransactionList';
import { createDateFromDayValue, createDateStringFromDate, createLocalDateFromDateTimeString, getPriorMonthEnd } from '../../utils/dates';
import { TransactionViewPlaceholder } from './TransactionViewPlaceholder';
import { ModalType, useModalContext } from '../../providers/Modal';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { formatFilterBarValuesForServer } from '../FilterBar';
import { IFilterBarValues } from '../FilterBar/FilterBarDeclarations';
import { IAuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { convertArrayToString, fetchData, getUserToken } from '../../utils/general';
import { CashflowCategories } from '../../pages/InvestmentActions/Drawdown';
import './TransactionView.css';


export enum TransactionViewTypes {
  basicView='transactions',
  transactionCategoryView='cashflowTransactions',
}

interface ITransactionView {
  transactionViewType: TransactionViewTypes,
  appUserAttributes: IAuthenticatorContext,
  filterBarValues: IFilterBarValues,
  handleCloseWithContent: (content: any) => void,
  securityId?: number,
  securityName?: string,
  accountId?: number,
  accountName?: string,
  accountTypeCategoryId?: number,
  accountTypeCategoryName?: string,
  assetClassIdList?: number[],
  assetClassName?: string,
  cashflowCategories?: CashflowCategories[],
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
  cashflowCategory?: CashflowCategories,
  isNotDrawdown?: boolean,
}

export const TransactionView: React.FC<ITransactionView> = ({ transactionViewType, appUserAttributes, filterBarValues, handleCloseWithContent, securityId, securityName, 
  accountId, accountName, accountTypeCategoryId, accountTypeCategoryName, assetClassIdList, assetClassName, cashflowCategories, freezeHeadings, maxHeight }) => {
  const [dbTransactions, setDbTransactions] = useState<ITransaction[] | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("transactionDate");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const [notADrawdownChangeSet, setNotADrawdownChangeSet] = useState<{ id: number,  value: boolean }[]>([]);
  const [loadTransactions, setLoadTransactions] = useState<boolean>(false);
  const [wereChangesSaved, setWereChangesSaved] = useState<boolean>(false);
  const modalContext = useModalContext();

  // Load transactions from db.
  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    // If specific security and/or account were passed in then merge them with filter values.  
    // If either exists override their respective values and clear out their parent (account types or asset classes).
    // Otherwise do the same with account type category and/or asset classes.
    let mergedFilterBarValues = filterBarValues;
    if(securityId || accountId || accountTypeCategoryId || assetClassIdList || cashflowCategories) {
      mergedFilterBarValues = {...filterBarValues};
      if(securityId) {
        mergedFilterBarValues.assets =  [{label: '', value: securityId}];
        mergedFilterBarValues.assetClasses = [];
      } else if(assetClassIdList) {
        // Converting asset class id array back to string because in filterbar it is still stored as a string (easy to change that as the filter value is only used in format for server).
        mergedFilterBarValues.assetClasses = [{ label: '', value: 0, filter: convertArrayToString(assetClassIdList, ',')}];
      }
      if(accountId) {
        mergedFilterBarValues.accounts =  [{label: '', value: accountId}];
        mergedFilterBarValues.accountTypes = [];
      } else if(accountTypeCategoryId) {
        mergedFilterBarValues.accountTypes = [{label: '', value: accountTypeCategoryId, level: 0}];
      }
      if(cashflowCategories && cashflowCategories.length > 0) {
        mergedFilterBarValues.cashflowCategories = cashflowCategories.map(cat => { return { label: '', value: 0, filter: cat } });
      }
    }

    const formattedFilterBarValues = formatFilterBarValuesForServer(mergedFilterBarValues);
    const formattedStartDate = filterBarValues.startDate ? createDateFromDayValue(filterBarValues.startDate) : null;
    const formattedEndDate = getPriorMonthEnd(createDateFromDayValue(filterBarValues.asOfDate));

    const getData = async() => {
        const url = PtrAppApiStack.PtrAppApiEndpoint + "GetTransactions";
        let bodyTransactions = {};
        if(formattedStartDate) {
          bodyTransactions = { userId: appUserAttributes!.userId, queryType: transactionViewType, startDate: createDateStringFromDate(formattedStartDate),
            endDate: createDateStringFromDate(formattedEndDate), filters: formattedFilterBarValues };
        } else {
          bodyTransactions = { userId: appUserAttributes!.userId, queryType: transactionViewType,
            endDate: createDateStringFromDate(formattedEndDate), filters: formattedFilterBarValues };
        }

        const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

        const results = await fetchData(url, bodyTransactions, token);
        if(results === null) {
            await modalContext.showModal(
                ModalType.confirm,
                'Error retreiving transactions, please try again.',
            );
            setDbTransactions([]);
            setLoadTransactions(false);
            return () => { ignoreResults = true };
        }
        const transactions = results.transactions;
        // Create javascript dates in holding objects
        createDates(transactions);
                
        if(!ignoreResults) {
            setDbTransactions(transactions);
            setLoadTransactions(false);
        }
    }

    getData();

    return () => { ignoreResults = true };
  }, [filterBarValues, securityId, accountId, accountTypeCategoryId, assetClassIdList, cashflowCategories, loadTransactions])

  const handleNotADrawdownChange = async (transactionId: number, value: boolean, handleValueSubmitResult: (result: string) => void) => {
    // Update transactions in place to reflect new value, until transactions are reloaded after changes are saved.
    setDbTransactions((prevState: ITransaction[] | null) => {
      const newTransactions = [...prevState!]; // Can't get to this function if transactions is null
      const existingTran = newTransactions.find((value: ITransaction) => transactionId === value.transactionId);
      if(existingTran) {
        existingTran.isNotDrawdown = value;
      }

      return newTransactions;
    });

    // Add change to the change set for later saving, if already in change set then remove since toggling value reverts back to original value.
    setNotADrawdownChangeSet((prevState: {id: number, value: boolean}[]) => {
      // Check if id already in change set, if so just reverting to original value.
      const existingRec = prevState.find((rec: {id: number, value: boolean}) => transactionId === rec.id);
      if(existingRec) { // rec has already been changed, this update is flipping it back to original value so remove from change set.
        return prevState.filter((rec: {id: number, value: boolean}) => transactionId !== rec.id);
      } else { // Add to change set.
        return [...prevState, { id: transactionId, value: value }];
      }
    });

    handleValueSubmitResult("SUCCESS");
}

  const handleSaveNotADrawdownChanges = async () => {
    const url = PtrAppApiStack.PtrAppApiEndpoint + "GetCashflows";
    const bodyRequest = { userId: appUserAttributes!.userId, queryType: "updateNotADrawdown", notADrawdownChangeSet: notADrawdownChangeSet };

    const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

    const results = await Promise.all([
        fetchData(url, bodyRequest, token),
    ]);

    const resultStatus = results && results[0].status ? results[0].status : "FAILURE";
    if(resultStatus === "SUCCESS") {
      setLoadTransactions(true);
      setWereChangesSaved(true);
      setNotADrawdownChangeSet([]);
    } else {
        const message = resultStatus ? "(" + resultStatus + ")" : "";
        await modalContext.showModal(
            ModalType.confirm,
            'Error marking withdrawals as not drawdowns: ' + message + ', please try again.',
        );
    }
  }

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
  let accountTypeCategoryScope = accountTypeCategoryId ? 
    <div>
      <span><b>Account Type Category: </b></span>
      <span className='de-emphasize'>{accountTypeCategoryName}</span>
    </div>
  : '';
  let assetClassScope = assetClassIdList ? 
    <div>
      <span><b>Asset Class: </b></span>
      <span className='de-emphasize'>{assetClassName}</span>
    </div>
  : '';
  // This assumes one cash flow category passed in, or none.
  let cashflowCategoryScope = cashflowCategories ? 
    <div>
      <span><b>Cashflow Category: </b></span>
      <span className='de-emphasize'>{cashflowCategories[0]}</span>
    </div>
  : '';

  const scope =
    <div className="transaction-view--heading">
      { accountTypeCategoryScope }
      { assetClassScope }
      { accountScope }
      { securityScope }
      { cashflowCategoryScope }
    </div>;

  const sortFunction = sortFunctionSet[sortColumn][sortDirection];
  const transactionsSorted = Object.values(dbTransactions).sort(sortFunction);

  const style = maxHeight ? { maxHeight: maxHeight } : {};

  let haveCashflowWithdrawals = false;
  if(transactionViewType === TransactionViewTypes.transactionCategoryView) {
    let index = 0;
    while (!haveCashflowWithdrawals && index < transactionsSorted.length) {
      if(transactionsSorted[index].cashflowCategory && transactionsSorted[index].cashflowCategory === CashflowCategories.withdrawals)
        haveCashflowWithdrawals = true;
      index++;
    }
  }

  return (
    <div className='transaction-view' style={style}>
      <div className="transaction-view--compound-heading">
        <SectionHeading
          size={SectionHeadingSizeType.medium}
          label="Transactions"
          subLabel={scope} 
        />
        <div className="transaction-view--buttons">
          {
            (haveCashflowWithdrawals && notADrawdownChangeSet.length) ?
              <button className="button-el--visual" onClick={handleSaveNotADrawdownChanges}>Save Changes</button>
              : ""
          }
          <button className="button-el--visual" 
            onClick={() => handleCloseWithContent(wereChangesSaved)}>
            OK
          </button>
        </div>
      </div>
      { (transactionsSorted.length > 0) ?
        <div className="transaction-view--table">
          <TransactionList
            transactionViewType={transactionViewType}
            transactions={transactionsSorted}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            setSortColumn={setSortColumn}
            setSortDirection={setSortDirection}
            handleNotADrawdownChange={handleNotADrawdownChange}
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