import { Fragment, useContext, useEffect, useState } from 'react';
import { AccountView, IAccount, IAccountGroupCategoryValues, IAccountViewColumns } from '../../../components/AccountView';
import { HoldingView, HoldingsFilterTypes, IHolding, IHoldingViewColumns, IHoldingsFilter, calcHoldingsTotals, holdingsFilterAll } from '../../../components/HoldingView';
import { createDateFromDayValue, createDateStringFromDate, getBeginningOfYear, getPriorMonthEnd } from '../../../utils/dates';
import { formatFilterBarValuesForServer, isCashFilteredWithSubsetOfAssets } from '../../../components/FilterBar';
import { IFilterBarValues, IServerFilterValues } from '../../../components/FilterBar/FilterBarDeclarations';
import { fetchData, getUserToken } from '../../../utils/general';
import { AuthenticatorContext, IAuthenticatorContext } from '../../../providers/AppAuthenticatorProvider';
import { PtrAppApiStack } from '../../../../../ptr-app-backend/cdk-outputs.json';
import { ModalContextType, ModalType, useModalContext } from '../../../providers/Modal';
import { PerformanceCharts } from './PerformanceCharts';
import { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import './Performance.css';


interface IPerformance {
  filterBarValues: IFilterBarValues,
  dbHoldings: IHolding[] | null,
  dbAccounts: {[index: number]: IAccount} | null,
}

export interface IReturn {
  id: string,
  xirr: number,
  calcType: string,
  startDate: string,
  endDate: string,
  status: string,
}

export const Performance: React.FC<IPerformance> = ({ filterBarValues, dbHoldings, dbAccounts }) => {
    const [dbAggregateReturns, setDbAggregateReturns] = useState<{ [index: string]: { [index: string]: IReturn } } | null>(null);
    const [loadAggregateReturns, setLoadAggregateReturns] = useState<boolean>(false);
    const [dbAccountReturns, setDbAccountReturns] = useState<{ [index: string]: { [index: string]: IReturn } } | null>(null);
    const [loadAccountReturns, setLoadAccountReturns] = useState<boolean>(false);
    const [dbAssetReturns, setDbAssetReturns] = useState<{ [index: string]: { [index: string]: IReturn } } | null>(null);
    const [loadAssetReturns, setLoadAssetReturns] = useState<boolean>(false);
    const [holdingsFilters, setHoldingsFilters] = useState<IHoldingsFilter[]>([holdingsFilterAll]);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    // Use boolean to trigger loading of data instead of doing it directly in useEffect so we can set data to null first to show placeholders.
    useEffect(() => {
        setLoadAggregateReturns(true);
        setLoadAccountReturns(true);

        setDbAggregateReturns(null);
        setDbAccountReturns(null);
    }, [filterBarValues])

    // Use boolean to trigger loading of data instead of doing it directly in useEffect so we can set data to null first to show placeholders.
    useEffect(() => {
        setLoadAssetReturns(true);

        setDbAssetReturns(null);
    }, [filterBarValues, holdingsFilters])

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;
        if(!loadAggregateReturns) {
            return () => { ignoreResults = true };
        }

        const getData = async() => {
          const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
          const returns = await getDataFromApi("aggregates", appUserAttributes!, filterBarValues.asOfDate, formattedFilterBarValues, modalContext);
          // const returns = tmpAggregateReturns; // Test data

          if(!ignoreResults) {
            setLoadAggregateReturns(false);
            setDbAggregateReturns(returns);
          }
        }

        getData();
    
        return () => { ignoreResults = true };
    }, [loadAggregateReturns])

    useEffect(() => {
      // This avoids race conditions by ignoring results from stale calls
      let ignoreResults = false;
      if(!loadAccountReturns) {
          return () => { ignoreResults = true };
      }

      const getData = async() => {
        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const returns = await getDataFromApi("accounts", appUserAttributes!, filterBarValues.asOfDate, formattedFilterBarValues, modalContext);
        // const returns = tmpAccountsReturns; // Test data
        
        if(!ignoreResults) {
          setLoadAccountReturns(false);
          setDbAccountReturns(returns);
        }
      }

      getData();
  
      return () => { ignoreResults = true };
    }, [loadAccountReturns])

    useEffect(() => {
      // This avoids race conditions by ignoring results from stale calls
      let ignoreResults = false;
      if(!loadAssetReturns) {
          return () => { ignoreResults = true };
      }

      const getData = async() => {
        const mergedFilterBarValues: IFilterBarValues = mergeInHoldingFilters(filterBarValues, holdingsFilters);
        const formattedFilterBarValues = formatFilterBarValuesForServer(mergedFilterBarValues);

        const returns = await getDataFromApi("assets", appUserAttributes!, filterBarValues.asOfDate, formattedFilterBarValues, modalContext);
        // const returns = tmpAssetsReturns; // Test data
        
        if(!ignoreResults) {
          setLoadAssetReturns(false);
          setDbAssetReturns(returns);
        }
      }

      getData();
  
      return () => { ignoreResults = true };
    }, [loadAssetReturns])

    // If holdings filter results in zero record and we do have holdings, then revert to 'All' filter.
    const handleZeroFilterResults = () => {
        if(dbHoldings && dbHoldings.length > 0) {
            setHoldingsFilters([holdingsFilterAll]);
        }
    }

    // Used to determine how accounts are grouped in the account view.
    const getAccountGroupValues = (_holding: IHolding, account: IAccount): IAccountGroupCategoryValues => {
      return {
          accountGroupCategoryType: 'accountTypeCategories',
          accountGroupCategoryId: account.accountTypeCategoryId,
          accountGroupCategoryName: account.accountTypeCategoryName,
          accountGroupCategoryFilterValue: [account.accountTypeCategoryId],
      };
    }

    // Use dbHoldings to denote data loading and placeholders should be displayed.
    let holdings: IHolding[] | null = dbHoldings;
    let aggregateReturns: { [index: string]: { [index: string]: IReturn } } | null = dbAggregateReturns;

    if(holdings !== null && holdings.length === 0) {
      return <div className="no-data-found"><h1>No data found, please adjust your filters.</h1></div>;
    }

    // Calc total holdings and change from start date for title.
    let total = null;
    if(holdings !== null) {
      const totals = calcHoldingsTotals(holdings, false);
      total = totals.endTotal;
    }

    // startDate used in account and holdings views to get starting value to calc change in value
    const asOfDate = createDateFromDayValue(filterBarValues.asOfDate);
    const startDate = getBeginningOfYear(asOfDate);

    const accountViewColumns: IAccountViewColumns = {
      value: true,
      ytdReturn: true,
      costBasis: true,
      unrealizedGain: true,
    };

    const holdingViewColumns: IHoldingViewColumns = {
      balance: true,
      ytdChangeUnderBalance: true,
      ytdReturn: true,
      costBasis: true,
      unrealizedGain: true,
    };

    const filteredOnCashWithoutAllAssets = isCashFilteredWithSubsetOfAssets(filterBarValues);

    return (
      <Fragment>
        { 
        filteredOnCashWithoutAllAssets ? 
        <div className="no-data-found">
          <h2>Returns cannot be calculated when filtering on Cash or Cash Equivalents asset classes/assets.  Please clear or choose a different filter.</h2>
        </div> 
        :
        <div className='content-two-col scrollable'>
            <div className='content-two-col--col scrollable'>
                <PerformanceCharts
                  returns={aggregateReturns}
                  totalValue={total}
                />
                <AccountView
                    title="Accounts by Account Type"
                    columns={accountViewColumns}
                    startDate={startDate}
                    asOfDate={asOfDate}
                    accounts={dbAccounts}
                    holdings={holdings}
                    getAccountGroupValues={getAccountGroupValues}
                    accountGroupCategoryFilterType={HoldingsFilterTypes.accountTypeCategory}
                    holdingsFilters={holdingsFilters}
                    setHoldingsFilters={setHoldingsFilters}
                    returns={dbAccountReturns}
                />
            </div>
            <div className='content-two-col--col scrollable'>
                <HoldingView 
                    columns={holdingViewColumns}
                    includeSubRows={false}
                    startDate={startDate} 
                    asOfDate={asOfDate} 
                    holdings={holdings}
                    accounts={dbAccounts} 
                    filters={holdingsFilters}
                    filterBarValues={filterBarValues}
                    handleZeroFilterResults={handleZeroFilterResults}
                    returns={dbAssetReturns}
                />
            </div>
        </div>
        }
      </Fragment>
    );
};

