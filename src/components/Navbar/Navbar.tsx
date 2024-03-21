import './Navbar.css';
import { Navlist } from '../Navlist';
import { PiggyBankIcon } from '../../assets/PiggyBankIcon';
import { PieChartIcon } from '../../assets/PieChartIcon';
import { PerformanceChartIcon } from '../../assets/PerformanceChartIcon';
import { Filterbar } from '../Filterbar';

export const Navbar: React.FC = () => {
  return (
    <div className='navbar'>
      <Navlist navItems={navItems} iconWidth="1em" />
      <Filterbar />
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