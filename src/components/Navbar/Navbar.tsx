import { INavItem, Navlist } from '../Navlist';
import { FilterBar } from '../FilterBar';
import { FilterBarTypes, IFilterBarValues } from '../FilterBar/FilterBarDeclarations';
import './Navbar.css';


interface INavbar {
  subPageItems: INavItem[],
  setSubPage: (value: any) => void,
  filterBarType: FilterBarTypes,
  filterBarValues: IFilterBarValues,
  setFilterBarValues: (filterBarValues: IFilterBarValues) => void,
}

export const Navbar: React.FC<INavbar> = ({ subPageItems, setSubPage, filterBarType, filterBarValues, setFilterBarValues }) => {
  return (
    <div className='navbar'>
      <Navlist 
        navItems={subPageItems}
        setCurrentNavItem={setSubPage}
        iconWidth="1em" 
      />
      <FilterBar 
        filterBarType={filterBarType}
        appliedFilterBarValues={filterBarValues} 
        setAppliedFilterBarValues={setFilterBarValues} 
        useApply={false} />
    </div>
  );
};  
