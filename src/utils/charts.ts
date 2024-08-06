import { ActiveElement, ChartEvent, Tick } from "chart.js";
import { AppColors, AppFonts, ChartColorTypes, IChartColors, IConfigContext } from "../providers/ConfigProvider";
import { getTextWidth, hexToRgb, invalidValue } from "./general";

export const createOptionsRecord = (
    chartType: string, 
    config: IConfigContext, 
    title: string, 
    indexAxis: string,
    toolTipCallback: (((tooltipItem: any) => void) | undefined), 
    xAxisTickRenderer: ((value: string | number, index: number, ticks: Tick[]) => void) | undefined,
    yAxisTickRenderer: ((value: string | number, index: number, ticks: Tick[]) => void) | undefined,
    formatValueOnBar: ((value: any) => any) | undefined,
    shouldDrawXAxisLine: boolean,
    shouldDrawYAxisLine: boolean,
    hoverOffset?: number | undefined,
    padding?: { left: number, right: number, top: number, bottom: number } | undefined,
    handleOnHover?: ((keyValue: number) => void) | undefined) => {
    
    const options: { [index: string]: any } = {
      responsive: true,
      maintainAspectRatio: false,
      normalized: true,
      showLine: true,
      pointRadius: 0,
      animation: { 
        duration: 1000,
      },
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
        },
        title: {
          display: false,
          text: title,
        },
      },
      scales: {
        x: {
          display: xAxisTickRenderer !== undefined,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            beginAtZero: true,
          },
        },
        y: {
          display: yAxisTickRenderer !== undefined,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            beginAtZero: true,
          },
        },
      },
    };  
  
    if(chartType === 'pie') {
      options.spacing = 0;
      options.hoverOffset = hoverOffset;
      if(padding !== undefined) {
        options.layout = {
          padding: {
            left: padding.left,
            right: padding.right,
            top: padding.top,
            bottom: padding.bottom,
          }
        };
      }
    }

    if(handleOnHover) {
      options.onHover = (_event: ChartEvent, activeElements: ActiveElement[]) => {
        let chartHoverLookupValue = 0;
        if(activeElements.length > 0) {
          const el: any = (activeElements[0].element as any);
          chartHoverLookupValue = el.$context.raw.lookupValue;
        }
        handleOnHover(chartHoverLookupValue);
      };
    }  

    if(toolTipCallback) {
      options.plugins.tooltip = {
        intersect: false,
        mode: (chartType === "pie" ? "point" as const : "index" as const),
        backgroundColor: config?.getColor(AppColors.darkGrey),
        callbacks: {
          label: toolTipCallback,
        },
        padding: 10,
      };
    } else {
      options.plugins.tooltip = {
        enabled: false,
      };
  
      // *** This avoids unecessary calls to onComplete on hover (no visible impact), if onHover is needed get rid of this or edit it.
      // Another way to do this is to set options: { hover: { mode: false; } }, but onComplete will be called on hover, (ok if not a performance issue).
      // If onHover functionality is needed then get rid of this and execute onComplete for both onProgress and onComplete.
      // If onProgress causes issues (visually looks bad) google for other solutions (look at github issues link in charting bookmark folder).
      options.events = [];
    }
  
    options.indexAxis = indexAxis;
    if(xAxisTickRenderer) {
      options.scales.x.ticks = { callback: xAxisTickRenderer }
    };
    if(yAxisTickRenderer) {
      options.scales.y.ticks = { callback: yAxisTickRenderer }
    };
  
    if(formatValueOnBar) {
      options.animation = {        
        // This renders labels after animation completes, also call for onProgress to have it animate too
        onProgress: function() { 
          if(indexAxis === "x") {
            drawValuesOnVerticalBars(this, config!, formatValueOnBar);
          } else {
            drawValuesOnHorizontalBars(this, config!, formatValueOnBar);
          }
          if(shouldDrawXAxisLine) {
            drawXAxisLine(this, config!);
          }
          if(shouldDrawYAxisLine) {
            drawYAxisLine(this, config!);
          }
        },
        onComplete: function() { 
          if(indexAxis === "x") {
            drawValuesOnVerticalBars(this, config!, formatValueOnBar);
          } else {
            drawValuesOnHorizontalBars(this, config!, formatValueOnBar);
          }
          if(shouldDrawXAxisLine) {
            drawXAxisLine(this, config!);
          }
          if(shouldDrawYAxisLine) {
            drawYAxisLine(this, config!);
          }
        },
      }
    }
  
    return options;
  }

  const drawValuesOnHorizontalBars = function(chart: any, config: IConfigContext, formatValueOnBar: ((value: any) => any) | undefined) {
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
        const formattedData = formatValueOnBar ? formatValueOnBar(data) : data;
  
        // Placement of text:  check if text fits in bar, if not place it outside the bar (depending on positive/negative and amount of space)
        const [textWidth, _textHeight] = getTextWidth(formattedData, ctx.font);
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
    });
  }

  const drawValuesOnVerticalBars = function(chart: any, config: IConfigContext, formatValueOnBar: ((value: any) => any) | undefined) {
    const ctx = chart.ctx;
    ctx.font = ".9em " + config?.getFont(AppFonts.defaultFont);
    ctx.textAlign = 'center';
    ctx.fillStyle = config?.getColor(AppColors.darkGrey);
  
    let y = 0;
    // Figure out pixel space available on left and right side of zero line to determine where to put labels that don't fit in bar
    const chartHeight = chart.chartArea.height;
    const textPadding = 5;
  
    chart.data.datasets.forEach(function (dataset: any, i: any) {
      let meta = chart.getDatasetMeta(i);
  
      meta.data.forEach(function (bar: any, index: any) {
        let data = dataset.data[index];
        const formattedData = formatValueOnBar ? formatValueOnBar(data) : data;
  
        // Placement of text:  check if text fits in bar, if not place it outside the bar (depending on positive/negative and amount of space)
        // barHeight is the pixel height of the bar. y is pixel value from 0, which starts at top of chart.
        // chartHeight is the height of the chart area, not including axis labels.
        // bar.base equals the start of the bar, usually zero point.  bar.x is end of bar, the value of data data point.
        const [textWidth, textHeight] = getTextWidth(formattedData, ctx.font);
        // Using getProps because during animation bar.width is NaN, this gives the final width throughout animation.
        const barHeight = bar.getProps(['height'], true).height;
        if(barHeight > (textHeight + (textPadding*2))) {
          if(data > 0) { 
            ctx.textBaseline = 'top';
            y = bar.y + textPadding;
          } else if(data <= 0) { // Including zero in this case but zero should not fall in here since bar won't fit text.
            ctx.textBaseline = 'bottom';
            y = bar.y - textPadding;
          }
        } else { // Figure out if text fits on top or bottom of bar, prefer end of bar (top for positive, bottom for negative).
          if(data >= 0) { // Preference is to put text on top of positive bar.
            if(bar.y > (textHeight + (textPadding*2))) {
              ctx.textBaseline = 'bottom';
              y = bar.y - textPadding;
            } else { // Text doesn't fit on top of bar, must fit on bottom then.
              ctx.textBaseline = 'top';
              y = bar.base + textPadding;
            }
          } else { // data < 0, Preference is to put text on bottom of negative bar.
            if((chartHeight - bar.y) > (textWidth + (textPadding*2))) {
              ctx.textBaseline = 'top';
              y = bar.y + textPadding;
            } else { // Text doesn't fit on bottom side of bar, must fit on top then.
              ctx.textBaseline = 'bottom';
              y = bar.base - textPadding;
            }
          }
        }
        ctx.fillText(formattedData, bar.x, y);
      });
    });
  }

