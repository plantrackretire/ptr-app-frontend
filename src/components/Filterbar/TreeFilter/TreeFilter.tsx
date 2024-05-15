import { useState } from 'react';
import { SectionHeading, SectionHeadingSizeType } from '../../SectionHeading';
import { DropListFilterBarValue, DropListFilterBarValues, FilterableFilterBarCategories, IFilterBarOption } from '../FilterBar';
import { isEqual } from 'lodash-es';
import { TreeView } from '../../TreeView';
import './TreeFilter.css';


interface ITreeFilter {
  treeOptions: IFilterBarOption[],
  drilldownOptions: IFilterBarOption[],
  initialTreeValue: DropListFilterBarValues,
  initialDrilldownValue: DropListFilterBarValues,
  treeElementName: string,
  title: string,
  subTitle?: string,
  treeHeading: string,
  drilldownHeading: string,
  handleCloseWithContent: (content: any) => void,
}

// Given a list of categories (with level to denote hierarchy) and drilldown values associated with them, render the tree with the drilldown to the right.
// Returns contents of { treeValue: [number], drilldownValue: [number] }, empty array if no value selected.
export const TreeFilter: React.FC<ITreeFilter> = ({ treeOptions, drilldownOptions, initialTreeValue, initialDrilldownValue, treeElementName,
  title, subTitle, treeHeading, drilldownHeading, handleCloseWithContent }) => {
  const [treeSelection, setTreeSelection] = useState<DropListFilterBarValues>(initialTreeValue);
  const [drilldownSelection, setDrilldownSelection] = useState<DropListFilterBarValues>(initialDrilldownValue);

  const handleTreeItemClick = (item: DropListFilterBarValue) => {
    setTreeSelection([item]);
    setDrilldownSelection([]);
  }
  const handleDrilldownItemClick = (item: DropListFilterBarValue) => {
    setDrilldownSelection([item]);
  }

  const handleTreeClearButtonClick = () => {
    setTreeSelection([]);
  }
  const handleDrilldownClearButtonClick = () => {
    setDrilldownSelection([]);
  }

  const filteredDrilldownOptions = (treeSelection.length > 0) ?
    drilldownOptions.filter(item => {
      let found = false, index = 0;
      while(!found && index < treeSelection.length) {
        if(treeSelection[index].value in item.associations[treeElementName as FilterableFilterBarCategories]) {
          found = true;
        }
        index++;
      }
      return found;
    })
  :
    drilldownOptions;

  return (
    <div className='tree-filter'>
      <div className="tree-filter--header">
        <SectionHeading
          size={SectionHeadingSizeType.medium} 
          label={title}
          subLabel={subTitle ? subTitle : undefined}
        />
        <button className="button-el--visual" 
          onClick={() => handleCloseWithContent({ treeValue: treeSelection, drilldownValue: drilldownSelection })}>
          OK
        </button>
      </div>
      <div className='content-two-col scrollable'>
        <div className='scrollable'>
          <div className='tree-filter--content--heading'>
            <SectionHeading
              size={SectionHeadingSizeType.small} 
              label={treeHeading}
              handleClearButtonClick={handleTreeClearButtonClick} 
              lightColor={true}
            />
          </div>
          <div className="tree-filter--content">
            <TreeView treeItems={treeOptions} currentSelection={treeSelection} handleTreeItemClick={handleTreeItemClick} />
          </div>
        </div>
        <div className='scrollable'>
          <div className='tree-filter--content--heading'>
            <SectionHeading
              size={SectionHeadingSizeType.small} 
              label={drilldownHeading}
              handleClearButtonClick={handleDrilldownClearButtonClick} 
              lightColor={true}
            />
          </div>
          <div className="tree-filter--content tree-filter--content--list">
            { filteredDrilldownOptions.map(item => (
                <button 
                  key={item.value}
                  className={'button-el' + (drilldownSelection.find(el => isEqual(el, item) ) ? ' active' : '')}
                  onClick={() => handleDrilldownItemClick(item)}
                >
                  {item.label}
                </button>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};
