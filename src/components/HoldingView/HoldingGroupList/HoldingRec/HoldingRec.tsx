import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatPrice, formatQuantity } from '../../../../utils/general';
import { IHolding } from '../..';
import { BasicTableRow } from '../../../BasicTable/BasicTableRow';
import './HoldingRec.css';


interface IHoldingRec {
  holding: IHolding,
  handleHoldingActionButtonClick: (securityId: number, securityName: string, accountId?: number, accountName?: string) => void,
}

export const HoldingRec: React.FC<IHoldingRec> = ({ holding, handleHoldingActionButtonClick }) => {
  return (
    <BasicTableRow handleRowClick={() => (holding.accountId === 0) ?
      handleHoldingActionButtonClick(holding.securityId, holding.securityName)
    :
      handleHoldingActionButtonClick(holding.securityId, holding.securityName, holding.accountId, holding.accountName)
    }>
      <td>
        <span>{holding.securityShortName}</span>
      </td>
      <td>
        <div className="two-line">
          <span>{holding.securityName}</span>
          <small>
            { holding.accountName }
          </small>
        </div>
      </td>
      <td className='nowrap'>
        <div className="two-line">
          <span>{formatPrice(holding.price)}</span>
          <small>
            {
              !('lastPriceUpdateDate' in holding) ? 'Multi' :
              holding.lastPriceUpdateDate!.getMonth()+1 + " / " + 
                holding.lastPriceUpdateDate?.getDate() + " / " + holding.lastPriceUpdateDate?.getFullYear()
            }
          </small>
        </div>
      </td>
      <td className='nowrap'>
        <div className="two-line">
          <span>{formatQuantity(holding.quantity)}</span>
          <small>
            {
              !('lastQuantityUpdateDate' in holding) ? 'Multi' :
              holding.lastQuantityUpdateDate!.getMonth()+1 + " / " + 
                holding.lastQuantityUpdateDate?.getDate() + " / " + holding.lastQuantityUpdateDate?.getFullYear()
            }
          </small>
        </div>
      </td>
      <td className='nowrap'>
        <div className="two-line">
          { formatBalance(holding.balance) }
          { !('changeInValue' in holding) ?
              <small>Multi</small> 
            :
              <small>
                <ColoredPercentage percentage={holding.changeInValue!} />
              </small>
          }
        </div>
      </td>
    </BasicTableRow>
  );
};