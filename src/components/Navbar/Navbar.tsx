import { Navlist } from '../Navlist';
import { PiggyBankIcon } from '../../assets/PiggyBankIcon';
import { PieChartIcon } from '../../assets/PieChartIcon';
import { PerformanceChartIcon } from '../../assets/PerformanceChartIcon';
import { FilterBar, IFilterBarValues } from '../FilterBar';
import './Navbar.css';


interface INavbar {
  filterBarValues: IFilterBarValues,
  setFilterBarValues: (filterBarValues: IFilterBarValues) => void,
}

export const Navbar: React.FC<INavbar> = ({ filterBarValues, setFilterBarValues }) => {
  return (
    <div className='navbar'>
      <Navlist navItems={navItems} iconWidth="1em" />
      <FilterBar appliedFilterBarValues={filterBarValues} setAppliedFilterBarValues={setFilterBarValues} />
    </div>
  );
};  


const navItems = [
  {
    icon: PiggyBankIcon,
    label: "Net Worth",
    title: 'Net Worth',
    isActive: true,
  },
  {
    icon: PieChartIcon,
    label: "Asset Allocation",
    title: 'Asset Allocation',
  },
  {
    icon: PerformanceChartIcon,
    label: "Performance",
    title: 'Performance',
  },
]