// Draw vertical line at zero point (baseline) if it is not at the left edge (yAxisWidth)
const drawXAxisLine = (chart: any, config: IConfigContext) => {
    const ctx = chart.ctx;
    const chartHeight = chart.chartArea.height;

    chart.data.datasets.forEach(function (_dataset: any, i: any) {
      let meta = chart.getDatasetMeta(i);
      const baseline = meta.data[0].base;

      // Draw horizontal line at zero point (baseline) if it is not at the bottom edge (baseline)
      if(baseline !== chartHeight) {
        ctx.beginPath();
        ctx.strokeStyle = config?.getColor(AppColors.mediumGrey);
        ctx.moveTo(chart.chartArea.left, baseline);
        ctx.lineTo(chart.chartArea.right, baseline);
        ctx.stroke();
      }
    });
}

// Draw vertical line at zero point (baseline) if it is not at the left edge (yAxisWidth)
const drawYAxisLine = (chart: any, config: IConfigContext) => {
  const ctx = chart.ctx;
  const yAxisWidth = chart.scales.y.width;

  chart.data.datasets.forEach(function (_dataset: any, i: any) {
      let meta = chart.getDatasetMeta(i);

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

// Draw a line - for the part overlapping the chart make is solid with lineColor, for rest make it grey and dotted.
export const drawVerticalLine = (chart: any, config: IConfigContext, lineColor: string) => {
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
    ctx.strokeStyle = lineColor;
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

export const getChartColors = (data: number[], chartColors: IChartColors, colorType: ChartColorTypes): [string[], string[]] => {
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];
  
    data.map((_value, index) => {
      switch(colorType) {
        case ChartColorTypes.singleColor:
          backgroundColors.push(hexToRgb(chartColors.singleColor, 0.5));
          borderColors.push(chartColors.singleColor);
          break;
        case ChartColorTypes.alternatingColors:
          if(index % 2) {
            backgroundColors.push(hexToRgb(chartColors.alternatingColors[1], 0.5));
            borderColors.push(chartColors.alternatingColors[1]);
          } else {
            backgroundColors.push(hexToRgb(chartColors.alternatingColors[0], 0.5));
            borderColors.push(chartColors.alternatingColors[0]);
          }
          break;
        case ChartColorTypes.sequenceColors:
          const sequenceColors = chartColors.sequenceColors;
          const sequenceLength = chartColors.sequenceColors.length;
          let colorIndex = (index % sequenceLength) - 1;
          if(colorIndex < 0) colorIndex = sequenceLength - 1;
          backgroundColors.push(hexToRgb(sequenceColors[colorIndex], 0.5));
          borderColors.push(sequenceColors[colorIndex]);
          break;
        default:
          backgroundColors.push(hexToRgb(chartColors.singleColor, 0.5));
          borderColors.push(chartColors.singleColor);
          break;
      }
    });
  
    return [backgroundColors, borderColors];
  }
  
// Lots of edge case issues, might have to try implementing without the plugin if/when this is needed.
// Commented out unused options to keep for reference.
// const createDatalabelsOptions = (options: { [index: string]: any }) => {
//   options.plugins.datalabels = {
//     color: '#FFFFFF',
//     anchor: 'center',
//     align: 'center',
//     // textAlign: 'center',
//     // offset: 4,
//     clip: false,
//     clamp: true,
//     // align: function(ctx: Context){
//     //   const meta = ctx.chart.getDatasetMeta(0);
//     //   let aggAllocation = 0;
//     //   for(let i = 0; i <= ctx.dataIndex; i++) {
//     //     const element = (meta.data[i] as any);
//     //     if(i === ctx.dataIndex) {
//     //       aggAllocation += (element.$context.raw.value / 2);
//     //     } else {
//     //       aggAllocation += element.$context.raw.value;
//     //     }
//     //   }

//     //   let fullRotation = aggAllocation * 3.6 * 100; // 3.6 degrees for every 1%
//     //   if((aggAllocation >= .25) && (aggAllocation <= .75)) {
//     //     fullRotation -= 180;
//     //   } else {
//     //     fullRotation -= 180;
//     //   }
//     //   const rotation = (fullRotation - 90);

//     //   return rotation;
//     // },
//     rotation: (ctx: Context) => {
//       const meta = ctx.chart.getDatasetMeta(0);

//       let aggAllocation = 0;
//       for(let i = 0; i <= ctx.dataIndex; i++) {
//         const element = (meta.data[i] as any);
//         if(i === ctx.dataIndex) {
//           aggAllocation += (element.$context.raw.value / 2);
//         } else {
//           aggAllocation += element.$context.raw.value;
//         }
//       }

//       let fullRotation = aggAllocation * 3.6 * 100; // 3.6 degrees for every 1%
//       if(aggAllocation > .5) {
//         fullRotation -= 180;
//       }
//       const rotation = (fullRotation - 90);

//       return rotation;
//     },
//     // display: function(ctx: Context) {
//     //   const meta = ctx.chart.getDatasetMeta(0);
//     //   const element = (meta.data[ctx.dataIndex] as any);
//     //   return(element.$context.raw.value >= .03);
//     // },
//     formatter: function(value: any) {
//       let maxLength = 21;
//       if(value.value <= .03) {
//         maxLength = 12;
//       } else if(value.value <= .04) {
//         maxLength = 14;
//       } else if(value.value <= .05) {
//         maxLength = 16;
//       } else if(value.value <= .06) {
//         maxLength = 18;
//       }

//       let formattedLabel = value.label;
//       if(formattedLabel.length > maxLength) {
//         formattedLabel = formattedLabel.slice(0, (maxLength - formattedLabel.length - 3));
//         formattedLabel += "...";
//       }
//       return formattedLabel;

//       // Code to split into two lines
//       // if(value.label.length > 8) {
//       //   const labelLength = value.label.length;
//       //   const splitLabel = (value.label as string).split(" ");
//       //   let splitIndex = 0
//       //   let splitLength = splitLabel[splitIndex].length;
//       //   while((splitIndex < splitLabel.length-1) && (splitLength < (labelLength / 2))) {
//       //     splitIndex++
//       //     splitLength += splitLabel[splitIndex].length + 1; // + 1 is for the space between words
//       //   }
//       //   if(splitIndex == splitLabel.length-1) {
//       //     return value.label;
//       //   } else {
//       //     let line1 = ""; let line2 = "";
//       //     splitLabel.forEach((element, index) => {
//       //       if(index <= splitIndex) {
//       //         line1 += (index != 0 ? " " : "") + element;
//       //       } else {
//       //         line2 += (index != splitIndex+1 ? " " : "") + element;
//       //       }
//       //     });
//       //     return [line1, line2]
//       //   }
//       // } else return value.label;
//     },
//     labels: {
//       lookupValue: {
//         font: {
//           // weight: 'bold'
//         }
//       },
//       label: {
//         // color: 'green'
//       }
//     }
//   }
// }

  
  // FOR REFERENCE:
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
  