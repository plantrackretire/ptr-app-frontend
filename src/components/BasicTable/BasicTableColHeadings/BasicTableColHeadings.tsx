import { InfoButton } from '../../InfoButton';
import './BasicTableColHeadings.css';


export interface IBasicTableColHeadingsSet {
  sortColumn: string,
  name: string,
  subName?: string,
  justify?: string,
  infoButtonContent?: JSX.Element,
}
interface IBasicTableColHeadings {
  headingSet: IBasicTableColHeadingsSet[],
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
  freezeHeadings?: boolean,
}

export const BasicTableColHeadings: React.FC<IBasicTableColHeadings> = ({ headingSet, sortColumn, sortDirection, setSortColumn, setSortDirection, freezeHeadings }) => {
  return (
    <thead className={"basic-table--col-headings" + (freezeHeadings ? " freeze-headings" : "")}>
      <tr>
        { headingSet &&
            headingSet.map(heading => 
              <th key={heading.name} className='nowrap'>
                <div className="basic-table--col-headings--heading">
                  <button 
                    className={"basic-table--col-headings--button button-el light" + (sortColumn === heading.sortColumn ? " active-light-clickable" : "")}
                    onClick={() => { 
                      setSortColumn(heading.sortColumn); 
                      setSortDirection(sortColumn === heading.sortColumn ? (sortDirection === "asc" ? "desc" : "asc") : "asc"); 
                    }}
                  >
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
                      (sortColumn === heading.sortColumn) &&
                        <div>
                          {sortDirection === "asc" ? "▲" : "▼" }
                        </div>
                    }
                  </button>
                  {
                    heading.infoButtonContent &&
                      <div className="basic-table--col-headings--info-button">
                        <InfoButton content={heading.infoButtonContent} lightColor={true} />
                      </div>
                  }
                </div>
              </th>
            )
        }
      </tr>
    </thead>
  );
};
