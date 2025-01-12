import { ReactElement } from 'react';
import './BasicTableHeading.css';


interface IBasicTableHeading {
  highlight?: boolean,
  children: ReactElement | ReactElement[],
}

export const BasicTableHeading: React.FC<IBasicTableHeading> = ({ highlight, children }) => {
  return (
    <thead className={ highlight ? "basic-table--col-headings-highlight" : "" }>
      {children}
    </thead>
  );
};
