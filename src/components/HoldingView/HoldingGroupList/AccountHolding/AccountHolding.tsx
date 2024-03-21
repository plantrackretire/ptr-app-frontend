import './AccountHolding.css';
import { SectionHeading, SectionHeadingSizeType } from '../../../SectionHeading';
import { IHolding } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatQuantity } from '../../../../utils/general';


interface IAccountHolding {
  accountHolding: IHolding,
  handleHoldingActionButtonClick: () => void,
}

export const AccountHolding: React.FC<IAccountHolding> = ({ accountHolding, handleHoldingActionButtonClick }) => {
  return (
    <tr key={accountHolding.holdingId} className="basic-table--sub-row">
      <td><br /></td>
      <td>
        <SectionHeading
          size={SectionHeadingSizeType.tiny} 
          label={accountHolding.accountName}
          handleActionButtonClick={handleHoldingActionButtonClick} 
          actionText={"View " + accountHolding.name + " transactions"}
        />
      </td>
      <td><br /></td>
      <td>
        <div className="holding-group-list--two-line">
          <span>{formatQuantity(accountHolding.quantity)}</span>
          <small>
            {
              !('lastQuantityUpdateDate' in accountHolding) ? 'Multi' :
              accountHolding.lastQuantityUpdateDate?.month + " / " + 
                accountHolding.lastQuantityUpdateDate?.day + " / " + accountHolding.lastQuantityUpdateDate?.year
            }
          </small>
        </div>
      </td>
      <td>
        <div className="holding-group-list--two-line">
          <span>{ formatBalance(accountHolding.balance) }</span>
          { !('ytdChangePercentage' in accountHolding) ?
              <small>Multi</small> 
            :
              <small>
                <ColoredPercentage percentage={accountHolding.ytdChangePercentage!} />
              </small>
          }
        </div>
      </td>
    </tr>
  );
};