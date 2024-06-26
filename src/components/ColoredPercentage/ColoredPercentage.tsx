import { formatChangePercentage } from '../../utils/general';
import './ColoredPercentage.css';

interface IColoredPercentage {
  percentage: number,
  decimalPlaces?: number,
  classes?: string,
}

export const ColoredPercentage: React.FC<IColoredPercentage> = ({ percentage, classes }) => {
  let arrow = "▲ ";
  let className = "color-modifier--positive-value-change";
  if(percentage < 0) {
    arrow = "▼ ";
    className = "color-modifier--negative-value-change";
  }

  className = className + (classes ? " " + classes : "");

  return (
    <span className={className}>
      { arrow + formatChangePercentage(percentage) }
    </span>
  );
};
