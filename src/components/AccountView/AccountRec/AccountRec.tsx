import { IAccount } from '..';
import { ColoredPercentage } from '../../ColoredPercentage';
import { formatBalance } from '../../../utils/general';
import { BasicTableRow } from '../../BasicTable/BasicTableRow';
import './AccountRec.css';


interface IAccountRec {
  account: IAccount,
  handleAccountButtonClick: () => void,
  isActive?: boolean,
}

export const AccountRec: React.FC<IAccountRec> = ({ account, handleAccountButtonClick, isActive }) => {
  const changeInValuePercentage: number | null | string = account.aggValues!.calcChangeInValuePercentage();
  return (
    <BasicTableRow handleRowClick={handleAccountButtonClick}>
      <td>
        <div className='two-line'>
          <div className={isActive ? "active" : ""}>
            {account.accountName + (account.accountCustodian ? " | " + account.accountCustodian : "")}
          </div>
          <small>{account.accountTypeName}</small>
        </div>
      </td>
      <td>
        <br />
      </td>
      <td>
        { changeInValuePercentage === null ?
            <span>N/A</span>
          :
            <ColoredPercentage percentage={changeInValuePercentage} />
        }
      </td>
      <td>
        { formatBalance(account.aggValues!.getAggregateEndValue()) }
      </td>
    </BasicTableRow>
  );
};
