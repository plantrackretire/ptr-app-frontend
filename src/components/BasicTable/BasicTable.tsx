import { ReactElement } from 'react';
import './BasicTable.css';


interface IBasicTable {
  children: ReactElement | ReactElement[],
  areRowsClickable: boolean,
}

export const BasicTable: React.FC<IBasicTable> = ({ children, areRowsClickable }) => {
  return (
    <table className={"basic-table" + (areRowsClickable ? " basic-table--clickable-rows" : "") }>
      {children}
    </table>
  );
};
