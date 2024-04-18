import './DateSelector.css';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import DatePicker, { DayValue, Day } from '@hassanmojab/react-modern-calendar-datepicker';
import { getMonthName } from '../../utils/dates';
import { Fragment } from 'react';

interface IDateSelector {
  selectedDay: DayValue,
  handleSelectedDayChange: ((value: DayValue) => void),
  minimumDate?: Day,
  maximumDate?: Day,
}

export const DateSelector: React.FC<IDateSelector> = ({ selectedDay, handleSelectedDayChange, minimumDate, maximumDate }) => {
  const formatInputValue = () => {
    if (!selectedDay) return '';
    return `${getMonthName(selectedDay.month-1)} ${selectedDay.day}, ${selectedDay.year}`;
  };

  return (
    <Fragment>
    {
      (minimumDate && maximumDate) ?
        <DatePicker 
          value={selectedDay} 
          onChange={handleSelectedDayChange} 
          calendarClassName="responsive-calendar" 
          inputClassName="responsive-calendar-input" 
          formatInputText={formatInputValue}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      :
        <DatePicker 
          value={selectedDay} 
          onChange={handleSelectedDayChange} 
          calendarClassName="responsive-calendar" 
          inputClassName="responsive-calendar-input" 
          formatInputText={formatInputValue}
        />
    }
    </Fragment>
  );
};