const getDataFromApi = async(queryType: string, appUserAttributes: IAuthenticatorContext, endDate: DayValue, filterBarValues: IServerFilterValues, modalContext: ModalContextType):
  Promise<{ [index: string]: { [index: string]: IReturn } }> => {
  const url = PtrAppApiStack.PtrAppApiEndpoint + "CalcReturns";
  
  const callBody = { 
    userId: appUserAttributes!.userId, 
    queryType: queryType, 
    endDate: createDateStringFromDate(getPriorMonthEnd(createDateFromDayValue(endDate))), 
    filters: filterBarValues, 
  };

  const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

  const results = await Promise.all([
      fetchData(url, callBody, token),
  ]);
  if(results === null || results.length <= 0) {
      await modalContext.showModal(
          ModalType.confirm,
          'Error retreiving ' + queryType + ' page data, please try again.',
      );
      return {};
  }

  const returns = results[0];
  
  return returns;
}

const mergeInHoldingFilters = (filterBarValues: IFilterBarValues, holdingsFilters: IHoldingsFilter[]) => {
  const mergedFilterBarValues: IFilterBarValues = {...filterBarValues};
  holdingsFilters.forEach(holdingFilter => {
    switch(holdingFilter.type) {
      case HoldingsFilterTypes.accountTypeCategory:
        mergedFilterBarValues.accountTypes = [{ value: holdingFilter.id, label: holdingFilter.label, level: 0, filter: holdingFilter.id as any }];
        break;
      case HoldingsFilterTypes.assetClass:
        // TODO: NEED TO IMPLEMENT - filter value includes all children, but if selecting an asset class above the actual asset class then the filters need to be applied.
        break;
      case HoldingsFilterTypes.account:
        mergedFilterBarValues.accountTypes = [];
        mergedFilterBarValues.accounts = [{ value: holdingFilter.id, label: holdingFilter.label, level: 0, filter: holdingFilter.id as any }];
        break;
      case HoldingsFilterTypes.all:
          return true;
      default:
          // TODO: Throw exception
          console.log("INVALID filterType in mergeInHoldingFilters");
          break;
    }
  });

  return mergedFilterBarValues;
}


