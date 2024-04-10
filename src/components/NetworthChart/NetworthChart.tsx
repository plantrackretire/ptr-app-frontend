import './NetworthChart.css';
import { Fragment, useEffect, useState, memo, useContext } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import annotationPlugin from "chartjs-plugin-annotation";
import { calcChangeFromDataSet } from '../../utils/calcs';
import { adjustDateByYear, calcDiffInYears, createDateFromString } from '../../utils/dates';
import { AppColors, AppFonts, ConfigContext, IConfigContext } from '../../providers/ConfigProvider';
import { formatBalance, formatChangePercentage, getTextWidth, hexToRgb } from '../../utils/general';
import { NetworthChartTitle } from './NetworthChartTitle';

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
  Ticks,
  Tick,
  ChartComponentLike,
} from 'chart.js';
import { NetworthChartOptions } from './NetworthChartOptions';


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

interface INetworthChart {
  labels: string[],
  balances: number[],
}

const invalidValue: number = 0.000001234567890;

// Using memo because without it the chart re-renders (causing flickering of the annotation) on every call, even if params did not change.
export const NetworthChart: React.FC<INetworthChart> = memo(({ labels, balances }) => {
  const [hoverVerticalLinePluginRef, setHoverVerticalLinePluginRef] = useState<ChartComponentLike | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>("ALL");
  const [units, setUnits] = useState<string>("Months");
  const [yearValueType, setYearValueType] = useState<string>("$");
  
  const config = useContext(ConfigContext);

  // useEffect required to register action and have it execute.  Doing it outside of useEffect has not actual effect
  useEffect(() => {    
    if(units === "Months") {
      if(!hoverVerticalLinePluginRef) {
        // Draws a vertical line on the x coord of the value currently displaying a tootlip
        const hoverVerticalLinePlugin = {
          id: 'hoverVerticalLine', //typescript crashes without id
          afterDraw: (chart: any) => {
            drawVerticalLine(chart, config!);
          },
        }
        ChartJS.register([hoverVerticalLinePlugin]);
        setHoverVerticalLinePluginRef(hoverVerticalLinePlugin); // Save a reference to avoid rendering unecessarily
      }
    } else { // units === Years
      if(hoverVerticalLinePluginRef) {
        ChartJS.unregister(hoverVerticalLinePluginRef);
        setHoverVerticalLinePluginRef(null);
      }
    }
  });

  // Filter data based on time period selected, and convert to percentages if percentage view selected
  const [filteredLabels, filteredBalances] = filterChartData(labels, balances, units, timePeriod);
  let dataLabels = filteredLabels;
  let dataValues = filteredBalances;
  if(units === "Years" && yearValueType === "%") {
    dataLabels = filteredLabels.slice(1); // Drop first year because we cannot calculate a percentage change for it
    dataValues = createChangesInValue(filteredBalances); // Calc change in value percentage for each year (except first)
  }

  const data = createDataRecord(dataLabels, dataValues, config!, units);
  const options = createOptionsRecord(config!, units, yearValueType);
  const titlePercentageChange = calcPercentageChange(filteredLabels, filteredBalances); // Not using dataValues because they may be percentages

  let chartHeight = "350px";
  if(units === "Years") {
    const numYears = calcDiffInYears(new Date(labels[0]), new Date(labels[labels.length-1]));
    if(numYears > 8) {
      chartHeight = (numYears * 30).toString() + "px";
    } else {
      chartHeight = "200px";
    }
  }

  return (
    <div className="networth-chart">
      { balances.length > 0 ?
        <Fragment>
          <NetworthChartTitle titleBalance={filteredBalances[filteredBalances.length-1]} titlePercentageChange={titlePercentageChange} />
          <div className="networth-chart--chart"  style={{ height: chartHeight }}>
            { units === "Months" ? <Line options={options} data={data} /> : <Bar options={options} data={data} /> }
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

const createDataRecord = (dataLabels: string[], dataValues: number[], config: IConfigContext, units: string) => {
  const [backgroundColors, borderColors] = getBarColors(dataValues, config!);
  return {
    labels: dataLabels,
    datasets: [
      {
        label: 'Net Worth',
        barPercentage: 1,
        maxBarThickness: 30,
        minBarLength: 0,
        data: dataValues,
        fill: true,
        borderColor: units === "Months" ? config?.getColor(AppColors.blue) : borderColors,
        backgroundColor: units === "Months" ? hexToRgb(config?.getColor(AppColors.blue), 0.5) : backgroundColors,
      },
    ],
  };
}

const createOptionsRecord = (config: IConfigContext, units: string, yearValueType: string) => {
  const options: { [index: string]: any } = {
    responsive: true,
    maintainAspectRatio: false,
    normalized: true,
    showLine: true,
    pointRadius: 0,
    plugins: {
      legend: {
        display: false,
        position: 'top' as const,
      },
      title: {
        display: false,
        text: 'Net Worth',
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          drawOnChartArea: false,
        },
      },
      y: {
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };  

  if(units === "Months") {
    options.plugins.tooltip = {
      intersect: false,
      mode: "index" as const,
      backgroundColor: config?.getColor(AppColors.darkGrey),
      callbacks: {
        label: function(tooltipItem: any) { return tooltipItem.dataset.label + ': ' + formatBalance(tooltipItem.raw); },
      }
    };
    options.scales.y.ticks ={
      // Include a dollar sign in the ticks
      callback: function(value: string | number, index: number, ticks: Tick[]) {
        return '$' + Ticks.formatters.numeric.apply(this, [value as number, index, ticks]);
      }
    };
  } else {
    options.plugins.tooltip = {
      enabled: false,
    };
    options.indexAxis = 'y';
    options.elements = {
      bar: {
        borderWidth: 1,
      }
    };
    options.scales.y.ticks = {
      // Extract year
      callback: function(_value: string | number, index: number, _ticks: Tick[]) {
        return (this.getLabelForValue(index) as string).slice(0, 4);
      }
    };
    options.layout = {
      padding: {
        left: 0,
        right: 0,
      },
    };
  }

  if(units === "Years") {
    options.animation = {        
      // This renders labels after animation completes, also call for onProgress to have it animate too
      onProgress: function() { 
        drawDecorations(this, config!, yearValueType);
      },
      onComplete: function() { 
        drawDecorations(this, config!, yearValueType);
      },
    }
    // *** This avoids unecessary calls to onComplete on hover (no visible impact), if onHover is needed get rid of this or edit it.
    // Another way to do this is to set options: { hover: { mode: false; } }, but onComplete will be called on hover, (ok if not a performance issue).
    // If onHover functionality is needed then get rid of this and execute onComplete for both onProgress and onComplete.
    // If onProgress causes issues (visually looks bad) google for other solutions (look at github issues link in charting bookmark folder).
    options.events = [];
  }

  return options;
}

const drawVerticalLine = (chart: any, config: IConfigContext) => {
  if (chart?.tooltip?.opacity) {
    const ctx = chart.ctx;
    const x = chart.tooltip?.caretX;
    const y = chart.tooltip?.caretY;
    const topy = chart.scales.y.top;
    const bottomy = chart.scales.y.bottom;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([0]);
    ctx.moveTo(x, y);
    ctx.lineTo(x, bottomy);
    ctx.strokeStyle = config?.getColor(AppColors.blue);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, topy);
    ctx.lineTo(x, y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = config?.getColor(AppColors.mediumGrey);
    ctx.setLineDash([5]);
    ctx.stroke();
    ctx.restore();
  }
}

const drawDecorations = function(chart: any, config: IConfigContext, yearValueType: string) {
  const ctx = chart.ctx;
  ctx.font = "11px " + config?.getFont(AppFonts.defaultFont);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = config?.getColor(AppColors.darkGrey);

  let x = 0;
  // Figure out pixel space available on left and right side of zero line to determine where to put labels that don't fit in bar
  const chartWidth = chart.chartArea.width;
  const yAxisWidth = chart.scales.y.width;
  const textPadding = 5;
  chart.data.datasets.forEach(function (dataset: any, i: any) {
    let meta = chart.getDatasetMeta(i);

    meta.data.forEach(function (bar: any, index: any) {
      const data = dataset.data[index];
      let formattedData = "";

      // Placement of text:  check if text fits in bar, if not place it outside the bar (depending on positive/negative and amount of space)
      if(yearValueType === "$") {
        formattedData = formatBalance(data);
      } else {
        if(data == invalidValue) {
          formattedData = "Not Available";
        } else {
          switch(true) {
            case data > 0: 
              formattedData = "▲ " + formatChangePercentage(data); break;
            case data < 0: 
              formattedData = "▼ " + formatChangePercentage(data); break;
            default:
              formattedData = formatChangePercentage(data); break;
          }
        }
      }
      const textWidth = getTextWidth(formattedData, ctx.font);
      // Using getPros because during animation bar.width is NaN, this gives the final width throughout animation
      const barWidth = bar.getProps(['width'], true).width;
      // bar.base equals the start of the bar, usually zero point.  bar.x is end of bar, the value of data data point
      if(barWidth > (textWidth + (textPadding*2))) {
        if(data > 0) { 
          ctx.textAlign = 'end';
          x = bar.x - textPadding;
        } else if(data <= 0) { // Including zero in this case but zero should not fall in here since bar won't fit text
          ctx.textAlign = 'start';
          x = bar.x + textPadding;
        }
      } else { // Figure out if text fits on left or right side of bar, prefer end of bar (right for positive, left for negative)
        // Have to subtract the width of the y axis from the bar x location as it includes the y axis, and the chart width does not
        if(data >= 0 || data === invalidValue) { // Preference is to put text on right side of positive bar, including 0 and invalid values
          if((chartWidth - (bar.x - yAxisWidth)) > (textWidth + (textPadding*2))) {
            ctx.textAlign = 'start';
            x = bar.x + textPadding;
          } else { // Text doesn't fit on right side of bar, must fit on left then
            ctx.textAlign = 'end';
            x = bar.base - textPadding;
          }
        } else { // data < 0, Preference is to put text on left side of negative bar
          if(((bar.x - yAxisWidth)) > (textWidth + (textPadding*2))) {
            ctx.textAlign = 'end';
            x = bar.x - textPadding;
          } else { // Text doesn't fit on left side of bar, must fit on right then
            ctx.textAlign = 'start';
            x = bar.base + textPadding;
          }
        }
      }
      ctx.fillText(formattedData, x, bar.y);
    });
    
    // Draw vertical line at zero point (baseline) if it is not at the left edge (yAxisWidth)
    const baseline = meta.data[0].base;
    if(baseline !== yAxisWidth) {
      ctx.beginPath();
      ctx.strokeStyle = config?.getColor(AppColors.mediumGrey);
      ctx.moveTo(baseline, chart.chartArea.top);
      ctx.lineTo(baseline, chart.chartArea.bottom);
      ctx.stroke();
    }
  });
}

const getBarColors = (data: number[], config: IConfigContext): [string[], string[]] => {
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];

  data.map((_value, index) => {
    if(index % 2) {
      backgroundColors.push(hexToRgb(config?.getColor(AppColors.blue), 0.5));
      borderColors.push(config?.getColor(AppColors.blue));
    } else {
      backgroundColors.push(hexToRgb(config?.getColor(AppColors.mediumGrey), 0.5));
      borderColors.push(config?.getColor(AppColors.mediumGrey));
    }
  });

  return [backgroundColors, borderColors];
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


// To include a custom annotation on the chart:
//  const options: { [index: string]: any } = {
//    plugins: {
//      annotation: {
//        clip: false,
//        annotations: {
//          label1: {
//            type: 'label' as const,
//            drawTime: 'afterDatasetsDraw',
//            content: [formattedValueChangePercentage, balanceFormatter.format(titleValue), 'NET WORTH', titleDate],
//            backgroundColor: config?.colors.appBackgroundColor ? hexToRgb(config?.colors.appBackgroundColor, 0.75) : "#949494",
//            borderRadius: 8,
//              color: [
//              valueChangePrecentageColor, 
//              '#4B4B4B', 
//              config?.colors.mediumGrey || '#949494', 
//              config?.colors.mediumGrey || '#949494',
//            ],
//            font: [
//              { size: 12 },
//              { size: 18 },
//              { size: 12 },
//              { size: 10 },
//            ],
//          },
//        },
//      }
//    },
//  };
//
//  let xPosition:string = "", yPosition:string = "", xMaxMultiplier:number = 0.01;
//  if(units === "Months") {
//    if(values[values.length-1] > values[0]) {
//      xPosition = "min"; yPosition = "max";
//    } else if (values[values.length-1] < values[0]) {
//      xPosition = "max";  yPosition = "max";
//    } else {
//      xPosition = "min"; yPosition = "max";
//    }
//  } else {
//    xPosition = "max"; yPosition = "min"; xMaxMultiplier = 0.01;
//  }
//
//  const annotation = options.plugins.annotation.annotations.label1;
//  annotation.xValue = (context: any) => xPosition === "max" ? 
//  context.chart.scales.x.max - (context.chart.scales.x.max * xMaxMultiplier) : 
//  context.chart.scales.x.min + (context.chart.scales.x.max*.25);
//  annotation.yValue = (context: any) => yPosition === "max" ? context.chart.scales.y.max : context.chart.scales.y.min;
//  annotation.position = { x: xPosition === "max" ? "end" : "center", y: "start" as const };



// Use image in annotations and elsewhere:
// import arrowUp from '../../assets/arrow-up.png';
// const img = new Image();
// img.src =arrowUp;
// img.width = 25; *** Won't render without width/height
// img.height = 25;
// In annotation:
//  content: img

// Format chart area:
//  use canvas, e.g.:
//    .networth--main canvas {
//      padding: .75em 1em .75em 1em;
//      border: 1px solid var(--light-grey);
//    }

// Example using faker numbers
// const labels2 = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
// export const data = {
//   labels,
//   datasets: [
//     {
//       label: 'Dataset 2',
//       data: dateLabels.map(() => faker.number.int({ min: -1000, max: 1000 })),
//       borderColor: 'rgb(53, 162, 235)',
//       backgroundColor: 'rgba(53, 162, 235, 0.5)',
//     },
//   ],
// };
