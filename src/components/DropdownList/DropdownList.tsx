import './DropdownList.css';
import Select from "react-dropdown-select";


export type DropdownListOptionsType = {value: number; label: string;}[];

type DropdownListHandleValueChangeType = (newValue: DropdownListOptionsType) => void;
interface IDropdownList {
  dropdownOptions: { value: number, label: string }[],
  dropdownValue: { value: number, label: string }[],
  handleDropdownValueChange: DropdownListHandleValueChangeType,
}

export const DropdownList: React.FC<IDropdownList> = ({ dropdownOptions, dropdownValue, handleDropdownValueChange }) => {
  return (
    <Select 
      className="dropdown-list"
      dropdownPosition="auto"
      options={dropdownOptions} 
      values={dropdownValue} 
      onChange={(values) => handleDropdownValueChange(values)} 
    />
  );
};