import './AccountTypeCategoryHeading.css';
import { SectionHeading, SectionHeadingSizeType } from '../../../SectionHeading';
import { IAccountTypeCategory } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance } from '../../../../utils/general';


interface IAccountTypeCategoryHeading {
  accountTypeCategory: IAccountTypeCategory,
  handleAccountTypeCategoryButtonClick: () => void,
  isActive?: boolean,
}

export const AccountTypeCategoryHeading: React.FC<IAccountTypeCategoryHeading> = ({ accountTypeCategory, handleAccountTypeCategoryButtonClick, isActive }) => {
  return (
    <thead className="account-type-category-heading">
      <tr>
        <th>
          <SectionHeading
            size={SectionHeadingSizeType.small} 
            label={accountTypeCategory.accountTypeCategoryName}
            handleActionButtonClick={handleAccountTypeCategoryButtonClick} 
            actionText={"View " + accountTypeCategory.accountTypeCategoryName + " transactions"}
            isActive={isActive}
          />
        </th>
        <th>
          <ColoredPercentage percentage={accountTypeCategory.ytdChangePercentage} />
        </th>
        <th>
          { formatBalance(accountTypeCategory.balance) }
        </th>
      </tr>
    </thead>
  );
};
