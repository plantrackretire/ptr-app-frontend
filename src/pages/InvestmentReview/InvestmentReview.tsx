import { Navbar } from '../../components/Navbar';
import { Networth } from './Networth';
import { AssetAllocation } from './AssetAllocation';
import { Performance } from './Performance';
import { useContext, useEffect, useState } from 'react';
import { getFilterBarValuesInit, formatFilterBarValuesForServer } from '../../components/FilterBar';
import { FilterBarTypes, IFilterBarValues } from '../../components/FilterBar/FilterBarDeclarations';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { IAccount } from '../../components/AccountView';
import { createDateFromDayValue, createDateStringFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../../utils/dates';
import { fetchData, getUserToken } from '../../utils/general';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { IHolding } from '../../components/HoldingView';
import { ModalType, useModalContext } from '../../providers/Modal';
import { PiggyBankIcon } from '../../assets/PiggyBankIcon';
import { PieChartIcon } from '../../assets/PieChartIcon';
import { INavItem } from '../../components/Navlist';
import { PerformanceChartIcon } from '../../assets/PerformanceChartIcon';
import { isEqual } from 'lodash-es';
import './InvestmentReview.css';


export enum InvestmentReviewSubPageType {
  networth,
  assetallocation,
  performance,
  transactions,
};

export const InvestmentReview: React.FC = () => {
    const [subPage, setSubPage] = useState<InvestmentReviewSubPageType>(InvestmentReviewSubPageType.networth);
    const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(getFilterBarValuesInit(FilterBarTypes.investmentReview));
    const [dbHoldings, setDbHoldings] = useState<[] | null>(null);
    const [dbAccounts, setDbAccounts] = useState<{[index: number]: IAccount} | null>(null);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    // Execute queries to get data common across sub pages.  Using promise.all() to run concurrently, but waits for all to return.
    // If significant different in response time of queries, you can split each into their own useEffect call, which will allow them to execute
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

            const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

            const results = await Promise.all([
                fetchData(url, bodyHoldings, token),
            ]);
            if(results === null) {
                await modalContext.showModal(
                    ModalType.confirm,
                    'Error retreiving common sub page data, please try again.',
                );
                setDbHoldings([]);
                setDbAccounts({});
                return () => { ignoreResults = true };
            }
            const resultsHoldings = results[0];
            
            // Create javascript dates in holding objects
            updateHoldings(resultsHoldings.holdings);
            const accountMapping = createAccountMapping(resultsHoldings.accounts);
                    
            if(!ignoreResults) {
                setDbHoldings(resultsHoldings.holdings);
                setDbAccounts(accountMapping);
            }
        }

        getData();
    
        return () => { ignoreResults = true };
    }, [filterBarValues])

    const handleFilterBarValuesChange = (values: IFilterBarValues) => {
        if(!isEqual(values, filterBarValues)) {
            setDbHoldings(null);
            setDbAccounts(null);
            setFilterBarValues(values);
        }
    }

    const handleSubPageChange = (value: InvestmentReviewSubPageType) => {
        setSubPage(value);
    }

    // Set current page to active in nav list
    navItems.forEach(navItem => (navItem.value === subPage) ? navItem.isActive = true : navItem.isActive = false);

    return (
        <div className="content-with-nav">
            <Navbar 
                subPageItems={navItems}
                setSubPage={handleSubPageChange}
                filterBarType={FilterBarTypes.investmentReview}
                filterBarValues={filterBarValues}
                setFilterBarValues={handleFilterBarValuesChange}
            />
            { subPage === InvestmentReviewSubPageType.networth &&
                <Networth 
                    filterBarValues={filterBarValues} 
                    dbHoldings={dbHoldings}
                    dbAccounts={dbAccounts}
                />
            }
            { subPage === InvestmentReviewSubPageType.assetallocation &&
                <AssetAllocation 
                    filterBarValues={filterBarValues} 
                    dbHoldings={dbHoldings}
                    dbAccounts={dbAccounts}
                />
            }
            { subPage === InvestmentReviewSubPageType.performance &&
                <Performance 
                    filterBarValues={filterBarValues} 
                    dbHoldings={dbHoldings}
                    dbAccounts={dbAccounts}
                />
            }
        </div>
    );
};

// Create date types and populate asset class id override (used to switch levels).
const updateHoldings = (holdings: IHolding[]) => {
    holdings.forEach((holding) => {
        holding.holdingDate = createLocalDateFromDateTimeString(holding.holdingDate as unknown as string)
        if('lastQuantityUpdateDate' in holding)
            holding.lastQuantityUpdateDate = createLocalDateFromDateTimeString(holding.lastQuantityUpdateDate! as unknown as string);
        if('lastPriceUpdateDate' in holding) {
            holding.lastPriceUpdateDate = createLocalDateFromDateTimeString(holding.lastPriceUpdateDate! as unknown as string);
        }
        if('startDatePositionDate' in holding)
            holding.startDatePositionDate = createLocalDateFromDateTimeString(holding.startDatePositionDate! as unknown as string);
        holding.overrideAssetClassId = holding.assetClassId;
    })
};

const createAccountMapping = (accountsArray: IAccount[]): {[index: number]: IAccount} => {
    const accountMapping: {[index: number]: IAccount} = {};

    accountsArray.forEach((account) => {
        (accountMapping as {[index: number]: IAccount})[account.accountId] = account;
    });

    return accountMapping;
};


const navItems: INavItem[] = [
    {
      icon: PiggyBankIcon,
      label: "Net Worth",
      value: InvestmentReviewSubPageType.networth,
      title: 'Net Worth',
    },
    {
      icon: PieChartIcon,
      label: "Asset Allocation",
      value: InvestmentReviewSubPageType.assetallocation,
      title: 'Asset Allocation',
    },
    {
      icon: PerformanceChartIcon,
      label: "Performance",
      value: InvestmentReviewSubPageType.performance,
      title: 'Performance',
    },
  ]