import { Navbar } from '../../components/Navbar';
import { Drawdown } from './Drawdown';
import { useState } from 'react';
import { getFilterBarValuesInit } from '../../components/FilterBar';
import { FilterBarTypes, IFilterBarValues } from '../../components/FilterBar/FilterBarDeclarations';
import { DollarsIcon } from '../../assets/DollarsIcon';
import { INavItem } from '../../components/Navlist';
import { isEqual } from 'lodash-es';
import './InvestmentActions.css';


export enum InvestmentActionsSubPageType {
    drawdown,
};
  
export const InvestmentActions: React.FC = () => {
    const [subPage, setSubPage] = useState<InvestmentActionsSubPageType>(InvestmentActionsSubPageType.drawdown);
    const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(getFilterBarValuesInit(FilterBarTypes.drawdown));

    const handleFilterBarValuesChange = (values: IFilterBarValues) => {
        if(!isEqual(values, filterBarValues)) {
            setFilterBarValues(values);
        }
    }

    const handleSubPageChange = (value: InvestmentActionsSubPageType) => {
        setSubPage(value);
    }

    // Set current page to active in nav list
    navItems.forEach(navItem => (navItem.value === subPage) ? navItem.isActive = true : navItem.isActive = false);

    let filterBarType: FilterBarTypes;
    switch(subPage) {
        case InvestmentActionsSubPageType.drawdown: filterBarType = FilterBarTypes.drawdown; break;
    }
    
    return (
        <div className="content-with-nav">
            <Navbar 
                subPageItems={navItems}
                setSubPage={handleSubPageChange}
                filterBarType={filterBarType}
                filterBarValues={filterBarValues}
                setFilterBarValues={handleFilterBarValuesChange}
            />
            { subPage === InvestmentActionsSubPageType.drawdown &&
                <Drawdown filterBarValues={filterBarValues} />
            }
        </div>
    );
};


const navItems: INavItem[] = [
    {
      icon: DollarsIcon,
      label: "Drawdown",
      value: InvestmentActionsSubPageType.drawdown,
      title: 'Drawdown',
    },
];