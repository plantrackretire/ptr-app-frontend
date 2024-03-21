import './AccountRec.css';
import { SectionHeading, SectionHeadingSizeType } from '../../SectionHeading';
import { IAccount } from '..';
import { ColoredPercentage } from '../../ColoredPercentage';
import { formatBalance } from '../../../utils/general';


interface IAccountRec {
  account: IAccount,
  filterType: string,
  filterValue: string,
  setFilterType: (type: string) => void,
  setFilterValue: (value: string) => void,
}

export const AccountRec: React.FC<IAccountRec> = ({ account, filterValue, filterType, setFilterType, setFilterValue }) => {
  return (
    <tr className="account-rec">
      <td>
        <SectionHeading
          size={SectionHeadingSizeType.small} 
          label={account.accountName + " | " + account.accountCustodian}
          subLabel={account.accountTypeName}
          handleActionButtonClick={() => { 
            setFilterType("account");
            setFilterValue(account.accountName); 
          }}
          actionText={"View " + account.accountName + " holdings"}
          isActive={filterType === "account" && filterValue === account.accountName}
        />
      </td>
      <td>
        <ColoredPercentage percentage={account.ytdChangePercentage!} />
      </td>
      <td>
        { formatBalance(account.balance!) }
      </td>
    </tr>
  );
};
