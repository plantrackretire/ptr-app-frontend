import './DropdownList.css';
import Select from "react-dropdown-select";


export type DropdownListOptionsType = {value: number; label: string;}[];
export type IDropdownRenderer = (item: any, methods: any) => any;

type DropdownListHandleValueChangeType = (newValue: DropdownListOptionsType) => void;
interface IDropdownList {
  dropdownOptions: { value: number, label: string, level?: number }[],
  dropdownValue: { value: number, label: string, level?: number }[],
  handleDropdownValueChange: DropdownListHandleValueChangeType,
}

export const DropdownList: React.FC<IDropdownList> = ({ dropdownOptions, dropdownValue, handleDropdownValueChange }) => {
  const hierarchyPaddingMultiplier = 1.5, baseLeftPadding = .5;

  let tooltipText = '';
  if(dropdownValue) {
    dropdownValue.forEach((val, index) => index > 0 ? tooltipText += ", " + val.label : tooltipText += "Selected: " + val.label);
  }

  return (
    <div title={tooltipText}>
      <Select 
        className="dropdown-list"
        dropdownPosition="auto"
        options={dropdownOptions} 
        values={dropdownValue} 
        onChange={(values) => handleDropdownValueChange(values)} 
        itemRenderer={({ item, methods }) => (
          <div 
            className={"dropdown-list--item" + (methods.isSelected(item) ? " dropdown-list--selected" : "") +
            (!("level" in item) || item.level! === 0 ? " dropdown-list--root" : "")} 
            style={("level" in item) && item.level! > 0 ?  
              {paddingLeft: (baseLeftPadding + (hierarchyPaddingMultiplier*item.level!)) + "em"} : 
              {paddingLeft: baseLeftPadding + "em"}}
            onClick={() => methods.addItem(item)}
          >
            {item.label}
          </div>
        )}
      />
    </div>
  );
};
