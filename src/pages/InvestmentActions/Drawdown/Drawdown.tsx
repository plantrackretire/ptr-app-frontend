// import { testCashflows } from './TestCashflows';
// import { testStartBalances } from './TestStartBalances';
// import { testAccountReserves } from './TestAccountReserves';
import { useContext, useEffect, useState } from 'react';
import { createDateStringFromDate, createDateStringFromDayValue } from '../../../utils/dates';
import { formatFilterBarValuesForServer } from '../../../components/FilterBar';
import { IFilterBarValues } from '../../../components/FilterBar/FilterBarDeclarations';
import { PtrAppApiStack } from '../../../../../ptr-app-backend/cdk-outputs.json';
import { AuthenticatorContext } from '../../../providers/AppAuthenticatorProvider';
import { ModalType, useModalContext } from '../../../providers/Modal';
import { fetchData, getUserToken, isValueInEnum } from '../../../utils/general';
import { round } from 'lodash-es';
import { CashflowTable } from './CashflowTable';
import { CashflowStats } from './Cashflow Stats';
import { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import { TransactionView, TransactionViewTypes } from '../../../components/TransactionView';
import './Drawdown.css';

export enum CashflowCategories {
    deposits="Deposits",
    purchasesAndFees="Purchases and Fees",
    sales="Sales",
    withdrawals="Withdrawals",
    interest="Interest",
    dividends="Dividends",
    capitalGains="Capital Gains",
    distributions="Distributions",
    transfers="Transfers",
    none="None",
};

interface IDrawdown {
    filterBarValues: IFilterBarValues,
}

interface IStartBalance {
    effectiveDate: string,
    month: number,
    year: number,
    accountId: number,
    value: number,
    isActualValue?: boolean,
}

export interface ICashflow {
    month: number,
    year: number,
    accountId: number,
    accountName: string,
    cashflowCategory: string,
    isNotDrawdown?: boolean,
    amount: number,
}

export interface ICashflowMetrics {
    startingCashBalance: number,
    drawndown: number,
    activity: { [cashflowCategory: string]: number },
    endingCashBalance: number,
    reserve: number,
    isReserveActual: boolean,
    availableToDrawdown: number,
    scratchPad?: number,
}

export interface ICashflowTimeperiodGroup extends ICashflowMetrics {
    month: number,
    year: number,
    cashflowAccountGroups: { [account: number]: ICashflowAccountGroup },
}

export interface ICashflowAccountGroup extends ICashflowMetrics {
    accountId: number,
    accountName: string,
}

// At least one pair is required.
export interface IHandleCashflowActionButtonClick {
    startDate: DayValue, endDate: DayValue, accountId?: number, accountName?: string, cashflowCategory?: CashflowCategories,
};

  
export const Drawdown: React.FC<IDrawdown> = ({ filterBarValues }) => {
    const [dbCashflows, setDbCashflows] = useState<ICashflow[] | null>(null);
    const [dbStartBalances, setDbStartBalances] = useState<IStartBalance[] | null>(null);
    const [dbAccountReserves, setDbAccountReserves] = useState<IStartBalance[] | null>(null);
    const [loadDbAccountReserves, setLoadDbAccountReserves] = useState<boolean>(false);
    const [loadDbCashflows, setLoadDbCashflows] = useState<boolean>(false);
    const [dbTotalAssetsBoy, setDbTotalAssetsBoy] = useState<number | null>(null);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const year = filterBarValues.years ? filterBarValues.years[0].value : new Date().getFullYear();
        const formattedStartDate = new Date(year, 0, 1);
        const formattedEndDate = new Date(year, 11, 31);

        const getData = async() => {
            const url = PtrAppApiStack.PtrAppApiEndpoint + "GetCashflows";
            const bodyRequest = { userId: appUserAttributes!.userId, queryType: "cashflows", startDate: createDateStringFromDate(formattedStartDate),
                endDate: createDateStringFromDate(formattedEndDate),filters: formattedFilterBarValues };

            const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

            const results = await Promise.all([
                fetchData(url, bodyRequest, token),
            ]);
            if(results === null) {
                await modalContext.showModal(
                    ModalType.confirm,
                    'Error retreiving Drawdown Cashflows, please try again.',
                );
                setDbCashflows(null);
                setDbStartBalances(null);
                setDbAccountReserves(null);
                setLoadDbCashflows(false);
                return () => { ignoreResults = true };
            }
            const resultsCashflows = results[0].cashflows;
            const resultsStartBalances = results[0].startBalances;
            const resultsAccountReserves = results[0].accountReserves;
            const resultsTotalAssetsBoy = results[0].totalAssetsBoy;
            
            if(!ignoreResults) {
                setDbCashflows(resultsCashflows);
                setDbStartBalances(resultsStartBalances);
                setDbAccountReserves(resultsAccountReserves);
                setDbTotalAssetsBoy(resultsTotalAssetsBoy);
                setLoadDbCashflows(false);
            }
        }

        getData();

        // Test Data
        // setDbCashflows(testCashflows);
        // setDbStartBalances(testStartBalances);
        // setDbAccountReserves(testAccountReserves);
        // setDbTotalAssetsBoy(5459916);
    
        return () => { ignoreResults = true };
    }, [loadDbCashflows])

    useEffect(() => {
        setLoadDbCashflows(true);
        setDbCashflows(null);
    }, [filterBarValues])

    // This is to specifically load account reserves if a value was updated.
    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const formattedFilterBarValues = formatFilterBarValuesForServer(filterBarValues);
        const year = filterBarValues.years ? filterBarValues.years[0].value : new Date().getFullYear();
        const formattedStartDate = new Date(year, 0, 1);
        const formattedEndDate = new Date(year, 11, 31);

        const getData = async() => {
            const url = PtrAppApiStack.PtrAppApiEndpoint + "GetCashflows";
            const bodyRequest = { userId: appUserAttributes!.userId, queryType: "accountReserves", startDate: createDateStringFromDate(formattedStartDate),
                endDate: createDateStringFromDate(formattedEndDate),filters: formattedFilterBarValues };

            const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

            const results = await Promise.all([
                fetchData(url, bodyRequest, token),
            ]);
            if(results === null) {
                await modalContext.showModal(
                    ModalType.confirm,
                    'Error retreiving Drawdown Account Reserves, please try again.',
                );
                setDbAccountReserves(null);
                setLoadDbAccountReserves(false);
                return () => { ignoreResults = true };
            }
            const resultsAccountReserves = results[0].accountReserves;
            
            if(!ignoreResults) {
                setDbAccountReserves(resultsAccountReserves);
                setLoadDbAccountReserves(false);
            }
        }

        if(loadDbAccountReserves) {
            getData();

            // Test Data
            // setDbAccountReserves(testAccountReserves);
            // setLoadDbAccountReserves(false);
        }
    
        return () => { ignoreResults = true };
    }, [loadDbAccountReserves])

    const handleCashflowActionButtonClick = async({startDate, endDate, accountId, accountName, cashflowCategory}: IHandleCashflowActionButtonClick) => {
        const drilldownFilters = {...filterBarValues};
        drilldownFilters.startDate = startDate;
        drilldownFilters.asOfDate = endDate;
        const wereChangesMade = await modalContext.showModal(
          ModalType.noButtons,
          <TransactionView
            transactionViewType={TransactionViewTypes.transactionCategoryView}
            appUserAttributes={appUserAttributes!}
            filterBarValues={drilldownFilters}
            handleCloseWithContent={modalContext.closeWithContent}
            accountId={accountId ? accountId : undefined}
            accountName={accountName ? accountName : undefined}
            cashflowCategories={cashflowCategory ? [cashflowCategory] : undefined}
            freezeHeadings={true}
            maxHeight='80vh'
          />
        );

        if(wereChangesMade.content) {
            setLoadDbCashflows(true);
        }
    }

    const handleReserveAmountChange = async (accountId: number, month: number, year: number, value: number, handleValueSubmitResult: (result: string) => void) => {
        const effectiveDate = createDateStringFromDayValue({ year: year, month: month, day: 1 });
        const url = PtrAppApiStack.PtrAppApiEndpoint + "GetCashflows";
        const bodyRequest = { userId: appUserAttributes!.userId, queryType: "updateAccountReserve", accountId: accountId, 
            effectiveDate:effectiveDate, value: value };

        const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

        const results = await Promise.all([
            fetchData(url, bodyRequest, token),
        ]);

        // const results = [{ status: "SUCCESS" }];
        // const results = [{ status: "FAILURE" }];

        const resultStatus = results && results[0].status ? results[0].status : "FAILURE";
        if(resultStatus === "SUCCESS") {
            updateAccountReserve(accountId, effectiveDate, month, year, value);
            setLoadDbAccountReserves(true);
        } else {
            const message = resultStatus ? "(" + resultStatus + ")" : "";
            await modalContext.showModal(
                ModalType.confirm,
                'Error updating reserve ' + message + ', please try again.',
            );
        }

        handleValueSubmitResult(resultStatus);
    }

    const handleDeleteReserveAmount = async (accountId: number, month: number, year: number, handleValueDeleteResult: (result: string) => void) => {
        const effectiveDate = createDateStringFromDayValue({ year: year, month: month, day: 1 });
        const url = PtrAppApiStack.PtrAppApiEndpoint + "GetCashflows";
        const bodyRequest = { userId: appUserAttributes!.userId, queryType: "deleteAccountReserve", accountId: accountId, 
            effectiveDate:effectiveDate };

        const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

        const results = await Promise.all([
            fetchData(url, bodyRequest, token),
        ]);

        const resultStatus = results && results[0].status ? results[0].status : "FAILURE";
        if(resultStatus === "SUCCESS") {
            // Temporarily update the reserve to 0 while the delete propogates through and trickles down.
            updateAccountReserve(accountId, effectiveDate, month, year, 0);
            setLoadDbAccountReserves(true);
        } else {
            const message = resultStatus ? "(" + resultStatus + ")" : "";
            await modalContext.showModal(
                ModalType.confirm,
                'Error deleting reserve ' + message + ', please try again.',
            );
        }

        handleValueDeleteResult(resultStatus);
    }

    // Updates the state for the specific record edited so that it reflects the new value while the reserves are being reloaded from the database.
    // Reloading from database will ensure subsequent months inherit the new value if appropriate.
    const updateAccountReserve = (accountId: number, effectiveDate: string, month: number, year: number, value: number) => {
        const newAccountReserves = dbAccountReserves ? [...dbAccountReserves] : [];

        const updateRec = newAccountReserves.find((reserve) => (reserve.accountId === accountId && reserve.effectiveDate === effectiveDate));
        if(updateRec) {
            updateRec.value = value;
        } else {
            newAccountReserves.push({ accountId: accountId, effectiveDate: effectiveDate, month: month, year: year, value: value });
        }

        setDbAccountReserves(newAccountReserves);
    }
    
    // if(dbCashflows === null && dbStartBalances === null) {
    //     return <div>Placeholder</div>;
    // }
    if((dbCashflows !== null && dbCashflows.length === 0) && (dbStartBalances !== null && dbStartBalances.length === 0)) {
        return <div className="no-data-found"><h1>No data found, please adjust your filters.</h1></div>;
    }

    const [cashflowGroups, totals] = (dbCashflows !== null && dbStartBalances !== null) ? createCashflowGroups(dbCashflows!, dbStartBalances!, dbAccountReserves!) : [{}, null];

    return (
        <div className="drawdown scrollable">
            <CashflowStats
                totalDrawnDown={totals ? totals.drawndown : null}
                totalAssetsBoy={dbTotalAssetsBoy}
            />
            <div className="scrollable">
                <CashflowTable 
                    cashflowTimeperiodGroups={cashflowGroups} 
                    totals={totals}
                    handleCashflowActionButtonClick={handleCashflowActionButtonClick}
                    handleReserveAmountChange={handleReserveAmountChange}
                    handleDeleteReserveAmount={handleDeleteReserveAmount}
                />
            </div>
        </div>
    );
};

