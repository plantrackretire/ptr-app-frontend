import { Fragment, ReactElement } from 'react';
import './BasicTableRow.css';


interface IBasicTableRow {
  children: ReactElement | ReactElement[],
  handleRowClick?: () => void,
}

export const BasicTableRow: React.FC<IBasicTableRow> = ({ children, handleRowClick }) => {
  return (
    <Fragment>
      {
        handleRowClick ?
          <tr onClick={handleRowClick}>
            {children}
          </tr>
        :
          <tr>
            {children}
          </tr>
  }
    </Fragment>
  );
};
