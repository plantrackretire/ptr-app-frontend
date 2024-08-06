import { IHandleHoldingActionButtonClick, IHolding, IHoldingViewColumns } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatQuantity } from '../../../../utils/general';
import { BasicTableSubRow } from '../../../BasicTable/BasicTableSubRow';
import { Fragment } from 'react';
import { FormattedReturnValue } from '../../../FormattedReturnValue';
import { ColoredValue } from '../../../ColoredValue';
import './AccountHolding.css';


interface IAccountHolding {
  accountHolding: IHolding,
  columns: IHoldingViewColumns,
  handleHoldingActionButtonClick: (params: IHandleHoldingActionButtonClick) => void,
}

export const AccountHolding: React.FC<IAccountHolding> = ({ accountHolding, columns, handleHoldingActionButtonClick }) => {
  return (
    <BasicTableSubRow handleRowClick={() => 
        handleHoldingActionButtonClick({
          securityId: accountHolding.securityId, 
          securityName: accountHolding.securityName, 
          accountId: accountHolding.accountId, 
          accountName: accountHolding.accountName,
        })}
    >
      <Fragment>
        <td><br /></td>
        <td>
          <small>{accountHolding.accountName}</small>
        </td>
        <td><br /></td>
        { ('quantity' in columns && columns.quantity) &&
          <td className='nowrap'>
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
        }
        { (('balance' in columns && columns.balance) && ('ytdChangeUnderBalance' in columns && columns.ytdChangeUnderBalance)) &&
          <td className='nowrap'>
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
        }
        { (('balance' in columns && columns.balance) && !('ytdChangeUnderBalance' in columns && columns.ytdChangeUnderBalance)) &&
          <td className='nowrap'>
            <span>{ formatBalance(accountHolding.balance) }</span>
          </td>
        }
        { ('ytdReturn' in columns && columns.ytdReturn) &&
          <td className='nowrap align-content-right'>
            <FormattedReturnValue record={accountHolding} returnLabel='returnValue' maxWidth='3em' />
          </td>
        }
        { ('costBasis' in columns && columns.costBasis) &&
          <td className='nowrap'>
            { formatBalance(accountHolding.costBasis ? accountHolding.costBasis : 0) }
          </td>
        }
        { ('unrealizedGain' in columns && columns.unrealizedGain) &&
          <td className='nowrap'>
            <ColoredValue value={(accountHolding.balance - (accountHolding.costBasis ? accountHolding.costBasis : 0))} />
          </td>
        }
      </Fragment>
    </BasicTableSubRow>
  );
};