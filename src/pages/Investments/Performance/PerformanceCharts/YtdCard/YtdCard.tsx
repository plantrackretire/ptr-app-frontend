import { ColoredPercentage } from '../../../../../components/ColoredPercentage';
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
        <h2>YTD Return</h2>
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