import { memo, useContext, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { AppColors, ConfigContext, IConfigContext } from '../../providers/ConfigProvider';
import { PieChartPlaceholder } from './PieChartPlaceholder';
import { ChartTitle } from '../Charts/ChartTitle';
import { createOptionsRecord } from '../../utils/charts';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './PieChart.css';


ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export interface IPieChartItem {
  value: number,
  label: string,
  lookupValue: number,
  color: string,
}

interface IPieChart {
  pieChartItems: IPieChartItem[] | null,
  title: string,
  height: string,
  hoverOffset: number,
  hoverLookupValue: number,
  hoverLookupType: string, // Is hover value based on hovering on this pie chart (internal) or an external action (external).
  createTooltipLabel: ((tooltipItem: any) => void) | undefined,
  handleOnHover: ((keyValue: number) => void) | undefined,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const PieChart: React.FC<IPieChart> = memo(({ pieChartItems, title, height, hoverLookupValue, hoverLookupType, createTooltipLabel, handleOnHover }) => {
  const chartRef = useRef();
  const config = useContext(ConfigContext);

  // Keeping code for reference for possible future use.
  // const onClick = (event: any) => {
  //   // console.log(getElementAtEvent(chartRef.current!, event));
  // }

  if(pieChartItems === null) {
    return <PieChartPlaceholder height={ height } />
  }
  if(pieChartItems.length === 0) {
    return <div className="pie-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  const [backgroundColors, borderColors, offsets] = createColors(pieChartItems, hoverLookupValue, config!);

  const data = createDataRecord(pieChartItems, title, backgroundColors, borderColors, offsets, hoverLookupType);
  const options = createOptionsRecord(
    'pie', config!, title, 'x', 
    createTooltipLabel, undefined, undefined, undefined, 
    false, false,
    hoverOffset, { left: 0, right: 0, top: 13, bottom: 13 }, handleOnHover
  );

  return (
    <div className="pie-chart">
        <ChartTitle title={title} />
        <div className="pie-chart--chart" style={{ height: height }}>
          <Pie 
            ref={chartRef}
            options={options} 
            data={data} 
          />
        </div>
    </div>
  );
});

const defaultOffset = 1;
const hoverOffset = 35;
const createColors = (pieChartItems: IPieChartItem[], hoverLookupValue: number, config: IConfigContext): [string[], string[], number[]] => {
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];
  const offsets: number[] = [];

  pieChartItems.forEach((record) => {
    backgroundColors.push(record.color);
    borderColors.push(config.getColor(AppColors.appBackgroundColor));
    if(record.lookupValue === hoverLookupValue) {
      offsets.push(hoverOffset);
    } else {
      offsets.push(defaultOffset);
    }
  });

  return [backgroundColors, borderColors, offsets];
}

// If hover is based on external action then set the offset to show hover, otherwise don't set offset (hoverOffset takes care of it, having both causes flickering).
const createDataRecord = (pieChartItems: IPieChartItem[], dataSetLabel: string, backgroundColors: string[], borderColors: string[], offsets: number[], hoverLookupType: string) => {
  return (hoverLookupType === 'external') ?
    {
      labels: pieChartItems.map(item => item.label),
      datasets: [
        {
          label: dataSetLabel,
          data: pieChartItems,
          fill: true,
          borderWidth: 1,
          offset: offsets,
          borderColor: borderColors,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors, // Explicitly setting hover color otherwise chart js will slightly darken the color on hover (in some cases it changes hue).
        },
      ],
    } :
    {
      labels: pieChartItems.map(item => item.label),
      datasets: [
        {
          label: dataSetLabel,
          data: pieChartItems,
          fill: true,
          borderWidth: 1,
          borderColor: borderColors,
          backgroundColor: backgroundColors,
        },
      ],
    };
}