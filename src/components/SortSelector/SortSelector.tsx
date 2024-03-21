import { DropdownList, DropdownListOptionsType } from '../DropdownList';
import './SortSelector.css';


interface ISortSelector {
  sortOrderOptions: DropdownListOptionsType,
  sortOrder: DropdownListOptionsType,
  sortDirection: string,
  setSortOrder: ((value: DropdownListOptionsType) => void),
  setSortDirection: ((value: string) => void),
}

export const SortSelector: React.FC<ISortSelector> = ({ sortOrderOptions, sortOrder, sortDirection, setSortOrder, setSortDirection }) => {
  return (
    <div className='sort-selector'>
      <div className="sort-selector--sort-order">
        <span>Sort by:</span>
        <DropdownList
          dropdownOptions={sortOrderOptions}
          dropdownValue={sortOrder}
          handleDropdownValueChange={setSortOrder}
        />
      </div>
      <div className="sort-selector--sort-direction">
        <button className={sortDirection === "asc" ? "button-el active" : "button-el"} onClick={ () => setSortDirection("asc") }>
          <small>▲ asc</small>
        </button>
        <button className={sortDirection === "desc" ? "button-el active" : "button-el"} onClick={ () => setSortDirection("desc") }>
          <small>▼ desc</small>
        </button>
      </div>
    </div>
  );
};