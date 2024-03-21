import './NetworthChartTitle.css';
import { formatBalance } from '../../../utils/general';
import { ColoredPercentage } from '../../ColoredPercentage';


interface INetworthChartTitle {
  titleBalance: number,
  titlePercentageChange: number,
}

export const NetworthChartTitle: React.FC<INetworthChartTitle> = ({ titleBalance, titlePercentageChange }) => {
  return (
    <div className="networth-chart--title">
      <div className="networth-chart--title-section">
        <span className="networth-chart--title-section--label">Networth:</span>
        <span className="networth-chart--title-section--value">{formatBalance(titleBalance)}</span>
      </div>
      <div className="networth-chart--title-section">
        <span className="networth-chart--title-section--label">Annual Change:</span>
        <span className="networth-chart--title-section--value"><ColoredPercentage percentage={titlePercentageChange} /></span>
      </div>
    </div>
  );
};
