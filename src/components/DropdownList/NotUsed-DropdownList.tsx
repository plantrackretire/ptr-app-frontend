import './DropdownList.css';
import Select, { SingleValue } from "react-select";

// EXAMPLE USING react-select IN CASE DECIDING TO SWITCH TO THIS
// PARENT COMPONENTS NEED TO USE THE BELOW TYPES FOR THE VALUE AND METHOD TO SET VALUE
// STATE VALUE SHOULD BE OF TYPE 
//    const [dropdownValue, setDropdownValue] = useState<DropdownListOptionType | null>();
// WHERE STATE IS SET CREATE A FUNCTION AS FOLLOWS TO SET VALUE AND PASS IT INTO HERE
//    const handleDropdownValueChange = (newValue: DropdownListSingleValueType) => {
//      setDropdownValue(newValue);
//    }
// INTERFACE FOR VALUES SHOULD BE AS FOLLOWS
//    interface IDropdownList {
//      dropdownOptions: { label: string, value: string }[],
//      dropdownValue: any, 
//      handleDropdownValueChange: (newValue: DropdownListSingleValueType) => void,
//    }
// CAN PASS IN className prop and set width on it to control width of droplist

export type DropdownListSingleValueType = SingleValue<{label: string, value: string}>;
export type DropdownListOptionType = { label: string, value: string };

interface IDropdownList {
  dropdownOptions: { label: string, value: string }[],
  dropdownValue: any, 
  handleDropdownValueChange: (newValue: DropdownListSingleValueType) => void,
}

export const DropdownList: React.FC<IDropdownList> = ({ dropdownOptions, dropdownValue, handleDropdownValueChange }) => {
  return (
    <Select
      options={dropdownOptions}
      value={dropdownValue}
      onChange={(newValue) => {
        handleDropdownValueChange(newValue);
      }}
      className="dropdownlist"
    />
  );
};