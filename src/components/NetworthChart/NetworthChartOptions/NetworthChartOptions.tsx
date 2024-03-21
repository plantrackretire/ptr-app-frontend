import './NetworthChartOptions.css';
import { Fragment } from 'react';
import { calcDiffInYears } from '../../../utils/dates';


interface INetworthChartOptions {
  dates: string[],
  units: string,
  timePeriod: string,
  yearValueType: string,
  setUnits: (value: string) => void,
  setTimePeriod: (value: string) => void,
  setYearValueType: (value: string) => void,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const NetworthChartOptions: React.FC<INetworthChartOptions> = ({ units, timePeriod, dates, yearValueType, 
  setUnits, setTimePeriod, setYearValueType }) => {
  const timePeriodOptions = getTimePeriodOptions(dates);

  return (
    <div className="networth-chart--options">
      <div className="networth-chart--options--time-period">
        { units === "Months" ? 
            timePeriodOptions.map((option) => (
              <button key={option} className={option === timePeriod ? "button-el active" : "button-el"} onClick={() => setTimePeriod(option)}>
                {option}
              </button>
            ))
        :
          <Fragment>
            <button className={yearValueType === "$" ? "button-el active" : "button-el"} onClick={() => setYearValueType("$")}>
              $
            </button>
            <button className={yearValueType === "%" ? "button-el active" : "button-el"} onClick={() => setYearValueType("%")}>
              %
            </button>
          </Fragment>
      }
      </div>
      <div>|</div>
      <div className="networth-chart--options--units">
        <button className={units === "Months" ? "button-el active" : "button-el"} onClick={() => setUnits("Months")} title="Show monthly values">
          MONTHS
        </button>
        <button className={units === "Years" ? "button-el active" : "button-el"} onClick={() => setUnits("Years")} title="Show end of year values">
          YEARS
        </button>
      </div>
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