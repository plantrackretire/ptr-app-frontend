import { Fragment, useState, memo } from 'react';
import { calcChangeFromDataSet } from '../../../../utils/calcs';
import { adjustDateByYear, calcDiffInYears, createDateFromString } from '../../../../utils/dates';
import { ChartColorTypes } from '../../../../providers/ConfigProvider';
import { formatAnnotatedChangePercentage, formatBalance, invalidValue } from '../../../../utils/general';
import { NetworthChartOptions } from './NetworthChartOptions';
import { NetworthChartPlaceholder } from './NetworthChartPlaceholder';
import { IHolding, calcHoldingsTotals } from '../../../../components/HoldingView';
import { Ticks, Tick } from 'chart.js';
import { ChartsTitle } from '../../../../components/Charts/ChartsTitle';
import { LineChart } from '../../../../components/Charts/LineChart';
import { BarChart } from '../../../../components/Charts/BarChart';
import './NetworthChart.css';

export const defaultNetworthChartHeight = "350px";

interface INetworthChart {
  labels: string[] | null,
  balances: number[] | null,
  holdings: IHolding[] | null,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const NetworthChart: React.FC<INetworthChart> = memo(({ labels, balances, holdings }) => {
  const [timePeriod, setTimePeriod] = useState<string>("ALL");
  const [units, setUnits] = useState<string>("Months");
  const [yearValueType, setYearValueType] = useState<string>("$");
  
  if(labels === null || balances === null) {
    return <NetworthChartPlaceholder />
  }
  if(balances.length === 1 && balances[0] === 0) {
    return <div className="networth-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  // Filter data based on time period selected, and convert to percentages if percentage view selected
  const [filteredLabels, filteredBalances] = filterChartData(labels, balances, units, timePeriod);
  let dataLabels = filteredLabels;
  let dataValues = filteredBalances;
  if(units === "Years" && yearValueType === "%") {
    dataLabels = filteredLabels.slice(1); // Drop first year because we cannot calculate a percentage change for it
    dataValues = createChangesInValue(filteredBalances); // Calc change in value percentage for each year (except first)
  }

  const titleAnnualPercentageChange = 
    calcPercentageChange(filteredLabels, filteredBalances); // Not using dataValues because they may be percentages

  let chartHeight = defaultNetworthChartHeight;
  if(units === "Years") {
    const numYears = calcDiffInYears(new Date(labels[0]), new Date(labels[labels.length-1]));
    if(numYears > 8) {
      chartHeight = (numYears * 30).toString() + "px";
    } else {
      chartHeight = "200px";
    }
  }

  let changeFromStartDate = null;
  if(holdings !== null) {
    const totals = calcHoldingsTotals(holdings, false);
    changeFromStartDate = totals.changeInValue;
  }

  return (
    <div className="networth-chart">
      { balances.length > 0 ?
        <Fragment>
          <ChartsTitle titleBalance={filteredBalances[filteredBalances.length-1]} titleAnnualPercentageChange={titleAnnualPercentageChange}
            titleChangeFromStartDate={changeFromStartDate} />
          <div className="networth-chart--chart"  style={{ height: chartHeight }}>
            { units === "Months" ? 
                <LineChart 
                  labels={dataLabels}
                  balances={dataValues}
                  title="Net Worth"
                  indexAxis="x"
                  toolTipCallback={(tooltipItem: any) => { return tooltipItem.dataset.label + ': ' + formatBalance(tooltipItem.raw); }}
                  yAxisTickRenderer={function(this: any, value: string | number, index: number, ticks: Tick[]) {
                    return '$' + Ticks.formatters.numeric.apply(this, [value as number, index, ticks]);
                  }}
                /> :
                <BarChart 
                  labels={dataLabels}
                  balances={dataValues}
                  title="Net Worth"
                  colorType={ChartColorTypes.alternatingColors}
                  indexAxis="y"
                  maxBarThickness={30}
                  yAxisTickRenderer={function(this: any, _value: string | number, index: number, _ticks: Tick[]) {
                    return (this.getLabelForValue(index) as string).slice(0, 4)
                  }}
                  formatValueOnBar={yearValueType === "$" ? formatBalance : formatAnnotatedChangePercentage}
                />
            }
          </div>
          <NetworthChartOptions
            dates={labels} 
            units={units}
            timePeriod={timePeriod}
            yearValueType={yearValueType}
            setUnits={setUnits}
            setTimePeriod={setTimePeriod}
            setYearValueType={setYearValueType}
          />
        </Fragment>
      :
        <span>No Data</span>
      }
    </div>
  );
});

const filterChartData = (labels: string[], balances: number[], units: string, timePeriod: string): [string[], number[]] => {
  if(units === "Months" && timePeriod === "ALL")
    return [labels, balances];

  let filteredLabels: string[] = [];
  let filteredValues: number[] = [];
  const today = new Date();

  let cutoffDate: Date;

  if(units === "Months") {
    switch(timePeriod) {
      case "YTD": cutoffDate = new Date(today.getFullYear(), 0, 1); break;
      case "1Y": cutoffDate = adjustDateByYear(createDateFromString(labels[labels.length-1]), -1); break;
      case "3Y": cutoffDate = adjustDateByYear(createDateFromString(labels[labels.length-1]), -3); break;
      case "5Y": cutoffDate = adjustDateByYear(createDateFromString(labels[labels.length-1]), -5); break;
      case "10Y": cutoffDate = adjustDateByYear(createDateFromString(labels[labels.length-1]), -10); break;
      default: cutoffDate = createDateFromString(labels[0]); break;
    }
  }

  labels.forEach((label, index) => {
    if(units === "Months") {
      if(createDateFromString(label) >= cutoffDate) {
        filteredLabels.push(label)
        filteredValues.push(balances[index]);
      }
    } else {
      const date = createDateFromString(label);
      if((date.getMonth() === 11 && date.getDate() === 31) || label === labels[labels.length-1]) {
        filteredLabels.push(label)
        filteredValues.push(balances[index]);
      }
    }
  });
  
  return [filteredLabels, filteredValues];
}

const createChangesInValue = (values: number[]): number[] => {
  let changeList: number[] = [];

  let priorValue = 0;
  values.forEach((value, index) => {
    if(index > 0) {
      priorValue <= 0 ? changeList.push(invalidValue) : (changeList.push((value - priorValue) / Math.abs(priorValue)));
    }
    priorValue = value;
  });
  
  return changeList;
}

const calcPercentageChange = (dates: string[], values: number[]): number => {
  return values.length >= 2 ? calcChangeFromDataSet(dates, values, true) : 0;
}