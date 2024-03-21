import { Checkbox, HandleCheckBoxValueChangeType } from './Checkbox/Checkbox';
import './CheckboxGroup.css';


// Assumes value is non-zero as it is used to do a boolean check
interface ICheckboxGroup {
  checkboxOptions: { value: string, label: string }[],
  checkedBoxesValues: string[],
  handleCheckBoxValueChange: HandleCheckBoxValueChangeType,
}

export const CheckboxGroup: React.FC<ICheckboxGroup> = ({ checkboxOptions, checkedBoxesValues, handleCheckBoxValueChange }) => {
  return (
    <div className='checkbox-group'>
      { 
        checkboxOptions.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            checked={checkedBoxesValues.find((value: string) => value === option.value) ? true : false} 
            handleCheckBoxValueChange={handleCheckBoxValueChange}
          />
        ))
      }
    </div>
  );
};