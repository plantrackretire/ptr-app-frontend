import { SectionHeading, SectionHeadingSizeType } from '../../SectionHeading';
import { DropdownList } from '../../DropdownList';
import { Fragment } from 'react';
import isEqual from 'lodash/isEqual';
import { IActivityRange, IFilterBarOption, IFilterBarOptions, IFilterBarValues } from '../FilterBarDeclarations';
import { Day } from '@hassanmojab/react-modern-calendar-datepicker';
import './DrawdownFilters.css';


interface IDrawdownFilters {
  updateFilterBarValues: (filterBarValues: IFilterBarValues) => void,
  activeFilterBarValues: IFilterBarValues,
  appliedFilterBarValues: IFilterBarValues,
  filterBarOptions: IFilterBarOptions,
  activityRange: IActivityRange,
  useApply: boolean,
}

export const DrawdownFilters: React.FC<IDrawdownFilters> = ({ updateFilterBarValues, activeFilterBarValues, appliedFilterBarValues,
  filterBarOptions, activityRange, useApply }) => {
  const handleYearsClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, years: [] });
  const handleTagsClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, tags: [] });

  const handleYearsChange = (years: { value: number, label: string }[]) => {
    const newValues: IFilterBarValues = { ...activeFilterBarValues, years: years };
    updateFilterBarValues(newValues);
  };
  const handleTagsChange = (tags: { value: number, label: string }[]) => {
    const newValues: IFilterBarValues = { ...activeFilterBarValues, tags: tags };
    updateFilterBarValues(newValues);
  };

  const yearOptions = getYearsOptions(activityRange.startDate, activityRange.endDate);

  return (
    <Fragment>
      <div className={'filterbar--filter' +
        ((useApply && (activeFilterBarValues.years && activeFilterBarValues.years.length) && isEqual(activeFilterBarValues.years, appliedFilterBarValues.years)) ? 
          " filterbar--filter-applied" : "") +
        ((useApply && !isEqual(activeFilterBarValues.years, appliedFilterBarValues.years)) ? " filterbar--filter-not-applied" : "")}
      >
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label={'Year'}
          handleClearButtonClick={handleYearsClearButtonClick}
          infoButtonContent={yearsInfo}
        />
        <DropdownList
          dropdownOptions={yearOptions ? yearOptions : []}
          dropdownValue={activeFilterBarValues.years ? activeFilterBarValues.years : (yearOptions && yearOptions.length > 0 ? [yearOptions[yearOptions.length-1]] : [])}
          handleDropdownValueChange={handleYearsChange}
        />
      </div>
      <div className={'filterbar--filter' +
        ((useApply && (activeFilterBarValues.tags && activeFilterBarValues.tags.length) && isEqual(activeFilterBarValues.tags, appliedFilterBarValues.tags)) ? 
          " filterbar--filter-applied" : "") +
        ((useApply && !isEqual(activeFilterBarValues.tags, appliedFilterBarValues.tags)) ? " filterbar--filter-not-applied" : "")}
      >
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label={'Tags'}
          handleClearButtonClick={handleTagsClearButtonClick}
          infoButtonContent={tagsInfo}
        />
        <DropdownList
          dropdownOptions={filterBarOptions.tags ? filterBarOptions.tags : []}
          dropdownValue={activeFilterBarValues.tags ? activeFilterBarValues.tags : []}
          handleDropdownValueChange={handleTagsChange}
        />
      </div>
    </Fragment>
  );
};

const getYearsOptions = (startDate: Day, endDate: Day) => {
  const firstYear = startDate.year;
  const lastYear = endDate.year;

  const yearOptions: IFilterBarOption[] = [];
  for(let i = firstYear; i <= lastYear; i++) {
    yearOptions.push({ label: i.toString(), value: i })
  }

  return yearOptions;
}

const yearsInfo = 
<div className="info-button--info">
  <h2>Year Filter</h2>
  <div>Choose a year to see the drawdown information for.</div>
  <div>Activity will be included for the full calendar year chosen, from January 1 to December 31 of that year.</div>
</div>;
const tagsInfo = 
<div className="info-button--info">
  <h2>Tags Filter</h2>
  <div>Tags let you create custom groupings of accounts.</div>
  <div>For example, you might have a tag for all accounts used for retirement or for your kid's college savings.</div>
  <div>Select a tag to filter the data based on that group, making it easier to view and manage accounts for specific purposes.</div>
</div>;