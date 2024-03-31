import { useContext, useEffect, useState } from 'react';
import { AccountView, IAccount } from '../../components/AccountView';
import { HoldingView, IHolding } from '../../components/HoldingView';
import { NetworthChart } from '../../components/NetworthChart';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import './Networth.css';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { createLocalDate, createLocalDateFromDateTimeString } from '../../utils/dates';


export const Networth: React.FC = () => {
    const [holdingsFilterType, setHoldingsFilterType] = useState<string>("All");
    const [holdingsFilterValue, setHoldingsFilterValue] = useState<string>("All");
    const [dbHoldings, setDbHoldings] = useState<[] | null>(null);
    const [dbAccounts, setDbAccounts] = useState<{[index: number]: IAccount} | null>(null);
    const [dbHistoricalHoldings, setDbHistoricalHoldings] = useState<{ [index: string]: [] } | null>(null);
    const appUserAttributes = useContext(AuthenticatorContext);
    const asOfDate = createLocalDate(2024,3,31);
    const startDate = createLocalDate(2024,1,1);

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        if(dbHoldings === null) {
          const getDbHoldings = async() => {
            console.log("Getting holdings");
            const url = PtrAppApiStack.PtrAppGetHoldingsApiEndpoint + "GetHoldings";
            const body = { userId: 7493728439, queryType: "asOf", startDate: "2024-01-01", endDate: "2024-02-29" };
            const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

            createDates(postResultJSON.holdings);
            const accountMapping = createAccountMapping(postResultJSON.accounts);
                    
            if(!ignoreResults) {
                console.log("Setting holdings");
                setDbHoldings(postResultJSON.holdings);
                setDbAccounts(accountMapping);
            }
          }
    
          getDbHoldings();
        }
    
        return () => { ignoreResults = true };
    }, [])
    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        if(dbHistoricalHoldings === null) {
          const getDbHistoricalHoldings = async() => {
            console.log("Getting historical holdings");
            const url = PtrAppApiStack.PtrAppGetHoldingsApiEndpoint + "GetHoldings";
            const body = { userId: 7493728439, queryType: "historical", startDate: "2011-12-31", endDate: "2024-02-29" };
            const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

            if(!ignoreResults) {
                console.log("Setting historical holdings");
                setDbHistoricalHoldings(postResultJSON);
            }
          }
    
          getDbHistoricalHoldings();
        }
    
        return () => { ignoreResults = true };
    }, [])
    
    let filteredHoldings: IHolding[] = [];
    if(!(holdingsFilterType === "All")) {
        if(dbHoldings)
            filteredHoldings = dbHoldings.filter((record) => 
                applyFilterToRecord(record, dbAccounts ? dbAccounts : {}, holdingsFilterType, holdingsFilterValue)
            );
        else
            filteredHoldings = [];
    } else {
        if(dbHoldings)
            filteredHoldings = dbHoldings;
    }

    let holdingsFilterScope = '';
    switch(holdingsFilterType) {
        case 'account': holdingsFilterScope = holdingsFilterValue; break;
        default: holdingsFilterScope = holdingsFilterValue + " Accounts"; break;
    }

    console.log(dbHistoricalHoldings);

    return (
        <div className='networth scrollable'>
            <div className='networth--main scrollable'>
                <NetworthChart 
                    labels={dbHistoricalHoldings ? dbHistoricalHoldings['labels'] : []} 
                    balances={dbHistoricalHoldings ? dbHistoricalHoldings['values'] : []} 
                />
                <AccountView 
                    startDate={startDate}
                    asOfDate={asOfDate}
                    accounts={dbAccounts ? dbAccounts : {}}
                    holdings={dbHoldings ? dbHoldings : []}
                    filterType={holdingsFilterType}
                    filterValue={holdingsFilterValue}
                    setFilterType={setHoldingsFilterType}
                    setFilterValue={setHoldingsFilterValue}
                />
            </div>
            <div className='networth--secondary scrollable'>
                <HoldingView startDate={startDate} asOfDate={asOfDate} holdings={filteredHoldings!} scope={holdingsFilterScope} />
            </div>
        </div>
    );
};

