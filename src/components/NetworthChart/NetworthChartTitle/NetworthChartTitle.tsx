import { formatBalanceWithoutCents } from '../../../utils/general';
import { ColoredPercentage } from '../../ColoredPercentage';
import './NetworthChartTitle.css';


interface INetworthChartTitle {
  titleBalance: number,
  titleAnnualPercentageChange: number,
  titleChangeFromStartDate: number | null,
}

export const NetworthChartTitle: React.FC<INetworthChartTitle> = ({ titleBalance, titleAnnualPercentageChange, titleChangeFromStartDate }) => {
  return (
    <div className="networth-chart--title">
      <div className="networth-chart--title-section">
        <span className="networth-chart--title-section--label">Total:</span>
        <span className="networth-chart--title-section--value">{formatBalanceWithoutCents(titleBalance)}</span>
      </div>
      <div className="networth-chart--title-section">
        <span className="networth-chart--title-section--label">Annual Chg:</span>
        <span className="networth-chart--title-section--value"><ColoredPercentage percentage={titleAnnualPercentageChange} /></span>
      </div>
      <div className="networth-chart--title-section">
        <span className="networth-chart--title-section--label">Ytd Chg:</span>
        <span className="networth-chart--title-section--value">
          { titleChangeFromStartDate === null ?
              <span className="networth-chart--title-section--label">N/A</span>
            :
              <ColoredPercentage percentage={titleChangeFromStartDate} />
          }
        </span>
      </div>
    </div>
  );
};
