import { ColoredPercentage } from '../../../../../components/ColoredPercentage';
import { InfoButton } from '../../../../../components/InfoButton';
import { formatChangePercentage } from '../../../../../utils/general';
import './YtdCard.css';


interface IYtdCard {
  ytdReturn: number | null,
  averageAnnualReturn: number | null,
}

export const YtdCard: React.FC<IYtdCard> = ({ ytdReturn, averageAnnualReturn }) => {
  if(ytdReturn === null) {
    return (
      <div className='ytd-card'>
        <div></div>
        <div className="placeholder placeholder-heading1"><br /></div>
        <div></div>
        <div className="placeholder"><br /></div>
        <div className="placeholder"><br /></div>
        <div></div>
      </div>
    );
  }

  const percentageDiff = ytdReturn - (averageAnnualReturn ? averageAnnualReturn : 0);

  return (
      <div className='ytd-card'>
        <div className='ytd-card--title'>
          <h2>YTD Return</h2>
          <InfoButton content={ytdReturnInfo} />
        </div>
        <h1><ColoredPercentage percentage={ytdReturn} /></h1>
        { (averageAnnualReturn !== null && averageAnnualReturn !== 0) &&
          <div className='ytd-card--comparison'>
            <ColoredPercentage percentage={percentageDiff} />
            <small className='de-emphasize'>Compared to { formatChangePercentage(averageAnnualReturn) } average annualized return</small>
          </div> 
        }
      </div>
  );
};

const ytdReturnInfo = 
<div className="info-button--info">
  <h2>Year to Date Return (YTD Return)</h2>
  <div>The "Year to Date Return" shows the Internal Rate of Return (IRR) for the year up to the 'As of Date.'</div>
  <ul>
    <li className="info-button--info-indent">If the 'As of Date' is today, it shows your current return for the year.</li>
    <li className="info-button--info-indent">If the 'As of Date' is in a past year, it shows the return from the start of that year up to the selected date. For example, if the 'As of Date' is August 15, 2015, the Year to Date Return will cover January 1, 2015, to August 15, 2015.</li>
  </ul>
  <div><br /></div>
  <div>The Year to Date Return is not annualized; it reflects the return for that specific time period only.</div>
</div>;
