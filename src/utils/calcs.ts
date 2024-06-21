
import { calcDaysInYear, calcDiffInDays, compareDates, getYearFromStringDate } from "./dates";

// Functions to calculate aggregate gain/loss in value based on gain/loss in value percentage of individual records.
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

// Assumes date format x/x/xxxx, assumes dates are in chronological ascending order
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

// Track a start and end balance for given start and end dates.  Values only included if they fall on or before each date respectively.
export class AggregateValues {
    private startDate: Date;
    private endDate: Date;
    private aggreateStartValue: number;
    private aggregateEndValue: number;
    private percentageOfTotal: number | null;

    public constructor(startDate: Date, endDate: Date) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.aggreateStartValue = 0;
        this.aggregateEndValue = 0;
        this.percentageOfTotal = null;
    }

    public getStartDate() {
        return this.startDate;
    }
    public getEndDate() {
        return this.endDate;
    }
    public getAggregateStartValue() {
        return this.aggreateStartValue;
    }
    public getAggregateEndValue() {
        return this.aggregateEndValue;
    }
    public getPercentageOfTotal() {
        return this.percentageOfTotal;
    }

    public setPercentageOfTotal(total: number) {
        if(total) {
            this.percentageOfTotal = 0;
        }

        this.percentageOfTotal = this.aggregateEndValue / total;
    }

    // Assumes passed in values are valid for given start and end dates
    public addValues(startValue: number, endValue: number) {
        this.aggreateStartValue += startValue;
        this.aggregateEndValue += endValue;
    }

    // Validates that values are valid for given start and end dates before including.
    public addValuesWithDates(startDate: Date, endDate: Date, startValue: number, endValue: number) {
        if(compareDates(startDate, this.startDate) <= 0) {
            this.aggreateStartValue += startValue;
        }
        if(compareDates(endDate, this.endDate) <= 0)
            this.aggregateEndValue += endValue;
    }

    // TODO: When start value is 0 or negative should always return null and handle it (display N/A).
    //  To do this everyone would require more logic in sql that calculates holding change.
    public calcChangeInValuePercentage(): (number | null) {
        if(this.aggreateStartValue === 0) {
            return this.aggregateEndValue > 0 ? 1.0 : null;
        } else {
            return (this.aggregateEndValue - this.aggreateStartValue) / this.aggreateStartValue;
        }
    }
}