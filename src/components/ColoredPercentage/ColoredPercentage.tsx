import { formatAnnotatedChangePercentage } from '../../utils/general';
import './ColoredPercentage.css';

interface IColoredPercentage {
  percentage: number,
  decimalPlaces?: number,
  classes?: string,
}

export const ColoredPercentage: React.FC<IColoredPercentage> = ({ percentage, classes }) => {
  let className = "color-modifier--positive-value-change nowrap";
  if(percentage < 0) {
    className = "color-modifier--negative-value-change nowrap";
  }

  const formattedPercentage = formatAnnotatedChangePercentage(percentage);
  className = className + (classes ? " " + classes : "");

  return (
    <span className={className}>
      { formattedPercentage }
    </span>
  );
};
