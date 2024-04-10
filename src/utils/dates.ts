import { DayValue, utils } from "@hassanmojab/react-modern-calendar-datepicker";
import { DropdownListOptionsType } from "../components/DropdownList";

const monthAbbreviations = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
const monthEndDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const precannedDates = [
    { value: 1, label: "Current Date" },
    { value: 2, label: "Prior Month End" },
    { value: 3, label: "Prior Year End" },
];

export const getMonthName = (month: number): string => {
    return monthAbbreviations[month];
}

export const calcDate = (precannedDateValue: number): DayValue => {
    switch(precannedDateValue) {
        case 1: // Current Date
            return utils('en').getToday();
        case 2: // Prior Month End
            const priorMonthEnd = utils('en').getToday();
            if(priorMonthEnd.month === 1) {
                priorMonthEnd.month = 12;
                priorMonthEnd.year = priorMonthEnd.year - 1;
            } else 
                priorMonthEnd.month = priorMonthEnd.month - 1;
            if(priorMonthEnd.month === 2)
                isLeapYear(priorMonthEnd.year) ? priorMonthEnd.day = 29 : priorMonthEnd.day = 28;
            else
                priorMonthEnd.day = monthEndDays[priorMonthEnd.month - 1];
            return priorMonthEnd;
        case 3: // Prior Year End
            const priorYearEnd = utils('en').getToday();
            priorYearEnd.month = 12;
            priorYearEnd.day = 31;
            priorYearEnd.year = priorYearEnd.year - 1;
            return priorYearEnd;
    }
}

// Return precanned date value matching passed in date, first one matching is returned.
export const getPrecannedDateValue = (date: DayValue): DropdownListOptionsType => {
    for(var value of precannedDates) {
        const newDate = calcDate(value.value);
        if(!compareDayValues(newDate, date))
            return([value]);
    }

    return [];
};

// Date constructor assumes local time zone.
// Doing this to ensure dates are consistent regardless of location. 
// If a position date is 3/31/2024 it shouldn't change because you happen to be in a different time zone when viewing it.
export const createLocalDate = (year: number, month: number, date: number): Date => {
    return new Date(year, month-1, date);
}

// Assumes string format of YYYY-MM-DD
export const createLocalDateFromDateTimeString = (dt: string): Date => {
    const dateParts = dt.split("-");
    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]);
    const date = Number(dateParts[2].substring(0, 2));

    return createLocalDate(year, month, date);
}

export const createDateFromDayValue = (dt: DayValue): Date => {
    if(!dt) return new Date();

    return new Date(dt.year, dt.month-1, dt.day);
};

export const createDateStringFromDayValue = (dt: DayValue): string => {
    if(!dt) return "";

    return (dt.year + "-" + dt.month + "-" + dt.day);
};

export const createDateStringFromDate = (dt: Date): string => {
    if(!dt) return "";

    return (dt.getFullYear() + "-" + (dt.getMonth()+1) + "-" + dt.getDate());
};

export const getBeginningOfYear = (dt: Date): Date => {
    return new Date(dt.getFullYear(), 0, 1);
}

export const getPriorMonthEnd = (dt: Date): Date => {
    if(new Date(dt.getTime() + 86400000).getDate() === 1) {
        return dt;
    } else {
        const newDt = new Date(dt.getFullYear(), dt.getMonth(), 1);
        newDt.setDate(newDt.getDate() - 1);
        return newDt;
    }
}

export const compareDates = (date1: Date, date2: Date): number => {
    const date1Time = date1.getTime();
    const date2Time = date2.getTime();

    if(date1Time < date2Time)
        return -1;
    if(date1Time > date2Time)
        return 1;
    return 0;
}

// -1 if dayValue1 < dayValue2, 1 if dayValue1 > dayValue2, 0 if dayValue1 == dayValue2
export const compareDayValues = (dayValue1: DayValue, dayValue2: DayValue): number => {
    if(!dayValue1 || !dayValue2) {
        console.log("Invalid date");
        // TODO: Throw exception
        return -1;
    }
    if(dayValue1.year < dayValue2.year)
        return -1;
    if(dayValue1.year > dayValue2.year)
        return 1;

    if(dayValue1.month < dayValue2.month)
        return -1;
    if(dayValue1.month > dayValue2.month)
        return 1;

    if(dayValue1.day < dayValue2.day)
        return -1;
    if(dayValue1.day > dayValue2.day)
        return 1;

    return 0;
}

const isLeapYear = (year: number): boolean => {
    if((year % 100) === 0)
        return (year % 400) == 0;
    else
        return (year % 4) == 0;
}

// Assumes string format of YYYY-MM-DD
export const getYearFromStringDate = (date: string) => {
    if(date.length < 8) {
        // TODO throw exception
        console.log("Invalid date in getYearFromStringDate");
        return "";
    }

    return date.slice(4);
}

// Assumes string format of YYYY-MM-DD
export const getMonthFromStringDate = (date: string) => {
    if(date.length < 8) {
        // TODO throw exception
        console.log("Invalid date in getMonthFromStringDate");
        return "";
    }

    const splitString = date.split("-");
    if(splitString.length !== 3) {
        // TODO throw exception
        console.log("Invalid date split in getMonthFromStringDate");
        return "";
    }
    return splitString[1];
}

export const adjustDateByYear = (date: Date, numYears: number) => {
    const isOrigDate29 = date.getDate() === 29 && date.getMonth() === 1; // month is indexed from 0

    date.setFullYear(date.getFullYear() + numYears);
    if(isOrigDate29 && !isLeapYear(date.getFullYear())) {
        date.setDate(28);
        date.setMonth(1);
    }

    return date;
}

// Assumes string format of YYYY-MM-DD
export const createDateFromString = (stringDate: string): Date => {
    const splitString = stringDate.split("-");
    if(splitString.length !== 3) {
        // TODO throw exception
        console.log("Invalid date split in createDateFromString");
        return new Date();
    }

    return new Date(Number(splitString[0]), Number(splitString[1])-1, Number(splitString[2]));
}

export const calcDiffInDays = (startDate: Date, endDate: Date) => {
    return Math.round((endDate.getTime() - startDate.getTime()) / 86400000); // 86400000 is 1000ms * 60s * 60m * 24hr
}

export const calcDiffInYears = (startDate: Date, endDate: Date) => {
    return (endDate.getTime() - startDate.getTime()) / 31536000000; // 31536000000 is 1000ms * 60s * 60m * 24hr * 365days
}

export const calcDaysInYear = (startDate: Date, endDate: Date) => {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const periodStartDate = new Date(startYear, 1, 1)
    const periodEndDate = new Date(endYear, 12, 31)
    const dayDiff = calcDiffInDays(periodStartDate, periodEndDate);

    return (dayDiff + 1) / (endYear - startYear + 1);
}