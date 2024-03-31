import './AccountRec.css';
import { IAccount } from '..';
import { ColoredPercentage } from '../../ColoredPercentage';
import { formatBalance } from '../../../utils/general';


interface IAccountRec {
  account: IAccount,
  handleAccountTypeCategoryButtonClick: () => void,
  isActive?: boolean,
}

export const AccountRec: React.FC<IAccountRec> = ({ account, handleAccountTypeCategoryButtonClick, isActive }) => {
  const changeInValuePercentage: number | null | string = account.aggValues!.calcChangeInValuePercentage();
  return (
    <tr className="account-rec"  onClick={handleAccountTypeCategoryButtonClick}>
      <td>
        <div className='basic-table--two-line'>
          <div className={isActive ? "active" : ""}>
            {account.accountName + " | " + account.accountCustodian}
          </div>
          <small>{account.accountTypeName}</small>
        </div>
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
    </tr>
  );
};
