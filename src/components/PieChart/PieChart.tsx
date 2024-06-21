import { memo, useContext, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { Context } from 'chartjs-plugin-datalabels';
import { AppColors, ConfigContext, IConfigContext } from '../../providers/ConfigProvider';
import { PieChartTitle } from './PieChartTitle';
import { PieChartPlaceholder } from './PieChartPlaceholder';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartEvent,
  ActiveElement,
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
  hoverLookupValue: number,
  hoverLookupType: string, // Is hover value based on hovering on this pie chart (internal) or an external action (external).
  createTooltipLabel: ((tooltipItem: any) => void) | null,
  handleOnHover: ((keyValue: number) => void) | null,
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
  const options = createOptionsRecord(config!, false, handleOnHover, createTooltipLabel);

  return (
    <div className="pie-chart">
        <PieChartTitle title={title} />
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

const createOptionsRecord = (config: IConfigContext, includeDatalabels: boolean, 
  handleOnHover?: ((keyValue: number) => void) | null,
  createTooltipLabel?: ((tooltipItem: any) => void) | null) => {
  const options: { [index: string]: any } = {
    responsive: true,
    maintainAspectRatio: false,
    normalized: true,
    showLine: true,
    spacing: 0,
    pointRadius: 0,
    hoverOffset: hoverOffset,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 13,
        bottom: 13,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
  };  

  if(includeDatalabels) {
    createDatalabelsOptions(options);
  }

  if(handleOnHover) {
    options.onHover = (_event: ChartEvent, activeElements: ActiveElement[]) => {
      let chartHoverLookupValue = 0;
      if(activeElements.length > 0) {
        const arcElement: any = (activeElements[0].element as any);
        chartHoverLookupValue = arcElement.$context.raw.lookupValue;
      }
      handleOnHover(chartHoverLookupValue);
    };
  }

  if(createTooltipLabel) {
    options.plugins.tooltip = {
      intersect: false,
      mode: 'point' as const,
      backgroundColor: config?.getColor(AppColors.darkGrey),
      padding: 10,
      callbacks: {
        label: createTooltipLabel,
      },
    };
  }

  return options;
}

// Lots of edge case issues, might have to try implementing without the plugin if/when this is needed.
// Commented out unused options to keep for reference.
const createDatalabelsOptions = (options: { [index: string]: any }) => {
  options.plugins.datalabels = {
    color: '#FFFFFF',
    anchor: 'center',
    align: 'center',
    // textAlign: 'center',
    // offset: 4,
    clip: false,
    clamp: true,
    // align: function(ctx: Context){
    //   const meta = ctx.chart.getDatasetMeta(0);
    //   let aggAllocation = 0;
    //   for(let i = 0; i <= ctx.dataIndex; i++) {
    //     const element = (meta.data[i] as any);
    //     if(i === ctx.dataIndex) {
    //       aggAllocation += (element.$context.raw.value / 2);
    //     } else {
    //       aggAllocation += element.$context.raw.value;
    //     }
    //   }

    //   let fullRotation = aggAllocation * 3.6 * 100; // 3.6 degrees for every 1%
    //   if((aggAllocation >= .25) && (aggAllocation <= .75)) {
    //     fullRotation -= 180;
    //   } else {
    //     fullRotation -= 180;
    //   }
    //   const rotation = (fullRotation - 90);

    //   return rotation;
    // },
    rotation: (ctx: Context) => {
      const meta = ctx.chart.getDatasetMeta(0);

      let aggAllocation = 0;
      for(let i = 0; i <= ctx.dataIndex; i++) {
        const element = (meta.data[i] as any);
        if(i === ctx.dataIndex) {
          aggAllocation += (element.$context.raw.value / 2);
        } else {
          aggAllocation += element.$context.raw.value;
        }
      }

      let fullRotation = aggAllocation * 3.6 * 100; // 3.6 degrees for every 1%
      if(aggAllocation > .5) {
        fullRotation -= 180;
      }
      const rotation = (fullRotation - 90);

      return rotation;
    },
    // display: function(ctx: Context) {
    //   const meta = ctx.chart.getDatasetMeta(0);
    //   const element = (meta.data[ctx.dataIndex] as any);
    //   return(element.$context.raw.value >= .03);
    // },
    formatter: function(value: any) {
      let maxLength = 21;
      if(value.value <= .03) {
        maxLength = 12;
      } else if(value.value <= .04) {
        maxLength = 14;
      } else if(value.value <= .05) {
        maxLength = 16;
      } else if(value.value <= .06) {
        maxLength = 18;
      }

      let formattedLabel = value.label;
      if(formattedLabel.length > maxLength) {
        formattedLabel = formattedLabel.slice(0, (maxLength - formattedLabel.length - 3));
        formattedLabel += "...";
      }
      return formattedLabel;

      // Code to split into two lines
      // if(value.label.length > 8) {
      //   const labelLength = value.label.length;
      //   const splitLabel = (value.label as string).split(" ");
      //   let splitIndex = 0
      //   let splitLength = splitLabel[splitIndex].length;
      //   while((splitIndex < splitLabel.length-1) && (splitLength < (labelLength / 2))) {
      //     splitIndex++
      //     splitLength += splitLabel[splitIndex].length + 1; // + 1 is for the space between words
      //   }
      //   if(splitIndex == splitLabel.length-1) {
      //     return value.label;
      //   } else {
      //     let line1 = ""; let line2 = "";
      //     splitLabel.forEach((element, index) => {
      //       if(index <= splitIndex) {
      //         line1 += (index != 0 ? " " : "") + element;
      //       } else {
      //         line2 += (index != splitIndex+1 ? " " : "") + element;
      //       }
      //     });
      //     return [line1, line2]
      //   }
      // } else return value.label;
    },
    labels: {
      lookupValue: {
        font: {
          // weight: 'bold'
        }
      },
      label: {
        // color: 'green'
      }
    }
  }
}