import { formatBalanceWithoutCents } from '../../../utils/general';
import { ColoredPercentage } from '../../ColoredPercentage';
import './ChartsTitle.css';


interface IChartsTitle {
  titleBalance: number | null,
  titleAnnualPercentageChange?: number,
  titleChangeFromStartDate?: number | null,
}

export const ChartsTitle: React.FC<IChartsTitle> = ({ titleBalance, titleAnnualPercentageChange, titleChangeFromStartDate }) => {
  if(titleBalance === null) {
    return (
      <div className='charts--title'>
        <div className="placeholder placeholder-heading2"><br /></div>
      </div>
    );
  }

  const showAnnualPercentageChange = titleAnnualPercentageChange !== undefined;
  const showTitleChangeFromStartDate = titleChangeFromStartDate !== undefined;

  return (
    <div className="charts--title">
      <div className="charts--title-section">
        <span className="charts--title-section--label">Total:</span>
        <span className="charts--title-section--value">{formatBalanceWithoutCents(titleBalance)}</span>
      </div>
      { showAnnualPercentageChange &&
        <div className="charts--title-section">
          <span className="charts--title-section--label">Annual Chg:</span>
          <span className="charts--title-section--value"><ColoredPercentage percentage={titleAnnualPercentageChange} /></span>
        </div>
      }
      { showTitleChangeFromStartDate &&
        <div className="charts--title-section">
          <span className="charts--title-section--label">Ytd Chg:</span>
          <span className="charts--title-section--value">
            { titleChangeFromStartDate === null ?
                <span className="charts--title-section--label">N/A</span>
              :
                <ColoredPercentage percentage={titleChangeFromStartDate} />
            }
          </span>
        </div>
      }
    </div>
  );
};
