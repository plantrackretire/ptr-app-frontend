
import { calcDaysInYear, calcDiffInDays, getYearFromStringDate } from "./dates";

// Functions to calculate aggregate gain/loss in value.
// Numerator and denominator need to be calculated for each record and separately aggregated.
// The numerator / denominator give the aggregate gain/loss in value.
export interface IAggValueChange {
    aggChangeNumerator: number,
    aggChangeDenominator: number,
}  
export const initAggChangeWithRecord = (balance: number, changePercentage: number) => {
    return {
        aggChangeNumerator: (balance * changePercentage) / (1 + changePercentage),
        aggChangeDenominator: balance / (1 + changePercentage),
    }
}
export const processAggChangeRecord = (aggValueChange: IAggValueChange, balance: number, changePercentage: number) => {
    aggValueChange.aggChangeNumerator += (balance * changePercentage) / (1 + changePercentage);
    aggValueChange.aggChangeDenominator += balance / (1 + changePercentage);
}
export const calcAggChange = (aggValueChange: IAggValueChange) => 
    aggValueChange.aggChangeDenominator ? aggValueChange.aggChangeNumerator / aggValueChange.aggChangeDenominator : 0.0;

// Assumes date format x/x/xxxx, assumes dates are in chronolical ascending order
export const calcYtdChangeFromDataSet = (dates: string[], values: number[]) => {
    if(dates.length !== values.length || dates.length <= 0) {
        // TODO throw exception
        console.log("Invalid data set for calcYtdReturnFromDataSet");
        return 0;
    }
    if(dates.length === 1) return 0;

    const latestDateYear = getYearFromStringDate(dates[dates.length-1]);
    let priorYearDateIndex = -1;
    let index = dates.length-2;
    while(priorYearDateIndex === -1 && index >= 0) {
        if(getYearFromStringDate(dates[index]) !== latestDateYear)
            priorYearDateIndex = index;
        index--;
    }

    // If all dates are the same year then use the earliest date.
    if(priorYearDateIndex === -1)
        priorYearDateIndex = 0;

    return (values[dates.length-1] - values[index]) / values[index];
}

export const calcChangeFromDataSet = (dates: string[], values: number[], annualized?: boolean) => {
    if(dates.length !== values.length || dates.length <= 0) {
        // TODO throw exception
        console.log("Invalid data set for calcChangeFromDataSet");
        return 0;
    }
    if(dates.length === 1) return 0;

    if(annualized)
        return annualizeValue(new Date(dates[0]), new Date(dates[dates.length-1]), (values[dates.length-1] - values[0]) / Math.abs(values[0]));
    else
        return ((values[dates.length-1] - values[0]) / Math.abs(values[0]));
}

export const  annualizeValue = (startDate: Date, endDate: Date, value: number) => {
    const daysInYear = calcDaysInYear(startDate, endDate)
    const daysInReturn = calcDiffInDays(startDate, endDate) + 1

    return ((1 + value) ** (daysInYear / daysInReturn) - 1)
}