import { Fragment } from 'react';
import { calcDiffInYears } from '../../../../../utils/dates';
import './NetworthChartOptions.css';
import { InfoButton } from '../../../../../components/InfoButton';


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
      <div className="networth-chart--options-top-side networth-chart--options-left-side">
        <button 
          className={(units === "Months" ? " button-el active" : " button-el")} 
          onClick={() => setUnits("Months")} title="Show monthly values"
        >
          MONTHS 
        </button>
        <div className="networth-chart--options-info-button"><InfoButton content={monthsInfo} /></div>
      </div>
      <div className="networth-chart--options-top-side">
        <button 
          className={"networth-chart--options-right-side" + (units === "Years" ? " button-el active" : " button-el")} 
          onClick={() => setUnits("Years")} title="Show end of year values"
        >
          YEARS
        </button>
        <div className="networth-chart--options-info-button"><InfoButton content={yearsInfo} /></div>
      </div>
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

const monthsInfo = 
<div className="info-button--info">
  <h2>Monthly Value</h2>
  <div>The "Months" view shows how the total value of your portfolio has changed over time, based on any filters you’ve applied.</div>
  <div>The points on the graph represent the value at the end of each month.</div>
  <div><br /></div>
  <div>The timeline goes up to the 'As of Date' you selected. The start date depends on the period you choose:</div>
  <ul>
    <li className="info-button--info-indent">If you select 'All,' it shows data from the earliest available date.</li>
    <li className="info-button--info-indent">For other options, like '3Y,' it goes back from the 'As of Date' by the chosen amount of time (for example, 3 years for '3Y').</li>
  </ul>
</div>;

const yearsInfo = 
<div className="info-button--info">
  <h2>Yearly Value</h2>
  <div>The "Years" view shows the total value of your portfolio for each year, based on any filters you’ve applied.</div>
  <div>The timeline starts with the first year that has data and ends at the 'As of Date.'</div>
  <div><br /></div>
  <div>You can view the data in two ways:</div>
  <ul>
    <li className="info-button--info-indent"><strong>Dollars:</strong> This shows the actual value of your portfolio for each year.</li>
    <li className="info-button--info-indent"><strong>% Change:</strong> This shows how much the value changed from the previous year. The first year is not included in this view because there’s no prior year to compare it to.</li>
  </ul>
</div>;
