import { memo } from 'react';
import { ChartColorTypes } from '../../../../../providers/ConfigProvider';
import { formatAnnotatedChangePercentage } from '../../../../../utils/general';
import { MultiYearChartPlaceholder } from './MultiYearChartPlaceholder';
import { IReturn } from '../../Performance';
import { couldNotCalculateValue, insufficientDataValue } from '../PerformanceCharts';
import { ChartTitle } from '../../../../../components/Charts/ChartTitle';
import { Tick } from 'chart.js';
import { BarChart } from '../../../../../components/Charts/BarChart';
import './MultiYearChart.css';

interface IMultiYearChart {
  returns: IReturn[] | null,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const MultiYearChart: React.FC<IMultiYearChart> = memo(({ returns }) => {
  if(returns === null) {
    return <MultiYearChartPlaceholder />
  }
  if(returns.length === 0) {
    return <div className="networth-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  const dataLabels = returns.map(ret => {
    switch(ret.id) {
      case "oneYear": return "1 Year"; break;
      case "threeYears": return "3 Year"; break;
      case "fiveYears": return "5 Year"; break;
      case "tenYears": return "10 Year"; break;
      case "maxYears": return "Max Year"; break;
      default: return ""; break;
    }
  });
  const dataValues = returns.map(ret => {
    switch(ret.status) {
      case 'ID': return insufficientDataValue;
      case 'CNC': return couldNotCalculateValue;
      default: return ret.xirr;
    }
  });
  
  return (
      <div className="multi-year-chart">
          <ChartTitle title='Average Annualized Returns' />
          <div className="multi-year-chart--chart">
            <BarChart
                labels={dataLabels}
                balances={dataValues}
                title="Net Worth"
                colorType={ChartColorTypes.singleColor}
                indexAxis="x"
                maxBarThickness={150}
                xAxisTickRenderer={function(this: any, _value: string | number, index: number, _ticks: Tick[]) {
                  return (this.getLabelForValue(index) as string);
                }}
                formatValueOnBar={formatAnnotatedChangePercentage}
            />
          </div>
      </div>
    );
});