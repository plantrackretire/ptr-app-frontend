import { IAccount, IAccountViewColumns } from '..';
import { ColoredPercentage } from '../../ColoredPercentage';
import { formatBalance } from '../../../utils/general';
import { BasicTableRow } from '../../BasicTable/BasicTableRow';
import { Fragment } from 'react';
import { ColoredValue } from '../../ColoredValue';
import { FormattedReturnValue } from '../../FormattedReturnValue';
import './AccountRec.css';


interface IAccountRec {
  account: IAccount,
  columns: IAccountViewColumns,
  handleAccountButtonClick: () => void,
  isActive?: boolean,
}

export const AccountRec: React.FC<IAccountRec> = ({ account, columns, handleAccountButtonClick, isActive }) => {
  const changeInValuePercentage: number | null | string = account.aggValues!.calcChangeInValuePercentage();

  return (
    <BasicTableRow handleRowClick={handleAccountButtonClick}>
      <Fragment>
        <td>
          <div className='two-line'>
            <div className={isActive ? "active" : ""}>
              {account.accountName + (account.accountCustodian ? " | " + account.accountCustodian : "")}
            </div>
            <small>{account.accountTypeName}</small>
          </div>
        </td>
        { ('allocationPercentage' in columns && columns.allocationPercentage) &&
          <td>
            <br />
          </td>
        }
        { ('ytdChange' in columns && columns.ytdChange) &&
          <td>
            { changeInValuePercentage === null ?
                <span>N/A</span>
              :
                <ColoredPercentage percentage={changeInValuePercentage} />
            }
          </td>
        }
        { ('ytdReturn' in columns && columns.ytdReturn) &&
          <td>
            <FormattedReturnValue record={account} returnLabel='returnValue' maxWidth='3em' />
          </td>
        }
        { ('value' in columns && columns.value) &&
          <td>
            { formatBalance(account.aggValues!.getAggregateEndValue()) }
          </td>
        }
        { ('costBasis' in columns && columns.costBasis) &&
          <td>
            { formatBalance(account.aggValues!.getAggregateEndCostBasis()) }
          </td>
        }
        { ('unrealizedGain' in columns && columns.unrealizedGain) &&
          <td>
            <ColoredValue value={account.aggValues!.calcUnrealizedGainLoss()} />
          </td>
        }
      </Fragment>
    </BasicTableRow>
  );
};
