import { ReactElement, createContext, useState } from 'react';


export interface IConfigContext {
  colors: { [index: string]: string },
  fonts: { [index: string]: string },
  getColor: (color: AppColors) => string,
  getFont: (color: AppFonts) => string,
}

export const ConfigContext = createContext<IConfigContext | null>(null);

export enum AppColors {
  appBackgroundColor = "--app-background-color", 
  blue = "--blue",
  green = "--green",
  red = "--red",
  lightGrey = "--light-grey",
  mediumGrey = "--medium-grey",
  darkGrey = "--dark-grey",
}

export enum AppFonts {
  defaultFont = "--default-font", 
}

interface IConfigProps {
  children: ReactElement
}

const Config = ({children}: IConfigProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [config, setConfig] = useState<IConfigContext>({ colors: {}, fonts: {}, getColor: () => '', getFont: () => '' });

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
    setConfig({
      colors: colors,
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