// Group cashflows by by timeperiod and account, calculating aggregate numbers for each account within timeperiod.
const createCashflowGroups = (dbCashflows: ICashflow[], dbStartBalances: IStartBalance[], dbAccountReserves: IStartBalance[]): 
    [{ [index: string]: ICashflowTimeperiodGroup }, ICashflowMetrics] => {
    const totals: ICashflowMetrics = {
        startingCashBalance: 0,
        drawndown: 0,
        activity: {},
        endingCashBalance: 0,
        reserve: 0,
        isReserveActual: false,
        availableToDrawdown: 0,
    };
    const maxMonth = getMaxTimeperiod(dbCashflows, dbStartBalances);
    let gc: { [index: string]: ICashflowTimeperiodGroup } = {};
    const groupeCashflows = dbCashflows.reduce((gc, item) => {
        const timePeriodKey = getCashflowTimeperiodKey(item);
        if(!(timePeriodKey in gc)) {
            gc[timePeriodKey] = {
                month: item.month,
                year: item.year,
                cashflowAccountGroups: {},
                startingCashBalance: 0,
                drawndown: 0,
                activity: {},
                endingCashBalance: 0,
                reserve: 0,
                isReserveActual: false,
                availableToDrawdown: 0,
            };
        }
        const tpg: ICashflowTimeperiodGroup = gc[timePeriodKey];

        if(!(item.accountId in tpg.cashflowAccountGroups)) {
            const [startBalance, _isBalanceActual] = getPeriodRecord(dbStartBalances, item.accountId, item.month, item.year);
            const [reserve, isReserveActual] = getPeriodRecord(dbAccountReserves, item.accountId, item.month, item.year);
            tpg.cashflowAccountGroups[item.accountId] = {
                accountId: item.accountId,
                accountName: item.accountName,
                startingCashBalance: startBalance,
                drawndown: 0,
                activity: {},
                endingCashBalance: startBalance,
                reserve: reserve,
                isReserveActual: isReserveActual,
                availableToDrawdown: 0,
            }
            tpg.startingCashBalance += startBalance;
            tpg.endingCashBalance += startBalance;
            tpg.reserve += reserve;
            // Only add starting balances for first time period.  Assumes month 1 is the first time period in the group.
            if(tpg.month === 1) {
                totals.startingCashBalance += startBalance;
            }
            if(tpg.month === maxMonth) {
                totals.endingCashBalance += startBalance;
                totals.reserve += reserve;
            }
        }

        addItemToCashflowAccountGroup(tpg, item.accountId, totals, item);

        return gc;
    }, gc);

    updateCashflowTimeperiodGroupTotals(gc, totals, maxMonth);
  
    return [groupeCashflows, totals];
}

