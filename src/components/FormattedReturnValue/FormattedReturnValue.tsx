import { isNumber } from '../../utils/calcs';
import { ColoredPercentage } from '../ColoredPercentage';
import './FormattedReturnValue.css';

interface IFormattedReturnValue {
  record: any,
  returnLabel: string,
  maxWidth?: string,
}

export const FormattedReturnValue: React.FC<IFormattedReturnValue> = ({ record, returnLabel, maxWidth }) => {
  let returnValue: any = "N/A";
  const style = maxWidth ? { maxWidth: maxWidth } : {};

  if(returnLabel in record) {
      if(record[returnLabel] === null) {
          returnValue = <div className="placeholder" style={style} ><br /></div>;
      } else {
          if(isNumber(record[returnLabel])) {
              returnValue = <ColoredPercentage percentage={record[returnLabel] as number} />;
          } else {
              returnValue = record[returnLabel];
          }
      }
  }

  return (
    returnValue
  );
};