const fetchData = async (url: string, body: any, token: string) => {
    const postResult = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Authorization': token,
        }
    });
    const postResultJSON = await postResult.json();  
    return postResultJSON;      
}

const applyFilterToRecord = (record: IHolding, accounts: {[index: number]: IAccount}, holdingsFilterType: string, holdingsFilterValue: string) => {
    switch(holdingsFilterType) {
        case 'accountTypeCategory':
            return(accounts[record.accountId].accountTypeCategoryName === holdingsFilterValue);
        case 'account':
            return(record.accountName === holdingsFilterValue);
        default:
            // TODO: Throw exception
            console.log("INVALID holdingsFilterType");
        }
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



const holdings: IHolding[] = [
    {
        holdingId: 1,
        securityId: 1,
        securityShortName: "91279768",
        securityName: "6mo Tsy Bill 2024-03-07 5.487%",
        fullAssetClass: "Fixed Income -> US -> Treasuries -> Short Term",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 24832,
        holdingDate: new Date("2024-3-31"),
        quantity: 250.676,
        price: 99.06,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: .023,
    },
    {
        holdingId: 2,
        securityId: 2,
        securityShortName: "91279633",
        securityName: "6mo Tsy Bill 2024-04-18 5.394%",
        fullAssetClass: "Fixed Income -> US -> Treasuries -> Short Term",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 19691,
        holdingDate: new Date("2024-3-31"),
        quantity: 199.99,
        price: 98.46,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: -.018,
    },
    {
        holdingId: 12,
        securityId: 10,
        securityShortName: "GLDM",
        securityName: "SPDR Gold Minishares Trust ETF",
        fullAssetClass: "Commodities -> Gold",
        accountId: 6,
        accountName: "Dina's 401k",
        balance: 14253,
        holdingDate: new Date("2024-3-31"),
        quantity: 356.24,
        price: 40.01,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .035,
    },
    {
        holdingId: 3,
        securityId: 3,
        securityShortName: "AAPL",
        securityName: "Apple Inc.",
        fullAssetClass: "Equities -> US -> Large Cap",
        accountId: 4,
        accountName: "Dina's Investments",
        balance: 11000,
        holdingDate: new Date("2024-3-31"),
        quantity: 56.576,
        price: 194.43,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: .002,
    },
    {
        holdingId: 4,
        securityId: 4,
        securityShortName: "BTC",
        securityName: "Bitcoin",
        fullAssetClass: "Crypto -> Currency",
        accountId: 5,
        accountName: "Peter's Crypto",
        balance: 24250,
        holdingDate: new Date("2024-3-31"),
        quantity: .615,
        price: 39425.12,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: -.034,
    },
    {
        holdingId: 5,
        securityId: 5,
        securityShortName: "N/A",
        securityName: "Cash",
        fullAssetClass: "Cash Equivalent -> Checking/Savings",
        accountId: 1,
        accountName: "Peter's Savings",
        balance: 11000,
        holdingDate: new Date("2024-3-31"),
        quantity: 11000,
        price: 1,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: 0.0,
    },
    {
        holdingId: 6,
        securityId: 5,
        securityShortName: "N/A",
        securityName: "Cash",
        fullAssetClass: "Cash Equivalent -> Checking/Savings",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 152,
        holdingDate: new Date("2024-3-31"),
        quantity: 152,
        price: 1,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: 0.0,
    },
    {
        holdingId: 7,
        securityId: 5,
        securityShortName: "N/A",
        securityName: "Cash",
        fullAssetClass: "Cash Equivalent -> Checking/Savings",
        accountId: 3,
        accountName: "Joint Checking",
        balance: 12230,
        holdingDate: new Date("2024-3-31"),
        quantity: 12230,
        price: 1,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: -.061,
    },
    {
        holdingId: 8,
        securityId: 6,
        securityShortName: "N/A",
        securityName: "Freshbooks Inc.",
        fullAssetClass: "Private Investment -> Private Equity -> Direct",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 20000,
        holdingDate: new Date("2024-3-31"),
        quantity: 20000,
        price: 1,
        lastQuantityUpdateDate: new Date("2022-8-31"),
        lastPriceUpdateDate: new Date("2022-8-31"),
        changeInValue: 0.0,
    },
    {
        holdingId: 9,
        securityId: 7,
        securityShortName: "MSFT",
        securityName: "Microsoft Corporation",
        fullAssetClass: "Equities -> US -> Large Cap",
        accountId: 4,
        accountName: "Dina's Investments",
        balance: 21250,
        holdingDate: new Date("2024-3-31"),
        quantity: 52.5,
        price: 404.75,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: .012,
    },
    {
        holdingId: 10,
        securityId: 8,
        securityShortName: "O",
        securityName: "Realty Income Corporation",
        fullAssetClass: "Equities -> US -> REIT",
        accountId: 6,
        accountName: "Dina's 401k",
        balance: 8210,
        holdingDate: new Date("2024-3-31"),
        quantity: 148.52,
        price: 55.28,
        lastQuantityUpdateDate: new Date("2024-3-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: .029,
    },
    {
        holdingId: 11,
        securityId: 9,
        securityShortName: "N/A",
        securityName: "Spartan Self Storage Debt Fund",
        fullAssetClass: "Private Investment  -> Real Estate -> Self Storage",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 100000,
        holdingDate: new Date("2024-3-31"),
        quantity: 100000,
        price: 1,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .045,
    },
    {
        holdingId: 13,
        securityId: 10,
        securityShortName: "GLDM",
        securityName: "SPDR Gold Minishares Trust ETF",
        fullAssetClass: "Commodities -> Gold",
        accountId: 7,
        accountName: "Peter's IRA",
        balance: 45980,
        holdingDate: new Date("2024-3-31"),
        quantity: 1149.21,
        price: 40.01,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: -.002,
    },
    {
        holdingId: 14,
        securityId: 11,
        securityShortName: "N/A",
        securityName: "Sunrise MHP Fund III",
        fullAssetClass: "Private Investment -> Real Estate -> MHP",
        accountId: 2,
        accountName: "Peter's Investments",
        balance: 50000,
        holdingDate: new Date("2024-3-31"),
        quantity: 50000,
        price: 1,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2024-3-31"),
        changeInValue: .065,
    },
    {
        holdingId: 15,
        securityId: 12,
        securityShortName: "VGLT",
        securityName: "Vanguard Long Term Treasury ETF",
        fullAssetClass: "Fixed Income -> US -> Treasuries -> Long Term",
        accountId: 7,
        accountName: "Peter's IRA",
        balance: 32154,
        holdingDate: new Date("2024-3-31"),
        quantity: 546.28,
        price: 58.86,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: -.037,
    },
    {
        holdingId: 16,
        securityId: 13,
        securityShortName: "VIOV",
        securityName: "Vanguard S&P Small Cap 600 Value",
        fullAssetClass: "Equities -> US -> Small Cap -> Value",
        accountId: 6,
        accountName: "Dina's 401k",
        balance: 23344,
        holdingDate: new Date("2024-3-31"),
        quantity: 270.84,
        price: 86.19,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .082,
    },
    {
        holdingId: 17,
        securityId: 13,
        securityShortName: "VIOV",
        securityName: "Vanguard S&P Small Cap 600 Value",
        fullAssetClass: "Equities -> US -> Small Cap -> Value",
        accountId: 7,
        accountName: "Peter's IRA",
        balance: 11901,
        holdingDate: new Date("2024-3-31"),
        quantity: 138.08,
        price: 86.19,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: -.047,
    },
    {
        holdingId: 18,
        securityId: 13,
        securityShortName: "VIOV",
        securityName: "Vanguard S&P Small Cap 600 Value",
        fullAssetClass: "Equities -> US -> Small Cap -> Value",
        accountId: 8,
        accountName: "Dina's Roth 401k",
        balance: 43250,
        holdingDate: new Date("2024-3-31"),
        quantity: 501.8,
        price: 86.19,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .022,
    },
    {
        holdingId: 19,
        securityId: 13,
        securityShortName: "VIOV",
        securityName: "Vanguard S&P Small Cap 600 Value",
        fullAssetClass: "Equities -> US -> Small Cap -> Value",
        accountId: 9,
        accountName: "Peter's Roth IRA",
        balance: 75120,
        holdingDate: new Date("2024-3-31"),
        quantity: 871.56,
        price: 86.19,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .033,
    },
    {
        holdingId: 20,
        securityId: 14,
        securityShortName: "VTI",
        securityName: "Vanguard Total Stock market ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 4,
        accountName: "Dina's Investments",
        balance: 12000,
        holdingDate: new Date("2024-3-31"),
        quantity: 49.42,
        price: 242.84,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .098,
    },
    {
        holdingId: 21,
        securityId: 14,
        securityShortName: "VTI",
        securityName: "Vanguard Total Stock market ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 7,
        accountName: "Peter's IRA",
        balance: 22383,
        holdingDate: new Date("2024-3-31"),
        quantity: 92.17,
        price: 242.84,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .0011,
    },
    {
        holdingId: 22,
        securityId: 14,
        securityShortName: "VTI",
        securityName: "Vanguard Total Stock market ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 8,
        accountName: "Dina's Roth 401k",
        balance: 73229,
        holdingDate: new Date("2024-3-31"),
        quantity: 301.55,
        price: 242.84,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .045,
    },
    {
        holdingId: 23,
        securityId: 14,
        securityShortName: "VTI",
        securityName: "Vanguard Total Stock market ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 9,
        accountName: "Peter's Roth IRA",
        balance: 104899,
        holdingDate: new Date("2024-3-31"),
        quantity: 431.97,
        price: 242.84,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .076,
    },
    {
        holdingId: 24,
        securityId: 15,
        securityShortName: "VB",
        securityName: "Vanguard Small-Cap ETF",
        fullAssetClass: "Equities -> US -> Small Cap -> Blend",
        accountId: 6,
        accountName: "Dina's 401k",
        balance: 14331,
        holdingDate: new Date("2024-3-31"),
        quantity: 67.95,
        price: 210.89,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .023,
    },
    {
        holdingId: 25,
        securityId: 16,
        securityShortName: "VXUS",
        securityName: "Vanguard Total International Stock ETF",
        fullAssetClass: "Equities -> Int'l -> Large Cap -> Blend",
        accountId: 7,
        accountName: "Peter's IRA",
        balance: 51231,
        holdingDate: new Date("2024-3-31"),
        quantity: 866.41,
        price: 59.13,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .32,
    },
    {
        holdingId: 26,
        securityId: 17,
        securityShortName: "VOO",
        securityName: "Vanguard S&P 500 ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 8,
        accountName: "Dina's Roth 401k",
        balance: 10232,
        holdingDate: new Date("2024-3-31"),
        quantity: 21.73,
        price: 470.83,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .063,
    },
    {
        holdingId: 27,
        securityId: 17,
        securityShortName: "VOO",
        securityName: "Vanguard S&P 500 ETF",
        fullAssetClass: "Equities -> US -> Large Cap -> Blend",
        accountId: 9,
        accountName: "Peter's Roth IRA",
        balance: 43200,
        holdingDate: new Date("2024-3-31"),
        quantity: 91.75,
        price: 470.83,
        lastQuantityUpdateDate: new Date("2023-12-31"),
        lastPriceUpdateDate: new Date("2023-12-31"),
        changeInValue: .102,
    },
];

const accounts: { [index: string]: IAccount } = {
    "1": {
        accountId: 1,
        accountTypeCategoryName: 'Taxable',
        accountTypeId: 1,
        accountTypeName: "Money Market",
        accountCustodian: "Capital One",
        accountName: "Peter's Savings",
    },
    "2": {
        accountId: 2,
        accountTypeCategoryName: 'Taxable',
        accountTypeId: 2,
        accountTypeName: "Brokerage",
        accountCustodian: "Charles Schwab",
        accountName: "Peter's Investments",
    },
    "3": {
        accountId: 3,
        accountTypeCategoryName: 'Taxable',
        accountTypeId: 3,
        accountTypeName: "Checking",
        accountCustodian: "Chase Bank",
        accountName: "Joint Checking",
    },
    "4": {
        accountId: 4,
        accountTypeCategoryName: 'Taxable',
        accountTypeId: 2,
        accountTypeName: "Brokerage",
        accountCustodian: "Fidelity",
        accountName: "Dina's Investments",
    },
    "5": {
        accountId: 5,
        accountTypeCategoryName: 'Taxable',
        accountTypeId: 2,
        accountTypeName: "Brokerage",
        accountCustodian: "Coinbase",
        accountName: "Peter's Crypto",
    },
    "6": {
        accountId: 6,
        accountTypeCategoryName: 'Tax Deferred',
        accountTypeId: 4,
        accountTypeName: "Solo 401k",
        accountCustodian: "Fidelity",
        accountName: "Dina's 401k",
    },
    "7": {
        accountId: 7,
        accountTypeCategoryName: 'Tax Deferred',
        accountTypeId: 5,
        accountTypeName: "Rollover IRA",
        accountCustodian: "Fidelity",
        accountName: "Peter's IRA",
    },
    "8": {
        accountId: 8,
        accountTypeCategoryName: 'Tax Exempt',
        accountTypeId: 6,
        accountTypeName: "Roth 401k",
        accountCustodian: "Empower",
        accountName: "Dina's Roth 401k",
    },
    "9": {
        accountId: 9,
        accountTypeCategoryName: 'Tax Exempt',
        accountTypeId: 7,
        accountTypeName: "Roth IRA",
        accountCustodian: "Fidelity",
        accountName: "Peter's Roth IRA",
    },
}

const labels = [
    "2000-12-31",
    "2001-12-31",
    "2002-12-31",
    "2003-12-31",
    "2004-12-31",
    "2005-12-31",
    "2006-12-31",
    "2007-12-31",
    "2008-12-31",
    "2009-12-31",
    "2010-12-31",
    "2011-12-31",
    "2012-12-31",
    "2013-12-31",
    "2014-1-31",
    "2014-2-28",
    "2014-3-31",
    "2014-4-30",
    "2014-5-31",
    "2014-6-30",
    "2014-7-31",
    "2014-8-31",
    "2014-9-30",
    "2014-10-31",
    "2014-11-30",
    "2014-12-31",
    "2015-1-31",
    "2015-2-28",
    "2015-3-31",
    "2015-4-30",
    "2015-5-31",
    "2015-6-30",
    "2015-7-31",
    "2015-8-31",
    "2015-9-30",
    "2015-10-31",
    "2015-11-30",
    "2015-12-31",
    "2016-1-31",
    "2016-2-29",
    "2016-3-31",
    "2016-4-30",
    "2016-5-31",
    "2016-6-30",
    "2016-7-31",
    "2016-8-31",
    "2016-9-30",
    "2016-10-31",
    "2016-11-30",
    "2016-12-31",
    "2017-1-31",
    "2017-2-28",
    "2017-3-31",
    "2017-4-30",
    "2017-5-31",
    "2017-6-30",
    "2017-7-31",
    "2017-8-31",
    "2017-9-30",
    "2017-10-31",
    "2017-11-30",
    "2017-12-31",
    "2018-1-31",
    "2018-2-28",
    "2018-3-31",
    "2018-4-30",
    "2018-5-31",
    "2018-6-30",
    "2018-7-31",
    "2018-8-31",
    "2018-9-30",
    "2018-10-31",
    "2018-11-30",
    "2018-12-31",
    "2019-1-31",
    "2019-2-28",
    "2019-3-31",
    "2019-4-30",
    "2019-5-31",
    "2019-6-30",
    "2019-7-31",
    "2019-8-31",
    "2019-9-30",
    "2019-10-31",
    "2019-11-30",
    "2019-12-31",
    "2020-1-31",
    "2020-2-29",
    "2020-3-31",
    "2020-4-30",
    "2020-5-31",
    "2020-6-30",
    "2020-7-31",
    "2020-8-31",
    "2020-9-30",
    "2020-10-31",
    "2020-11-30",
    "2020-12-31",
    "2021-1-31",
    "2021-2-28",
    "2021-3-31",
    "2021-4-30",
    "2021-5-31",
    "2021-6-30",
    "2021-7-31",
    "2021-8-31",
    "2021-9-30",
    "2021-10-31",
    "2021-11-30",
    "2021-12-31",
    "2022-1-31",
    "2022-2-28",
    "2022-3-31",
    "2022-4-30",
    "2022-5-31",
    "2022-6-30",
    "2022-7-31",
    "2022-8-31",
    "2022-9-30",
    "2022-10-31",
    "2022-11-30",
    "2022-12-31",
    "2023-1-31",
    "2023-2-28",
    "2023-3-31",
    "2023-4-30",
    "2023-5-31",
    "2023-6-30",
    "2023-7-31",
    "2023-8-31",
    "2023-9-30",
    "2023-10-31",
    "2023-11-30",
    "2023-12-31",
    "2024-1-31",
    "2024-2-29",
    "2024-3-31",
  ];
  
  const balances = [
    40000,
    44000,
    -25000,
    50000,
    65000,
    60000,
    90000,
    100000,
    100000,
    150000,
    200000,
    175000,
    300000,
    329900,
    333207,
    337373,
    340455,
    343274,
    343536,
    350667,
    353838,
    357325,
    362625,
    359530,
    363959,
    367218,
    367746,
    370418,
    373412,
    379846,
    381629,
    381509,
    386157,
    389887,
    393319,
    392514,
    396291,
    399436,
    402932,
    399736,
    406232,
    408081,
    408235,
    411789,
    416397,
    420007,
    423990,
    429063,
    431327,
    424972,
    427930,
    435539,
    441453,
    444126,
    447920,
    446514,
    448836,
    451165,
    464405,
    472979,
    473418,
    472673,
    480203,
    478635,
    485451,
    491948,
    498111,
    502680,
    508121,
    512342,
    508052,
    513119,
    517373,
    522518,
    528141,
    531175,
    536878,
    541738,
    540765,
    547006,
    556045,
    560585,
    565623,
    571169,
    571051,
    577595,
    580835,
    585540,
    591253,
    596028,
    599345,
    608669,
    615082,
    617453,
    616742,
    618604,
    623045,
    629071,
    633050,
    638631,
    645850,
    650989,
    656705,
    652613,
    656166,
    664654,
    674350,
    674621,
    681076,
    687018,
    694721,
    699607,
    708602,
    715341,
    721539,
    727183,
    724986,
    733069,
    740012,
    746395,
    752826,
    758051,
    772150,
    784566,
    790630,
    786192,
    793577,
    799701,
    805866,
    816101,
    827135,
    833483,
    833622,
    841402,
    847845,
    847872,
    999999,
];
  