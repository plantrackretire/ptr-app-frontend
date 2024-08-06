import { Fragment } from 'react';
import { calcDiffInYears } from '../../../../../utils/dates';
import './NetworthChartOptions.css';


interface INetworthChartOptions {
  dates: string[],
  units: string,
  timePeriod: string,
  yearValueType: string,
  setUnits: (value: string) => void,
  setTimePeriod: (value: string) => void,
  setYearValueType: (value: string) => void,
}

export const NetworthChartOptions: React.FC<INetworthChartOptions> = ({ units, timePeriod, dates, yearValueType, 
  setUnits, setTimePeriod, setYearValueType }) => {
  const timePeriodOptions = getTimePeriodOptions(dates);

  return (
    <div className="networth-chart--options">
      <button 
        className={"networth-chart--options-left-side" + (units === "Months" ? " button-el active" : " button-el")} 
        onClick={() => setUnits("Months")} title="Show monthly values"
      >
        MONTHS
      </button>
      <button 
        className={"networth-chart--options-right-side" + (units === "Years" ? " button-el active" : " button-el")} 
        onClick={() => setUnits("Years")} title="Show end of year values"
      >
        YEARS
      </button>
      { units === "Years" && <br /> }
      <div className={"networth-chart--options--sub-options" + (units === "Months" ? " networth-chart--options-left-side" : " networth-chart--options-right-side")}>
        { units === "Months" ? 
            timePeriodOptions.map((option) => (
              <button key={option} 
                className={"networth-chart--options-left-side" + (option === timePeriod ? " button-el active" : " button-el")} 
                onClick={() => setTimePeriod(option)}
              >
                {option}
              </button>
            ))
        :
          <Fragment>
            <button 
              className={"networth-chart--options-right-side" + (yearValueType === "$" ? " button-el active" : " button-el")} 
              onClick={() => setYearValueType("$")}
            >
              Dollars
            </button>
            <button 
              className={"networth-chart--options-right-side" + (yearValueType === "%" ? " button-el active" : " button-el")} 
              onClick={() => setYearValueType("%")}
            >
              % Change
            </button>
          </Fragment>
        }
      </div>
      { units === "Months" && <br /> }
    </div>
  );
};

const getTimePeriodOptions = (dates: string[]): string[] => {
  const includeYtd = (new Date(dates[dates.length-1]) > new Date(new Date().getFullYear(), 1, 1)) ? true : false;
  const numYears = calcDiffInYears(new Date(dates[0]), new Date(dates[dates.length-1]));

  switch(true) {
    case numYears >= 10: return(includeYtd ? ['YTD', '1Y', '3Y', '5Y', '10Y', 'ALL',] : ['1Y', '3Y', '5Y', '10Y', 'ALL',]);
    case numYears >= 5: return(includeYtd ? ['YTD', '1Y', '3Y', '5Y', 'ALL',] : ['1Y', '3Y', '5Y', 'ALL',]);
    case numYears >= 3: return(includeYtd ? ['YTD', '1Y', '3Y', 'ALL',] : ['1Y', '3Y', 'ALL',]);
    case numYears >= 1: return(includeYtd ? ['YTD', '1Y', 'ALL',] : ['1Y', 'ALL',]);
    default: return(includeYtd ? ['YTD', 'ALL',] : ['ALL',]);
  }
};