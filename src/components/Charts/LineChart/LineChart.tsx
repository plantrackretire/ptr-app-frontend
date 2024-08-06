import { memo, useContext, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from "chartjs-plugin-annotation";
import { ConfigContext, IChartColors } from '../../../providers/ConfigProvider';
import { hexToRgb } from '../../../utils/general';
import { LineChartPlaceholder } from './LineChartPlaceholder';
import { createOptionsRecord, drawVerticalLine } from '../../../utils/charts';
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
import './LineChart.css';

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

interface ILineChart {
  labels: string[] | null,
  balances: number[] | null,
  title: string,
  indexAxis?: string, // x or y
  toolTipCallback?: (tooltipItem: any) => void, 
  xAxisTickRenderer?: (value: string | number, index: number, ticks: Tick[]) => void,
  yAxisTickRenderer?: (value: string | number, index: number, ticks: Tick[]) => void,
}

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const LineChart: React.FC<ILineChart> = memo(({ labels, balances, title, indexAxis, toolTipCallback, xAxisTickRenderer, yAxisTickRenderer }) => {
  const chartRef = useRef();

  // Plugin to draw vertical line on hover
  const hoverVerticalLinePlugin = {
    id: 'hoverVerticalLine', //typescript crashes without id.
    afterDraw: (chart: any) => {
      if (chart?.tooltip?.opacity) {
        drawVerticalLine(chart, config!, chartColors.singleColor);
      }
    },
  }
    
  if(!indexAxis) indexAxis = 'x';
  
  const config = useContext(ConfigContext);
  const chartColors: IChartColors = config?.chartColors!;

  if(labels === null || balances === null) {
    return <LineChartPlaceholder />
  }
  if(balances.length === 0) {
    return <div className="line-chart--no-data"><h1>No data found, please adjust your filters.</h1></div>
  }

  const data = createDataRecord(labels, balances, title, chartColors);
  const options = createOptionsRecord(
    'line', config!, title, indexAxis, 
    toolTipCallback, xAxisTickRenderer, yAxisTickRenderer, 
    undefined, false, false,
  );

  return (
    <div className="line-chart">
      <Line plugins={[hoverVerticalLinePlugin]} ref={chartRef} options={options} data={data} />
    </div>
  );
});

const createDataRecord = (dataLabels: string[], dataValues: number[], title: string, chartColors: IChartColors) => {
  return {
    labels: dataLabels,
    datasets: [
      {
        label: title,
        data: dataValues,
        fill: true,
        borderWidth: 1,
        borderColor: chartColors.singleColor,
        backgroundColor: hexToRgb(chartColors.singleColor, 0.5),
      },
    ],
  };
}