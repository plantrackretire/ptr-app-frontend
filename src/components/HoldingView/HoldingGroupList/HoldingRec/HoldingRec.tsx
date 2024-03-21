import './HoldingRec.css';
import { SectionHeading, SectionHeadingSizeType } from '../../../SectionHeading';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatPrice, formatQuantity } from '../../../../utils/general';
import { IHolding } from '../..';


interface IHoldingRec {
  holding: IHolding,
  handleHoldingActionButtonClick: () => void,
}

export const HoldingRec: React.FC<IHoldingRec> = ({ holding, handleHoldingActionButtonClick }) => {
  return (
    <tr>
      <td>
        <span>{holding.shortName}</span>
      </td>
      <td>
        <SectionHeading
          size={SectionHeadingSizeType.small} 
          label={holding.name}
          subLabel={holding.accountName}
          handleActionButtonClick={handleHoldingActionButtonClick} 
          actionText={"View " + holding.name + " transactions"}
        />
      </td>
      <td>
        <div className="holding-group-list--two-line">
          <span>{formatPrice(holding.price)}</span>
          <small>
            {
              !('lastPriceUpdateDate' in holding) ? 'Multi' :
              holding.lastPriceUpdateDate?.month + " / " + 
                holding.lastPriceUpdateDate?.day + " / " + holding.lastPriceUpdateDate?.year
            }
          </small>
        </div>
      </td>
      <td>
        <div className="holding-group-list--two-line">
          <span>{formatQuantity(holding.quantity)}</span>
          <small>
            {
              !('lastQuantityUpdateDate' in holding) ? 'Multi' :
              holding.lastQuantityUpdateDate?.month + " / " + 
                holding.lastQuantityUpdateDate?.day + " / " + holding.lastQuantityUpdateDate?.year
            }
          </small>
        </div>
      </td>
      <td>
        <div className="holding-group-list--two-line">
          { formatBalance(holding.balance) }
          { !('ytdChangePercentage' in holding) ?
              <small>Multi</small> 
            :
              <small>
                <ColoredPercentage percentage={holding.ytdChangePercentage!} />
              </small>
          }
        </div>
      </td>
    </tr>
  );
};