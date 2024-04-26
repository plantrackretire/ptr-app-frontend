import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Networth } from './Networth';
import { useContext, useEffect, useState } from 'react';
import { IFilterBarValues, filterBarValuesInit, formatFilterBarValuesForServer } from '../components/FilterBar';
import { AuthenticatorContext } from '../providers/AppAuthenticatorProvider';
import { IAccount } from '../components/AccountView';
import { createDateFromDayValue, createDateStringFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../utils/dates';
import { fetchData, getUserToken } from '../utils/general';
import { PtrAppApiStack } from '../../../ptr-app-backend/cdk-outputs.json';
import { IHolding } from '../components/HoldingView';
import { ModalType, useModalContext } from '../providers/Modal';
import './Page.css';


export const Page: React.FC = () => {
    const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(filterBarValuesInit);
    const [dbHoldings, setDbHoldings] = useState<[] | null>(null);
    const [dbAccounts, setDbAccounts] = useState<{[index: number]: IAccount} | null>(null);
    const [dbHistoricalHoldings, setDbHistoricalHoldings] = useState<{ [index: string]: [] } | null>(null);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    // Executes multiple queries in parallel and processes results when all have returned.
    // If significant different in response time of queries can split each into their own useEffect call, which will allow them to execute
    //  and process results independently, but it will result in more renders.  If splitting, don't need the 'Promise.all', just await fetchData.
    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const formattedEndDate = getPriorMonthEnd(createDateFromDayValue(filterBarValues.asOfDate));
        const beginningOfYear = getBeginningOfYear(formattedEndDate);

        const getData = async() => {
            const url = PtrAppApiStack.PtrAppApiEndpoint + "GetHoldings";
            const bodyHoldings = { userId: appUserAttributes!.userId, queryType: "asOf", startDate: createDateStringFromDate(beginningOfYear), 
                endDate: createDateStringFromDate(formattedEndDate), filters: formattedFilterBarValues };
            const bodyHistoricalHoldings = { userId: appUserAttributes!.userId, queryType: "historical", endDate: createDateStringFromDate(formattedEndDate),
                filters: formattedFilterBarValues };

            const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

            const results = await Promise.all([
                fetchData(url, bodyHoldings, token),
                fetchData(url, bodyHistoricalHoldings, token),
            ]);
            if(results === null) {
                await modalContext.showConfirmation(
                    ModalType.confirm,
                    'Error retreiving data, please try again.',
                );
                setDbHoldings([]);
                setDbAccounts({});
                setDbHistoricalHoldings({});
                return () => { ignoreResults = true };
            }
            const resultsHoldings = results[0];
            const resultsHistoricalHoldings = results[1];
            
            // Create javascript dates in holding objects
            createDates(resultsHoldings.holdings);
            const accountMapping = createAccountMapping(resultsHoldings.accounts);
                    
            if(!ignoreResults) {
                setDbHoldings(resultsHoldings.holdings);
                setDbAccounts(accountMapping);
                setDbHistoricalHoldings(resultsHistoricalHoldings);
            }
        }

        getData();
    
        return () => { ignoreResults = true };
    }, [filterBarValues])

    const handleFilterBarValuesChange = (values: IFilterBarValues) => {
        setDbHoldings(null);
        setDbAccounts(null);
        setDbHistoricalHoldings(null);
        setFilterBarValues(values);
    }

    return (
        <div className='page'>
            <div className='page--header'>
                <Header />
            </div>
            <div className="page--content-container">
                <div className='page--navbar '>
                    <Navbar filterBarValues={filterBarValues} setFilterBarValues={handleFilterBarValuesChange} />
                </div>
                <Networth 
                    filterBarValues={filterBarValues} 
                    dbHoldings={dbHoldings}
                    dbAccounts={dbAccounts}
                    dbHistoricalHoldings={dbHistoricalHoldings}
                />
            </div>
        </div>
    );
};

const createDates = (holdings: IHolding[]) => {
    holdings.forEach((holding) => {
        holding.holdingDate = createLocalDateFromDateTimeString(holding.holdingDate as unknown as string)
        if('lastQuantityUpdateDate' in holding)
            holding.lastQuantityUpdateDate = createLocalDateFromDateTimeString(holding.lastQuantityUpdateDate! as unknown as string);
        if('lastPriceUpdateDate' in holding) {
            holding.lastPriceUpdateDate = createLocalDateFromDateTimeString(holding.lastPriceUpdateDate! as unknown as string);
        }
        if('startDatePositionDate' in holding)
            holding.startDatePositionDate = createLocalDateFromDateTimeString(holding.startDatePositionDate! as unknown as string);
    })
};

const createAccountMapping = (accountsArray: IAccount[]): {[index: number]: IAccount} => {
    const accountMapping: {[index: number]: IAccount} = {};

    accountsArray.forEach((account) => {
        (accountMapping as {[index: number]: IAccount})[account.accountId] = account;
    });

    return accountMapping;
};