import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatPrice, formatQuantity } from '../../../../utils/general';
import { HoldingsFilterTypes, IHandleHoldingActionButtonClick, IHolding, IHoldingsFilter } from '../..';
import { BasicTableRow } from '../../../BasicTable/BasicTableRow';
import './HoldingRec.css';


interface IHoldingRec {
  holding: IHolding,
  filters: IHoldingsFilter[],
  handleHoldingActionButtonClick: (params: IHandleHoldingActionButtonClick) => void,
}

export const HoldingRec: React.FC<IHoldingRec> = ({ holding, filters, handleHoldingActionButtonClick }) => {
  let accountTypeCategoryId = 0;
  let accountTypeCategoryName = '';

  if(holding.accountId === 0) {
    const accountTypeCategoryFilter = filters.find(el => el.type === HoldingsFilterTypes.accountTypeCategory);
    if(accountTypeCategoryFilter) {
      accountTypeCategoryId = accountTypeCategoryFilter.filterValue[0];
      accountTypeCategoryName = accountTypeCategoryFilter.label;
    }
  }
  return (
    <BasicTableRow handleRowClick={() => (holding.accountId === 0) ?
      handleHoldingActionButtonClick({
        securityId: holding.securityId, 
        securityName: holding.securityName,
        accountTypeCategoryId: accountTypeCategoryId ? accountTypeCategoryId : undefined,
        accountTypeCategoryName: accountTypeCategoryName.length > 0 ? accountTypeCategoryName : undefined,
      })
    :
      handleHoldingActionButtonClick({
        securityId: holding.securityId, 
        securityName: holding.securityName, 
        accountId: holding.accountId, 
        accountName: holding.accountName,
      })
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