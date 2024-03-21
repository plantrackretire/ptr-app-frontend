import './Navlist.css';


// Set iconWidth to the largest icon width being used, this ensures all text lines up.  Exclude if using default for everything.
interface INavList {
  navItems: INavItem[],
  iconWidth?: string,
}
interface INavItem {
  icon: any,
  label: string,
  title?: string,
  isActive?: boolean,
}

export const Navlist: React.FC<INavList> = ({ navItems, iconWidth }) => {
  return (
    <div className='navlist'>
      <ul>
          {
            navItems.map((navItem, index) => (
              <li key={index} className={navItem.isActive ? 'active' : ''}>
                <div className="navlist--icon" 
                  style={iconWidth ? { width: iconWidth, height: iconWidth } : { width: "1em", height: "1em" }}>
                  <navItem.icon title={navItem.title || ''} />
                </div>
                <span>{navItem.label}</span>
              </li>
            ))
          }
      </ul>
    </div>
  );
};
