import { IAccountTypeCategory } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance } from '../../../../utils/general';
import { BasicTableRow } from '../../../BasicTable/BasicTableRow';
import './AccountTypeCategoryHeading.css';


interface IAccountTypeCategoryHeading {
  accountTypeCategory: IAccountTypeCategory,
  handleAccountTypeCategoryButtonClick: () => void,
  isActive?: boolean,
}

export const AccountTypeCategoryHeading: React.FC<IAccountTypeCategoryHeading> = ({ accountTypeCategory, handleAccountTypeCategoryButtonClick, isActive }) => {
  return (
    <BasicTableRow handleRowClick={handleAccountTypeCategoryButtonClick}>
      <th>
        <div className={isActive ? "active" : ""}>
          {accountTypeCategory.accountTypeCategoryName}
        </div>
      </th>
      <th>
        <ColoredPercentage percentage={accountTypeCategory.aggValues.calcChangeInValuePercentage() || 0} />
      </th>
      <th>
        { formatBalance(accountTypeCategory.aggValues.getAggregateEndValue()) }
      </th>
    </BasicTableRow>
  );
};
