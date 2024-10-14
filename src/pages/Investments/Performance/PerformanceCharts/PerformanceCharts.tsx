import { IReturn } from '../Performance';
import { YtdCard } from './YtdCard';
import { YearlyChart } from './YearlyChart';
import { MultiYearChart } from './MultiYearChart';
import { ChartsTitle } from '../../../../components/Charts/ChartsTitle';
import './PerformanceCharts.css';


interface IPerformanceCharts {
    returns: { [index: string]: { [index: string]: IReturn } } | null,
    totalValue: number | null,
}

export const insufficientDataValue: number = 0.000001234567890;
export const couldNotCalculateValue: number = 0.000001234567891;

export const PerformanceCharts: React.FC<IPerformanceCharts> = ({ returns, totalValue }) => {
  let ytdReturn: number | null = null;
  let multiYearReturns: IReturn[] | null = null;
  let yearlyReturns: IReturn[] | null = null;
  let showYtdCard: boolean = true;
  let showMultiYearReturns: boolean = true;
  let showYearlyReturns: boolean = true;
  let averageAnnualReturn = null;
  
  if(returns !== null) {
    averageAnnualReturn = findReturn(returns.multiYear, 'maxYears');
    yearlyReturns = sortYearlyReturns(returns.yearly);
    multiYearReturns = sortMultiYearReturns(returns.multiYear);

    const result = yearlyReturns.length > 0 ? yearlyReturns[yearlyReturns.length-1] : null;
    if(result === null) {
      showYtdCard = false;
    } else {
      ytdReturn = result.xirr;
    }

    showYearlyReturns = Object.values(yearlyReturns).length > 0;
    if(Object.values(yearlyReturns).length === 1 && showYtdCard) { // No need to show yearly returns if only has current year.
      showYearlyReturns = false;
    }
  
    showMultiYearReturns = Object.values(multiYearReturns).length > 0;
  }

  // Set grid columns depending on how many we are showing.
  const aggregatesStyle = (showYtdCard && showMultiYearReturns) ?
    { gridTemplateColumns: "14em 1fr" } :
    { gridTemplateColumns: "1fr" };

  return (
      <div className='performance-charts'>
        <ChartsTitle titleBalance={totalValue} />
        <div className='performance-charts--aggregates' style={aggregatesStyle}>
          { showYtdCard &&
            <YtdCard
              ytdReturn={ytdReturn}
              averageAnnualReturn={averageAnnualReturn}
            />
          }
          { showMultiYearReturns &&
            <MultiYearChart
              returns={multiYearReturns}
            />
          }
        </div>
        <div className='performance-charts--years'>
          { showYearlyReturns &&
          <YearlyChart
              returns={yearlyReturns}
            />
          }
        </div>
      </div>
  );
};

const findReturn = (returns: { [index: string]: IReturn }, label: string): number | null => {
  if(label in returns) {
    return returns[label].xirr;
  } else {
    return null;
  }
}

const sortYearlyReturns = (returns: { [index: string]: IReturn }): IReturn[] => {
  return Object.values(returns).sort((a, b) => { return (a.id >= b.id) ? 1 : -1 });
}

const sortMultiYearReturns = (returns: { [index: string]: IReturn }) => {
  return Object.values(returns).sort((a, b) => { 
    switch(a.id) {
      case 'oneYear': return -1;
      case 'threeYears': if(b.id === 'oneYear') return 1; else return -1;
      case 'fiveYears': if(b.id === 'oneYear' || b.id === 'threeYears') return 1; else return -1;
      case 'tenYears': if(b.id === 'maxYears') return -1; else return 1;
      case 'maxYears': return 1;
      default: return 0;
    }
  });
}