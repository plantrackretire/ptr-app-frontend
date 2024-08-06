import { memo, useContext, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from "chartjs-plugin-annotation";
import { ChartColorTypes, ConfigContext, IChartColors } from '../../../providers/ConfigProvider';
import { BarChartPlaceholder } from './BarChartPlaceholder';
import { createOptionsRecord, getChartColors } from '../../../utils/charts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Tick,
} from 'chart.js';
import './BarChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

interface IBarChart {
  labels: string[] | null,
  balances: number[] | null,
  title: string,
  colorType: ChartColorTypes,
  indexAxis?: string, // x or y
  maxBarThickness?: number,
  toolTipCallback?: (tooltipItem: any) => void, 
  xAxisTickRenderer?: (value: string | number, index: number, ticks: Tick[]) => void,
  yAxisTickRenderer?: (value: string | number, index: number, ticks: Tick[]) => void,
  formatValueOnBar?: ((value: any) => any) | undefined,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const BarChart: React.FC<IBarChart> = memo(({ labels, balances, title, colorType, indexAxis, 
  maxBarThickness, toolTipCallback, xAxisTickRenderer, yAxisTickRenderer, formatValueOnBar }) => {
  const chartRef = useRef();

  if(!indexAxis) indexAxis = 'x';
  if(!maxBarThickness) maxBarThickness = 30;
  
  const config = useContext(ConfigContext);
  const chartColors: IChartColors = config?.chartColors!;

  if(labels === null || balances === null) {
    return <BarChartPlaceholder />
  }
  if(balances.length === 0) {
    return <div className="bar-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  const data = createDataRecord(labels, balances, title, chartColors, colorType, maxBarThickness);
  const options = createOptionsRecord(
    'bar', config!, title, indexAxis, 
    toolTipCallback, xAxisTickRenderer, yAxisTickRenderer, formatValueOnBar, 
    (indexAxis === 'x'), (indexAxis === 'y'),
  );

  return (
    <div className="bar-chart">
      <Bar ref={chartRef} options={options} data={data} /> 
    </div>
  );
});

const createDataRecord = (dataLabels: string[], dataValues: number[], title: string, chartColors: IChartColors, colorType: ChartColorTypes, maxBarThickness: number) => {
  const [backgroundColors, borderColors] = getChartColors(dataValues, chartColors, colorType);
  
  return {
    labels: dataLabels,
    datasets: [
      {
        label: title,
        barPercentage: 1,
        maxBarThickness: maxBarThickness,
        minBarLength: 0,
        data: dataValues,
        fill: true,
        borderWidth: 1,
        borderColor: borderColors,
        backgroundColor: backgroundColors,
      },
    ],
  };
}