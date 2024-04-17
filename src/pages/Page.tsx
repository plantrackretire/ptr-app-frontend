import './Page.css';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Networth } from './Networth';
import { useContext, useEffect, useState } from 'react';
import { IFilterBarValues, filterBarValuesInit, formatFilterBarValuesForServer } from '../components/FilterBar';
import { AuthenticatorContext } from '../providers/AppAuthenticatorProvider';
import { IAccount } from '../components/AccountView';
import { createDateFromDayValue, createDateStringFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../utils/dates';
import { fetchData, timeout } from '../utils/general';
import { PtrAppApiStack } from '../../../ptr-app-backend/cdk-outputs.json';
import { IHolding } from '../components/HoldingView';

export const Page: React.FC = () => {
    const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(filterBarValuesInit);
    const [dbHoldings, setDbHoldings] = useState<[] | null>(null);
    const [dbAccounts, setDbAccounts] = useState<{[index: number]: IAccount} | null>(null);
    const [dbHistoricalHoldings, setDbHistoricalHoldings] = useState<{ [index: string]: [] } | null>(null);
    const appUserAttributes = useContext(AuthenticatorContext);

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const formattedEndDate = getPriorMonthEnd(createDateFromDayValue(filterBarValues.asOfDate));
        const beginningOfYear = getBeginningOfYear(formattedEndDate);

        const getDbHoldings = async() => {
            const url = PtrAppApiStack.PtrAppApiEndpoint + "GetHoldings";
            const body = { userId: 7493728439, queryType: "asOf", startDate: createDateStringFromDate(beginningOfYear), 
                endDate: createDateStringFromDate(formattedEndDate), filters: formattedFilterBarValues };
            const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

            createDates(postResultJSON.holdings);
            const accountMapping = createAccountMapping(postResultJSON.accounts);
                    
            if(!ignoreResults) {
                setDbHoldings(postResultJSON.holdings);
                setDbAccounts(accountMapping);
            }
        }

        getDbHoldings();
    
        return () => { ignoreResults = true };
    }, [filterBarValues])
    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const formattedEndDate = getPriorMonthEnd(createDateFromDayValue(filterBarValues.asOfDate));
        
        const getDbHistoricalHoldings = async() => {
            const url = PtrAppApiStack.PtrAppApiEndpoint + "GetHoldings";
            const body = { userId: 7493728439, queryType: "historical", endDate: createDateStringFromDate(formattedEndDate),
                filters: formattedFilterBarValues };
            const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

            if(!ignoreResults) {
                setDbHistoricalHoldings(postResultJSON);
            }
        }

        getDbHistoricalHoldings();
    
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