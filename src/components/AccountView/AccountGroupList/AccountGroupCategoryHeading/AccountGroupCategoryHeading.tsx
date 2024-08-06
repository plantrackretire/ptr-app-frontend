import { IAccountGroupCategory, IAccountViewColumns } from '../..';
import { ColoredPercentage } from '../../../ColoredPercentage';
import { formatBalance, formatChangePercentage } from '../../../../utils/general';
import { BasicTableRow } from '../../../BasicTable/BasicTableRow';
import { Fragment } from 'react';
import { ColoredValue } from '../../../ColoredValue';
import { FormattedReturnValue } from '../../../FormattedReturnValue';
import './AccountGroupCategoryHeading.css';


interface IAccountGroupCategoryHeading {
  accountGroupCategory: IAccountGroupCategory,
  columns: IAccountViewColumns,
  handleAccountGroupCategoryButtonClick: () => void,
  isActive?: boolean,
}

export const AccountGroupCategoryHeading: React.FC<IAccountGroupCategoryHeading> = ({ accountGroupCategory, columns, handleAccountGroupCategoryButtonClick, isActive }) => {
  return (
    <BasicTableRow handleRowClick={handleAccountGroupCategoryButtonClick}>
      <Fragment>
        <th>
          <div className={isActive ? "active" : ""}>
            {accountGroupCategory.accountGroupCategoryName}
          </div>
        </th>
        { ('allocationPercentage' in columns && columns.allocationPercentage) &&
          <th>
            { formatChangePercentage(accountGroupCategory.aggValues.getPercentageOfTotal() || 0) }
          </th>
        }
        { ('ytdChange' in columns && columns.ytdChange) &&
          <th>
            <ColoredPercentage percentage={accountGroupCategory.aggValues.calcChangeInValuePercentage() || 0} />
          </th>
        }
        { ('ytdReturn' in columns && columns.ytdReturn) &&
          <th className='align-content-right'>
            <FormattedReturnValue record={accountGroupCategory} returnLabel='returnValue' maxWidth='3em' />
          </th>
        }
        { ('value' in columns && columns.value) &&
          <th>
            { formatBalance(accountGroupCategory.aggValues.getAggregateEndValue()) }
          </th>
        }
        { ('costBasis' in columns && columns.costBasis) &&
          <th>
            { formatBalance(accountGroupCategory.aggValues.getAggregateEndCostBasis()) }
          </th>
        }
        { ('unrealizedGain' in columns && columns.unrealizedGain) &&
          <th>
            <ColoredValue value={accountGroupCategory.aggValues.calcUnrealizedGainLoss()} />
          </th>
        }
      </Fragment>
    </BasicTableRow>
  );
};
