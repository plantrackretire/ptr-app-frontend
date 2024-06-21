import { formatBalanceWithoutCents } from '../../../../utils/general';
import { ColoredPercentage } from '../../../../components/ColoredPercentage';
import './ChartsTitle.css';


interface IChartsTitle {
  titleBalance: number | null,
  titleChangeFromStartDate: number | null,
}

export const ChartsTitle: React.FC<IChartsTitle> = ({ titleBalance, titleChangeFromStartDate }) => {
  if(titleBalance === null) {
    return (
      <div className='charts--title'>
        <div className="placeholder placeholder-heading2"><br /></div>
      </div>
    );
  }

  return (
    <div className="charts--title">
      <div className="charts--title-section">
        <span className="charts--title-section--label">Total:</span>
        <span className="charts--title-section--value">{formatBalanceWithoutCents(titleBalance)}</span>
      </div>
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
    </div>
  );
};
