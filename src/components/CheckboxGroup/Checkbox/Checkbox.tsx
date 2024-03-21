import './Checkbox.css';


export type HandleCheckBoxValueChangeType = (value: string, isChecked: boolean) => void;

interface ICheckbox {
  value: string,
  label: string,
  checked: boolean,
  handleCheckBoxValueChange: HandleCheckBoxValueChangeType,
}

export const Checkbox: React.FC<ICheckbox> = ({ value, label, checked, handleCheckBoxValueChange }) => {
  return (
    <label className="checkbox">
      <input 
        type="checkbox"
        value={value}
        checked={checked} 
        onChange={(e) => handleCheckBoxValueChange(e.target.value, e.target.checked)}
      />
      {label}
    </label>
  );
};