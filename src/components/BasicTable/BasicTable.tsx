import { ReactElement } from 'react';
import './BasicTable.css';


interface IBasicTable {
  children: ReactElement | ReactElement[],
  areRowsClickable?: boolean,
  highlightRowsOnHover?: boolean,
  zebraStripes?: boolean,
}

export const BasicTable: React.FC<IBasicTable> = ({ children, areRowsClickable, highlightRowsOnHover, zebraStripes }) => {
  return (
    <table className={"basic-table" + (areRowsClickable ? " basic-table--clickable-rows" : "") +
      (zebraStripes ? " basic-table--zebra-stripes" : "") + (highlightRowsOnHover ? " basic-table--highlightable-rows" : "")
     }>
      {children}
    </table>
  );
};
