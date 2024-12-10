import { memo } from 'react';
import annotationPlugin from "chartjs-plugin-annotation";
import { ChartColorTypes } from '../../../../../providers/ConfigProvider';
import { formatAnnotatedChangePercentage } from '../../../../../utils/general';
import { YearlyChartPlaceholder } from './YearlyChartPlaceholder';
import { IReturn } from '../../Performance';
import { couldNotCalculateValue, insufficientDataValue } from '../PerformanceCharts';
import { ChartTitle } from '../../../../../components/Charts/ChartTitle';
import { BarChart } from '../../../../../components/Charts/BarChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Filler,
  Tick,
} from 'chart.js';
import './YearlyChart.css';
import { InfoButton } from '../../../../../components/InfoButton';

export const defaultYearlyChartHeight = "350px";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Filler,
  annotationPlugin,
);

interface IYearlyChart {
  returns: IReturn[] | null,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const YearlyChart: React.FC<IYearlyChart> = memo(({ returns }) => {
  if(returns === null) {
    return <YearlyChartPlaceholder />
  }

  const numYears = returns.length;
  if(numYears === 0) {
    return <div className="networth-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  let chartHeight = defaultYearlyChartHeight;
  if(numYears > 8) {
    chartHeight = (numYears * 30).toString() + "px";
  } else {
    chartHeight = "200px";
  }

  const dataLabels = returns.map(ret => ret.id);
  const dataValues = returns.map(ret => {
    switch(ret.status) {
      case 'ID': return insufficientDataValue;
      case 'CNC': return couldNotCalculateValue;
      default: return ret.xirr;
    }
  });

  return (
    <div className="yearly-chart">
      <div className="multi-year-chart--title">
        <ChartTitle title='Annual Returns' />
        <InfoButton content={averageAnnualReturnsInfo} />
      </div>
      <div className="yearly-chart--chart"  style={{ height: chartHeight }}>
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
            formatValueOnBar={formatAnnotatedChangePercentage}
        />
      </div>
    </div>
  );
});

const averageAnnualReturnsInfo = 
<div className="info-button--info">
  <h2>Annual Returns</h2>
  <div>The "Annual Returns" shows the annual return for each year where data is available, calculated using the Internal Rate of Return (IRR) method. This covers the period from the earliest year with activity up to the 'As of Date.'</div>
  <div>For years that don’t have a full year of data—either because the first year starts after January 1 or the last year ends before December 31—the return will reflect only the period for which data is available. This means it is not annualized, showing the return for that specific timeframe instead.</div>
</div>;
