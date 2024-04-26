import { DateSelector } from '../../DateSelector';
import { DropdownList, DropdownListOptionsType } from '../../DropdownList';
import { DayValue, Day } from '@hassanmojab/react-modern-calendar-datepicker';
import { calcDate, compareDayValues, getPrecannedDateValue, precannedDates } from '../../../utils/dates';
import './DateFilter.css';


interface IDateFilter {
  selectedDay: DayValue,
  setSelectedDay: ((value: DayValue) => void),
  inputLabel: string,
  minimumDate?: Day,
  maximumDate?: Day,
}

export const DateFilter: React.FC<IDateFilter> = ({ selectedDay, setSelectedDay, inputLabel, minimumDate, maximumDate }) => {
  // When precanned date is selected the date is set accordingly
  const handleDrPrecannedDateValueChange = (newValue: DropdownListOptionsType) => {
    if(newValue.length > 0) {
      const newDay = calcDate(newValue[0].value);
      if(compareDayValues(selectedDay, newDay)) {
        setSelectedDay(newDay);
      }
    }
  }

  // Get the precanned value for the selected date, empty array if no match.
  const precannedDateValueMatch = getPrecannedDateValue(selectedDay);

  return (
    <div className='datefilter'>
      <DropdownList
        dropdownOptions={precannedDates}
        dropdownValue={precannedDateValueMatch}
        handleDropdownValueChange={handleDrPrecannedDateValueChange}
      />
      <div className='datefilter--date'>
        <span>{inputLabel}</span>
        <DateSelector 
          selectedDay={selectedDay} 
          handleSelectedDayChange={setSelectedDay} 
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      </div>
    </div>
  );
};
