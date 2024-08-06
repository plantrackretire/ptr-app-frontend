import { ReactElement, createContext, useState } from 'react';


export interface IConfigContext {
  colors: { [index: string]: string },
  chartColors: IChartColors,
  fonts: { [index: string]: string },
  getColor: (color: AppColors) => string,
  getFont: (color: AppFonts) => string,
}

export const ConfigContext = createContext<IConfigContext | null>(null);

export enum ChartColorTypes {
  singleColor = 'singleColor',
  alternatingColors = 'alternatingColors',
  sequenceColors = 'sequenceColors',
}

export enum AppColors {
  appBackgroundColor = "--app-background-color", 
  blue = "--blue",
  green = "--green",
  red = "--red",
  orange = "--orange",
  brown = "--brown",
  yellow = "--yellow",
  lightGrey = "--light-grey",
  mediumGrey = "--medium-grey",
  darkGrey = "--dark-grey",
}

export enum AppFonts {
  defaultFont = "--default-font", 
}

// Color scheme for pie chart and and other charts that need several colors, excludes greens and reds
const chartSequenceColors = [
  '#0066cc',
  '#009596',
  '#5752D1',
  '#F4C145',
  '#003737',
  '#EC7A08',
  '#B8BBBE',
  '#002F5D',
  '#C58C00',
  '#2A265F',
  '#AF8260',
  '#6A6E73',
];

export interface IChartColors {
  singleColor: string, 
  sequenceColors: string[], 
  alternatingColors: [string, string],
}

interface IConfigProps {
  children: ReactElement
}

const Config = ({children}: IConfigProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [config, setConfig] = useState<IConfigContext>(
    { colors: {}, chartColors: { singleColor: '', sequenceColors: [], alternatingColors: ['', ''], }, fonts: {}, getColor: () => '', getFont: () => '' });

  if(!isInitialized) {
    const bodyStyles = window.getComputedStyle(document.body);
    const colors: { [index: string]: string } = {};
    const fonts: { [index: string]: string } = {};
    for(let n of Object.keys(AppColors)) {
      colors[AppColors[n as keyof typeof AppColors]] = bodyStyles.getPropertyValue(AppColors[n as keyof typeof AppColors]);
    }
    for(let n of Object.keys(AppFonts)) {
      fonts[AppFonts[n as keyof typeof AppFonts]] = bodyStyles.getPropertyValue(AppFonts[n as keyof typeof AppFonts]);
    }

    const chartColors: IChartColors = {
      singleColor: chartSequenceColors[10],
      sequenceColors: chartSequenceColors,
      alternatingColors: [colors[AppColors.mediumGrey], chartSequenceColors[10]]
    };

    setConfig({
      colors: colors,
      chartColors: chartColors,
      fonts: fonts,
      getColor: function(color: AppColors): string {
        return (this as IConfigContext).colors[color];
      },
      getFont: function(font: AppFonts): string {
        return (this as IConfigContext).fonts[font];
      },
    });
    setIsInitialized(true);
  }
  
  return (
    <ConfigContext.Provider value={config}>
      { children }
    </ConfigContext.Provider>
  );
};

export const ConfigProvider = ({children}: IConfigProps) => {
  return (
    <Config>
      { children }
    </Config>
  );
};
