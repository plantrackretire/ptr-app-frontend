import { roundNumber } from '../../../../utils/calcs';
import { InfoCard } from '../../../../components/InfoCard';
import { formatBalance, formatChangePercentage } from '../../../../utils/general';
import './CashflowStats.css';


interface ICashflowStats {
  totalDrawnDown: number | null,
  totalAssetsBoy: number | null,
}

export const CashflowStats: React.FC<ICashflowStats> = ({ totalDrawnDown, totalAssetsBoy }) => {

  if(totalDrawnDown === null || totalAssetsBoy === null) {
    return (
      <div className="cashflow-stats">
        <InfoCard title={null} />
        <InfoCard title={null} />
        <InfoCard title={null} />
      </div>
    );
  
  }
  const drawdownRate = totalAssetsBoy === 0 ? 0 : roundNumber((totalDrawnDown / totalAssetsBoy), 2);

  return (
    <div className="cashflow-stats">
      <InfoCard
        title="Total Assets at Beginning of Period"
        middleContent={ <span className="de-emphasize">{formatBalance(totalAssetsBoy === null ? 0 : totalAssetsBoy)}</span> }
      />
      <InfoCard
        title="Total Drawn Down"
        middleContent={ <span className="de-emphasize">{formatBalance(totalDrawnDown === null ? 0 : Math.abs(totalDrawnDown))}</span> }
      />
      <InfoCard
        title="Drawdown Rate"
        middleContent={ <span className="de-emphasize">{formatChangePercentage(drawdownRate === null ? 0 : Math.abs(drawdownRate))}</span> }
      />
    </div>
  );
};