// Assumes only doing one year so looking at months only.
const getMaxTimeperiod = (dbCashflows: ICashflow[], dbStartBalances: IStartBalance[]) => {
    let maxMonth = 1;

    let index = 0;
    while(index < dbCashflows.length && maxMonth < 12) {
        if(dbCashflows[index].month > maxMonth) {
            maxMonth = dbCashflows[index].month;
        }
        index++;
    }
    index = 0;
    while(index < dbStartBalances.length && maxMonth < 12) {
        if(dbStartBalances[index].month > maxMonth) {
            maxMonth = dbStartBalances[index].month;
        }
        index++;
    }

    return maxMonth;
}

// Add cashflow to list for group, and update total for cashflow category of item on the account group.
const addItemToCashflowAccountGroup = (tpg: ICashflowTimeperiodGroup, accountId: number, totals: ICashflowMetrics, item: ICashflow) => {
    const cag: ICashflowAccountGroup = tpg.cashflowAccountGroups[accountId];

    if(isValueInEnum(item.cashflowCategory, CashflowCategories)) {
        if(item.cashflowCategory !== CashflowCategories.none) {
            if(item.cashflowCategory in cag.activity) cag.activity[item.cashflowCategory] += item.amount; else cag.activity[item.cashflowCategory] = item.amount;
            if(item.cashflowCategory in tpg.activity) tpg.activity[item.cashflowCategory] += item.amount; else tpg.activity[item.cashflowCategory] = item.amount;
            if(item.cashflowCategory in totals.activity) totals.activity[item.cashflowCategory] += item.amount; else totals.activity[item.cashflowCategory] = item.amount;
            if(item.cashflowCategory === CashflowCategories.withdrawals && !item.isNotDrawdown) { 
                // Track separate drawndown value which might differ from total Withdrawals (transactions marked as not drawdown).
                cag.drawndown += item.amount;
                tpg.drawndown += item.amount;
                totals.drawndown += item.amount;
            }
    }
    } else {
        // TODO: Throw exception.
        console.error("Invalid cashflow category specified in addItemToCashflowAccountGroup: " + item.cashflowCategory);
        alert("Invalid cashflow category specified in addItemToCashflowAccountGroup: " + item.cashflowCategory);
    }
}

