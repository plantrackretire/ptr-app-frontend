import { formatAnnotatedValue } from '../../utils/general';
import './ColoredValue.css';

interface IColoredValue {
  value: number,
  decimalPlaces?: number,
  classes?: string,
}

export const ColoredValue: React.FC<IColoredValue> = ({ value, classes }) => {
  let className = "color-modifier--positive-value-change";
  if(value < 0) {
    className = "color-modifier--negative-value-change";
  }

  const formattedValue = formatAnnotatedValue(value);
  className = className + (classes ? " " + classes : "");

  return (
    <span className={className}>
      { formattedValue }
    </span>
  );
};
