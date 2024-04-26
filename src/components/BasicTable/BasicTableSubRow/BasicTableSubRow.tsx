import { Fragment, ReactElement } from 'react';
import './BasicTableSubRow.css';


interface IBasicTableSubRow {
  children: ReactElement | ReactElement[],
  handleRowClick?: () => void,
}

export const BasicTableSubRow: React.FC<IBasicTableSubRow> = ({ children, handleRowClick }) => {
  return (
    <Fragment>
      {
        handleRowClick ?
          <tr className="basic-table--sub-row" onClick={handleRowClick}>
            {children}
          </tr>
        :
          <tr className="basic-table--sub-row">
            {children}
          </tr>
  }
    </Fragment>
  );
};
