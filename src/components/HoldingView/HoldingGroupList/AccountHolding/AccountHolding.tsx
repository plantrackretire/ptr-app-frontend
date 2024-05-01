import { IHolding } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatQuantity } from '../../../../utils/general';
import { BasicTableSubRow } from '../../../BasicTable/BasicTableSubRow';
import './AccountHolding.css';


interface IAccountHolding {
  accountHolding: IHolding,
  handleHoldingActionButtonClick: (securityId: number, securityName: string, accountId?: number, accountName?: string) => void,
}

export const AccountHolding: React.FC<IAccountHolding> = ({ accountHolding, handleHoldingActionButtonClick }) => {
  return (
    <BasicTableSubRow handleRowClick={() => 
        handleHoldingActionButtonClick(accountHolding.securityId, accountHolding.securityName, accountHolding.accountId, accountHolding.accountName)}
    >
      <td><br /></td>
      <td>
        <small>{accountHolding.accountName}</small>
      </td>
      <td><br /></td>
      <td>
        <div className="two-line">
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
        <div className="two-line">
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
    </BasicTableSubRow>
  );
};