// const tmpAggregateReturns = {
//   multiYear: {
//     oneYear: {
//       id: "oneYear",
//       xirr: 0.06315582213849025,
//       calcType: "annual",
//       startDate: "2023-07-01",
//       endDate: "2024-06-30",
//       status: "",
//     },
//     threeYears: {
//       id: "threeYears",
//       xirr: 0.014704562230131168,
//       calcType: "annual",
//       startDate: "2021-07-01",
//       endDate: "2024-06-30",
//       status: "",
//     },
//     fiveYears: {
//       id: "fiveYears",
//       xirr: 0.05676735199004135,
//       calcType: "annual",
//       startDate: "2019-07-01",
//       endDate: "2024-06-30",
//       status: "",
//     },
//     tenYears: {
//       id: "tenYears",
//       xirr: 0.06471958949042622,
//       calcType: "annual",
//       startDate: "2014-07-01",
//       endDate: "2024-06-30",
//       status: "",
//     },
//     maxYears: {
//       id: "maxYears",
//       xirr: 0.07394871183283791,
//       calcType: "annual",
//       startDate: "2011-12-31",
//       endDate: "2024-06-30",
//       status: "",
//     },
//   },
//   yearly: {
//     "2012": {
//       id: "2012",
//       xirr: 0.13230436880468321,
//       calcType: "total",
//       startDate: "2012-01-01",
//       endDate: "2012-12-31",
//       status: "",
//     },
//     "2013": {
//       id: "2013",
//       xirr: 0.17741201706832155,
//       calcType: "total",
//       startDate: "2013-01-01",
//       endDate: "2013-12-31",
//       status: "",
//     },
//     "2014": {
//       id: "2014",
//       xirr: 0.08536610699877634,
//       calcType: "total",
//       startDate: "2014-01-01",
//       endDate: "2014-12-31",
//       status: "",
//     },
//     "2015": {
//       id: "2015",
//       xirr: -0.013945700786718085,
//       calcType: "total",
//       startDate: "2015-01-01",
//       endDate: "2015-12-31",
//       status: "",
//     },
//     "2016": {
//       id: "2016",
//       xirr: 0.11982690277507402,
//       calcType: "total",
//       startDate: "2016-01-01",
//       endDate: "2016-12-31",
//       status: "",
//     },
//     "2017": {
//       id: "2017",
//       xirr: 0.1629898779778851,
//       calcType: "total",
//       startDate: "2017-01-01",
//       endDate: "2017-12-31",
//       status: "",
//     },
//     "2018": {
//       id: "2018",
//       xirr: -0.05786651050447955,
//       calcType: "total",
//       startDate: "2018-01-01",
//       endDate: "2018-12-31",
//       status: "",
//     },
//     "2019": {
//       id: "2019",
//       xirr: 0.1841966813742797,
//       calcType: "total",
//       startDate: "2019-01-01",
//       endDate: "2019-12-31",
//       status: "",
//     },
//     "2020": {
//       id: "2020",
//       xirr: 0.10407143635574068,
//       calcType: "total",
//       startDate: "2020-01-01",
//       endDate: "2020-12-31",
//       status: "",
//     },
//     "2021": {
//       id: "2021",
//       xirr: 0.23127219742799499,
//       calcType: "total",
//       startDate: "2021-01-01",
//       endDate: "2021-12-31",
//       status: "",
//     },
//     "2022": {
//       id: "2022",
//       xirr: -0.12465914771156306,
//       calcType: "total",
//       startDate: "2022-01-01",
//       endDate: "2022-12-31",
//       status: "",
//     },
//     "2023": {
//       id: "2023",
//       xirr: -0.005350700286015919,
//       calcType: "total",
//       startDate: "2023-01-01",
//       endDate: "2023-12-31",
//       status: "",
//     },
//     "2024": {
//       id: "2024",
//       xirr: 0.058443673097707594,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-06-30",
//       status: "",
//     },
//   },
// };

