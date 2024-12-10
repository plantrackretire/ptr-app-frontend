import './Navlist.css';


// Set iconWidth to the largest icon width being used, this ensures all text lines up.  Exclude if using default for everything.
interface INavList {
  navItems: INavItem[],
  setCurrentNavItem: (value: any) => void,
  iconWidth?: string,
  displayHorizontal?: boolean,
}
export interface INavItem {
  icon?: any,
  label: string,
  value: any,
  title?: string,
  isActive?: boolean,
}

export const Navlist: React.FC<INavList> = ({ navItems, setCurrentNavItem, iconWidth, displayHorizontal }) => {
  const orientationClass = displayHorizontal ? "navlist-horizontal" : "navlist-vertical";

  return (
    <div className='navlist'>
      <ul className={orientationClass}>
          {
            navItems.map((navItem, index) => (
              <li key={index} className={"button-el" + (navItem.isActive ? ' active' : '')} onClick={() => setCurrentNavItem(navItem.value)}>
                { navItem.icon &&
                  <div className="navlist--icon" 
                    style={iconWidth ? { width: iconWidth, height: iconWidth } : { width: "1em", height: "1em" }}>
                    <navItem.icon title={navItem.title || ''} />
                  </div>
                }
                <span>{navItem.label}</span>
              </li>
            ))
          }
      </ul>
    </div>
  );
};
