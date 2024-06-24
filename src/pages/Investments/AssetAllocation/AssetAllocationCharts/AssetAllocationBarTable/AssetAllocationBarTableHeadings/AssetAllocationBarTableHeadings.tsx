import './AssetAllocationBarTableHeadings.css';


interface IAssetAllocationBarTableHeadingsSet {
  sortColumn: string,
  name: string,
  subName?: string,
  justify?: string,
}
interface IAssetAllocationBarTableHeadings {
  headingSet: IAssetAllocationBarTableHeadingsSet[],
  sortColumn: string,
  sortDirection: string,
  setSortColumn:(value: string) => void,
  setSortDirection:(value: string) => void,
  freezeHeadings?: boolean,
}

export const AssetAllocationBarTableHeadings: React.FC<IAssetAllocationBarTableHeadings> = 
  ({ headingSet, sortColumn, sortDirection, setSortColumn, setSortDirection, freezeHeadings }) => {
  return (
    <div className={"asset-allocation-bar-table--headings" + (freezeHeadings ? " freeze-headings" : "")}>
        { headingSet &&
            headingSet.map(heading => 
              <div key={heading.name}>
                { heading.sortColumn.length > 0 ?
                  <button 
                    className={"asset-allocation-bar-table--headings--button button-el light" + 
                      (heading.justify ? (heading.justify === 'left' ? '  left-justify' : (heading.justify === 'right' ? ' right-justify' : ' center-justify')) : 'left-justify') +
                      (sortColumn === heading.sortColumn ? " active-light-clickable" : "")}
                    onClick={() => { 
                      setSortColumn(heading.sortColumn); 
                      setSortDirection(sortColumn === heading.sortColumn ? (sortDirection === "asc" ? "desc" : "asc") : "desc"); // Default to desc to show largest values first. 
                    }}
                  >
                    { heading.subName ?
                      <div className="asset-allocation-bar-table--headings--two-line">
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
                :
                  <div className="asset-allocation-bar-table--headings--button light">
                    { heading.subName ?
                      <div className="asset-allocation-bar-table--headings--two-line">
                        <div>{heading.name}</div>
                        <small>{heading.subName}</small>
                      </div>
                    :
                      <div>
                        {heading.name}
                      </div>
                    }
                  </div>
                }
            </div>
            )
        }
    </div>
  );
};