// const tmpAccountsReturns =
// {
//   accounts: {
//     "3": {
//       id: "3",
//       xirr: 0.5004354899094356,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "12": {
//       id: "12",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "14": {
//       id: "14",
//       xirr: 0.04853811617707349,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "19": {
//       id: "19",
//       xirr: -0.01316455894308921,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "20": {
//       id: "20",
//       xirr: 0.01786935537714518,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "25": {
//       id: "25",
//       xirr: 0.1268604062001697,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "26": {
//       id: "26",
//       xirr: 0.00768589171204348,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "27": {
//       id: "27",
//       xirr: 0.024512983839060976,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "28": {
//       id: "28",
//       xirr: 0.06200573398116882,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "29": {
//       id: "29",
//       xirr: 0.3731311396549566,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "30": {
//       id: "30",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "31": {
//       id: "31",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "32": {
//       id: "32",
//       xirr: 0.11343965381513477,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "33": {
//       id: "33",
//       xirr: 0.028301910517134043,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "34": {
//       id: "34",
//       xirr: 0.017560462482834494,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "36": {
//       id: "36",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "37": {
//       id: "37",
//       xirr: 0.027462632267970966,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "38": {
//       id: "38",
//       xirr: 0.0267288805004271,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "39": {
//       id: "39",
//       xirr: 0.020732926799184925,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "40": {
//       id: "40",
//       xirr: 0.019112173780316377,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "41": {
//       id: "41",
//       xirr: 0.019112173780316377,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "42": {
//       id: "42",
//       xirr: 0.011002766900712002,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "44": {
//       id: "44",
//       xirr: 0.03747152281059973,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "45": {
//       id: "45",
//       xirr: 0.04434729768902379,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "46": {
//       id: "46",
//       xirr: 0.022184908024210914,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "48": {
//       id: "48",
//       xirr: -0.052617016212903156,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "49": {
//       id: "49",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-09",
//       endDate: "2024-07-29",
//       status: "",
//     },
//   },
//   accountTypeCategories: {
//     "1001": {
//       id: "1001",
//       xirr: 0.08304795161238387,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "1002": {
//       id: "1002",
//       xirr: 0.026610779107847593,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "1003": {
//       id: "1003",
//       xirr: 0.020890945917953152,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//   },
// }

