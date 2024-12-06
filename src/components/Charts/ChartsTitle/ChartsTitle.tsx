import { formatBalanceWithoutCents } from '../../../utils/general';
import { ColoredPercentage } from '../../ColoredPercentage';
import { InfoButton } from '../../InfoButton';
import './ChartsTitle.css';


interface IChartsTitle {
  titleBalance: number | null,
  titleAnnualPercentageChange?: number | null,
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
          <span className="charts--title-section--value">
            { titleAnnualPercentageChange === null ?
                <span className="charts--title-section--label">N/A</span>
              :
                <ColoredPercentage percentage={titleAnnualPercentageChange} />
            }
          </span>
          <InfoButton content={annualChgInfo} />
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
          <InfoButton content={ytdChgInfo} />
        </div>
      }
    </div>
  );
};

const annualChgInfo = 
<div className="info-button--info">
  <h2>Annual Change (Annual Chg)</h2>
  <div>The "Annual Change" shows the average change in value each year over a period of time. It looks at how much something has increased or decreased in value each year and then calculates the average.</div>
  <div>If we only have data for part of a year, it will just use the change for that portion of the year.</div>
  <div><br /></div>
  <div>It’s important to know that this is not the same as measuring how well an investment is doing.</div>
  <div className="info-button--info-indent">For example, if you buy more of something during the year, the value will go up, but this doesn’t mean you’ve earned a return—just that you’ve added more of it. That’s why the increase shows up as a change in value, not as investment performance.</div>
</div>;

const ytdChgInfo = 
<div className="info-button--info">
  <h2>Year to Date Change (YTD Chg)</h2>
  <div>The "Year-to-Date Change" shows how much the value of something has changed from the start of the year up to a specific end date.</div>
  <div>The end date is set by the 'As of Date' filter, and the comparison starts from the beginning of that same year.</div>
  <div><br /></div>
  <div>It’s important to know that this is not the same as measuring how well an investment is doing.</div>
  <div className="info-button--info-indent">For example, if you buy more of something during the year, the value will go up, but this doesn’t mean you’ve earned a return—just that you’ve added more of it. That’s why the increase shows up as a change in value, not as investment performance.</div>
</div>;
