import './AccountHolding.css';
import { IHolding } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatQuantity } from '../../../../utils/general';


interface IAccountHolding {
  accountHolding: IHolding,
  handleHoldingActionButtonClick: () => void,
}

export const AccountHolding: React.FC<IAccountHolding> = ({ accountHolding, handleHoldingActionButtonClick }) => {
  return (
    <tr key={accountHolding.holdingId} className="basic-table--sub-row" onClick={handleHoldingActionButtonClick}>
      <td><br /></td>
      <td>
        <small>{accountHolding.accountName}</small>
      </td>
      <td><br /></td>
      <td>
        <div className="basic-table--two-line">
          <span>{formatQuantity(accountHolding.quantity)}</span>
          <small>
            {
              !('lastQuantityUpdateDate' in accountHolding) ? 'Multi' :
              accountHolding.lastQuantityUpdateDate!.getMonth()+1 + " / " + 
                accountHolding.lastQuantityUpdateDate!.getDate() + " / " + accountHolding.lastQuantityUpdateDate!.getFullYear()
            }
          </small>
        </div>
      </td>
      <td>
        <div className="basic-table--two-line">
          <span>{ formatBalance(accountHolding.balance) }</span>
          { !('changeInValue' in accountHolding) ?
              <small>Multi</small> 
            :
              <small>
                <ColoredPercentage percentage={accountHolding.changeInValue!} />
              </small>
          }
        </div>
      </td>
    </tr>
  );
};