// Calculate various totals for each account group by applying the cashflow catergory totals to the appropriate account group totals.
const updateCashflowTimeperiodGroupTotals = (ctgs: { [index: string]: ICashflowTimeperiodGroup }, totals: ICashflowMetrics, maxMonth: number) => {
    Object.values(ctgs).forEach(timePeriodGroup => {
        Object.values(timePeriodGroup.cashflowAccountGroups).forEach(cag => {
            Object.keys(cag.activity).forEach(cashflowCategory => {
                cag.endingCashBalance += cag.activity[cashflowCategory];
                timePeriodGroup.endingCashBalance += cag.activity[cashflowCategory];
                if(timePeriodGroup.month === maxMonth) {
                    totals.endingCashBalance += cag.activity[cashflowCategory];
                }
                // if(cashflowCategory === CashflowCategories.withdrawals) { 
                //     // Track separate drawndown value which might differ from total Withdrawals (transactions marked as not drawdown).
                //     cag.drawndown += cag.activity[cashflowCategory];
                //     timePeriodGroup.drawndown += cag.activity[cashflowCategory];
                //     totals.drawndown += cag.activity[cashflowCategory];
                // }
            });

            cag.startingCashBalance = round(cag.startingCashBalance, 2);
            cag.drawndown = round(cag.drawndown, 2);
            cag.endingCashBalance = round(cag.endingCashBalance, 2);
            cag.availableToDrawdown = round(cag.endingCashBalance - cag.reserve, 2);
        });

        timePeriodGroup.startingCashBalance = round(timePeriodGroup.startingCashBalance, 2);
        timePeriodGroup.drawndown = round(timePeriodGroup.drawndown, 2);
        timePeriodGroup.endingCashBalance = round(timePeriodGroup.endingCashBalance, 2);
        timePeriodGroup.availableToDrawdown = round(timePeriodGroup.endingCashBalance - timePeriodGroup.reserve, 2);
    });

    totals.startingCashBalance = round(totals.startingCashBalance, 2);
    totals.drawndown = round(totals.drawndown, 2);
    totals.endingCashBalance = round(totals.endingCashBalance, 2);
    totals.availableToDrawdown = round(totals.endingCashBalance - totals.reserve, 2);
}

// Find record for give item account and period.  
// Assumes account and period are unique.
// Assumes period is a month and year.
const getPeriodRecord = (dbStartBalances: IStartBalance[], accountId: number, month: number, year: number): [number, boolean] => {
    if(!dbStartBalances || !accountId || !year || (!month && month !== 0)) {
        return [0, false];
    }

    const startBalanceRec = dbStartBalances.find(el => {
        if(el.accountId == accountId && el.month === month && el.year === year) {
            return 1;
        } else {
            return 0;
        }
    });

    if(startBalanceRec) {
        return [startBalanceRec.value, startBalanceRec.isActualValue ? startBalanceRec.isActualValue : false];
    } else {
        return [0, false];
    }
}

export const getCashflowTimeperiodKey = (obj: { month: number, year: number}) => {
    return obj.month + "-" + obj.year;
}