import { INavItem, Navlist } from '../Navlist';
import { FilterBar, IFilterBarValues } from '../FilterBar';
import './Navbar.css';


interface INavbar {
  subPageItems: INavItem[],
  setSubPage: (value: any) => void,
  filterBarValues: IFilterBarValues,
  setFilterBarValues: (filterBarValues: IFilterBarValues) => void,
}

export const Navbar: React.FC<INavbar> = ({ subPageItems, setSubPage, filterBarValues, setFilterBarValues }) => {
  return (
    <div className='navbar'>
      <Navlist 
        navItems={subPageItems}
        setCurrentNavItem={setSubPage}
        iconWidth="1em" 
      />
      <FilterBar appliedFilterBarValues={filterBarValues} setAppliedFilterBarValues={setFilterBarValues} />
    </div>
  );
};  
