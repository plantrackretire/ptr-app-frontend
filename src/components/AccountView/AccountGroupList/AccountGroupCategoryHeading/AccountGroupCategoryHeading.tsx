import { IAccountGroupCategory } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatChangePercentage } from '../../../../utils/general';
import { BasicTableRow } from '../../../BasicTable/BasicTableRow';
import './AccountGroupCategoryHeading.css';


interface IAccountGroupCategoryHeading {
  accountGroupCategory: IAccountGroupCategory,
  handleAccountGroupCategoryButtonClick: () => void,
  isActive?: boolean,
}

export const AccountGroupCategoryHeading: React.FC<IAccountGroupCategoryHeading> = ({ accountGroupCategory, handleAccountGroupCategoryButtonClick, isActive }) => {
  return (
    <BasicTableRow handleRowClick={handleAccountGroupCategoryButtonClick}>
      <th>
        <div className={isActive ? "active" : ""}>
          {accountGroupCategory.accountGroupCategoryName}
        </div>
      </th>
      <th>
        { formatChangePercentage(accountGroupCategory.aggValues.getPercentageOfTotal() || 0) }
      </th>
      <th>
        <ColoredPercentage percentage={accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0} />
      </th>
      <th>
        { formatBalance(accountGroupCategory.aggValues.getAggregateEndValue()) }
      </th>
    </BasicTableRow>
  );
};
