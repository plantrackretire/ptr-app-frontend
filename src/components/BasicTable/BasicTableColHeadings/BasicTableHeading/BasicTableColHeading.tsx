import { Fragment } from 'react';
import { InfoButton } from '../../../InfoButton';
import { IBasicTableColHeadingsSet } from '../BasicTableColHeadings';
import './BasicTableColHeading.css';


interface IBasicTableColHeading {
  heading: IBasicTableColHeadingsSet,
  rowspan: number,
  groupHeadingClass?: string,
  sortColumn?: string, // required for sorting
  sortDirection?: string, // required for sorting
  setSortColumn?:(value: string) => void, // required for sorting
  setSortDirection?:(value: string) => void, // required for sorting
}

export const BasicTableColHeading: React.FC<IBasicTableColHeading> = ({ heading, rowspan, groupHeadingClass, sortColumn, sortDirection, setSortColumn, setSortDirection }) => {
  const headingButtonContent = getHeadingButtonContent(heading, sortColumn, sortDirection);

  return (
    <Fragment>
          <th rowSpan={rowspan} key={heading.name} className={(heading.allowWrap ? '' : 'nowrap ') + (groupHeadingClass ? groupHeadingClass : '')}>
            <div className="basic-table--col-headings--heading">
              { (setSortColumn && setSortDirection && (heading.sortColumn !== undefined)) &&
                <button 
                  className={"basic-table--col-headings--button button-el light" + (sortColumn === heading.sortColumn ? " active-light-clickable" : "")}
                  onClick={() => { 
                    setSortColumn(heading.sortColumn!); 
                    setSortDirection(sortColumn === heading.sortColumn ? (sortDirection === "asc" ? "desc" : "asc") : "asc"); 
                  }}
                >
                  { headingButtonContent }
                </button>
              }
              { (!setSortColumn || !setSortDirection) &&
                <Fragment>
                  { headingButtonContent }
                </Fragment>
              }
              {
                heading.infoButtonContent &&
                  <div className="basic-table--col-headings--info-button">
                    <InfoButton content={heading.infoButtonContent} lightColor={true} />
                  </div>
              }
            </div>
          </th>
    </Fragment>
  );
};

const getHeadingButtonContent = (heading: IBasicTableColHeadingsSet, sortColumn?: string, sortDirection?: string) => {
  return (
    <Fragment>
      { heading.subName ?
        <div className="basic-table--col-headings--two-line">
          <div>{heading.name}</div>
          <small>{heading.subName}</small>
        </div>
      :
        <div>
          {heading.name}
        </div>
      }
      {
        (sortColumn && sortColumn === heading.sortColumn) &&
          <div>
            {sortDirection === "asc" ? "▲" : "▼" }
          </div>
      }
    </Fragment>
  );
}