// const tmpAssetsReturns = 
// {
//   assets: {
//     "19": {
//       id: "19",
//       xirr: 0.5004354899094356,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "22": {
//       id: "22",
//       xirr: 0.027962010125431425,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "28": {
//       id: "28",
//       xirr: 0.1268604062001697,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "30": {
//       id: "30",
//       xirr: -0.02218587639345837,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "33": {
//       id: "33",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "34": {
//       id: "34",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "35": {
//       id: "35",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "46": {
//       id: "46",
//       xirr: 0,
//       calcType: "total",
//       startDate: "",
//       endDate: "",
//       status: "ID",
//     },
//     "47": {
//       id: "47",
//       xirr: 0,
//       calcType: "total",
//       startDate: "",
//       endDate: "",
//       status: "ID",
//     },
//     "48": {
//       id: "48",
//       xirr: 0.03755671666116989,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "60": {
//       id: "60",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "62": {
//       id: "62",
//       xirr: 0,
//       calcType: "total",
//       startDate: "",
//       endDate: "",
//       status: "ID",
//     },
//     "65": {
//       id: "65",
//       xirr: 0.01786935537714518,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "70": {
//       id: "70",
//       xirr: 0.033666949270206636,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "71": {
//       id: "71",
//       xirr: 0,
//       calcType: "total",
//       startDate: "",
//       endDate: "",
//       status: "ID",
//     },
//     "72": {
//       id: "72",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "88": {
//       id: "88",
//       xirr: 0.025420621131588383,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "92": {
//       id: "92",
//       xirr: 0.13674638050463228,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "95": {
//       id: "95",
//       xirr: -0.05261764940476621,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "96": {
//       id: "96",
//       xirr: -0.050897159015361515,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "97": {
//       id: "97",
//       xirr: 0.1270134535412175,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "100": {
//       id: "100",
//       xirr: 0.00768589171204348,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "101": {
//       id: "101",
//       xirr: 0.019112173780316377,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "111": {
//       id: "111",
//       xirr: 0.011002766900712002,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "114": {
//       id: "114",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "117": {
//       id: "117",
//       xirr: 0.03747152281059973,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "118": {
//       id: "118",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "122": {
//       id: "122",
//       xirr: 0.09116151423189645,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "136": {
//       id: "136",
//       xirr: 0.04654429335769361,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "142": {
//       id: "142",
//       xirr: 0.001442984782205059,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-01-11",
//       status: "",
//     },
//     "144": {
//       id: "144",
//       xirr: 0.005593345674223427,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-02-08",
//       status: "",
//     },
//     "145": {
//       id: "145",
//       xirr: 0.009633664546757625,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-03-07",
//       status: "",
//     },
//     "146": {
//       id: "146",
//       xirr: 0.01581806723012602,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-04-18",
//       status: "",
//     },
//     "147": {
//       id: "147",
//       xirr: 0.01875561291928518,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-05-09",
//       status: "",
//     },
//     "148": {
//       id: "148",
//       xirr: 0.01009021654913389,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "149": {
//       id: "149",
//       xirr: 0.02251351595739215,
//       calcType: "total",
//       startDate: "2024-01-01",
//       endDate: "2024-06-06",
//       status: "",
//     },
//     "150": {
//       id: "150",
//       xirr: 0.024717531446176055,
//       calcType: "total",
//       startDate: "2024-01-08",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "151": {
//       id: "151",
//       xirr: 0,
//       calcType: "total",
//       startDate: "2024-01-09",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "152": {
//       id: "152",
//       xirr: 0.020616413023035296,
//       calcType: "total",
//       startDate: "2024-02-05",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "153": {
//       id: "153",
//       xirr: 0.016815404759530583,
//       calcType: "total",
//       startDate: "2024-03-04",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "154": {
//       id: "154",
//       xirr: 0.010833876037487977,
//       calcType: "total",
//       startDate: "2024-04-15",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "155": {
//       id: "155",
//       xirr: 0.007825406091232834,
//       calcType: "total",
//       startDate: "2024-05-06",
//       endDate: "2024-07-29",
//       status: "",
//     },
//     "156": {
//       id: "156",
//       xirr: 0.003837143397636078,
//       calcType: "total",
//       startDate: "2024-06-03",
//       endDate: "2024-07-29",
//       status: "",
//     },
//   },
// }