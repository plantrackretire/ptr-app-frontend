import './BasicTableColHeadings.css';


interface IBasicTableColHeadingsSet {
  name: string,
  sortColumn: string,
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
              <th key={heading.name}>
                <button 
                  className={"basic-table--col-headings--button button-el light" + (sortColumn === heading.sortColumn ? " active-light-clickable" : "")}
                  onClick={() => { 
                    setSortColumn(heading.sortColumn); 
                    setSortDirection(sortColumn === heading.sortColumn ? (sortDirection === "asc" ? "desc" : "asc") : "asc"); 
                  }}
                >
                  <span>
                    {heading.name}
                  </span>
                  {
                    (sortColumn === heading.sortColumn) &&
                      <span>
                        {sortDirection === "asc" ? "▲" : "▼" }
                      </span>
                  }
                </button>
              </th>
            )
        }
      </tr>
    </thead>
  );
};
