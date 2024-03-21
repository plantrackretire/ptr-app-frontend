import './DateSelector.css';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import DatePicker, { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import { getMonthName } from '../../utils/dates';

interface IDateSelector {
  selectedDay: DayValue,
  handleSelectedDayChange: ((value: DayValue) => void)
}

export const DateSelector: React.FC<IDateSelector> = ({ selectedDay, handleSelectedDayChange }) => {
  const formatInputValue = () => {
    if (!selectedDay) return '';
    return `${getMonthName(selectedDay.month-1)} ${selectedDay.day}, ${selectedDay.year}`;
  };

  return (
    <DatePicker 
      value={selectedDay} 
      onChange={handleSelectedDayChange} 
      calendarClassName="responsive-calendar" 
      inputClassName="responsive-calendar-input" 
      formatInputText={formatInputValue}
    />
  );
};