import { useState } from 'react';
import './Filterbar.css';
import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { DateFilter } from './DateFilter';
import { DropdownList, DropdownListOptionsType } from '../DropdownList';
import { DayValue, utils } from '@hassanmojab/react-modern-calendar-datepicker';
import { CheckboxGroup } from '../CheckboxGroup/CheckboxGroup';
import { HandleCheckBoxValueChangeType } from '../CheckboxGroup/Checkbox/Checkbox';


export const Filterbar: React.FC = () => {
  const [asOfDay, setAsOfDay] = useState<DayValue>(utils('en').getToday());
  const [accountTypes, setAccountTypes] = useState<DropdownListOptionsType>([]);
  const [assetClasses, setAssetClasses] = useState<DropdownListOptionsType>([]);
  const [tags, setTags] = useState<string[]>([]);

  const handleFiltersClearButtonClick = () => {
    setAsOfDay(utils('en').getToday());
    setAccountTypes([]);
    setAssetClasses([]);
    setTags([]);
  };

  const handleAsOfDateClearButtonClick = () => {
    setAsOfDay(utils('en').getToday());
  };

  const handleAccountTypesClearButtonClick = () => {
    setAccountTypes([]);
  };

  const handleAssetClassClearButtonClick = () => {
    setAssetClasses([]);
  };

  const handleTagsClearButtonClick = () => {
    setTags([]);
  };

  const handleCheckBoxValueChange: HandleCheckBoxValueChangeType = (value: string, isChecked: boolean) => {
    if (isChecked) {
        setTags([...tags, value]);
    } else {
        setTags(tags.filter((item) => item !== value));
    }
  }

  return (
    <div className='filterbar'>
      <SectionHeading 
        size={SectionHeadingSizeType.medium} 
        label="Filters" 
        handleClearButtonClick={handleFiltersClearButtonClick} 
        isClearAll={true} 
      />
      <div className='filterbar--filters'>
        <div className='filterbar--filter'>
          <SectionHeading 
            size={SectionHeadingSizeType.small} 
            label="As of Date"
            handleClearButtonClick={handleAsOfDateClearButtonClick}
          />
          <DateFilter 
            selectedDay={asOfDay}
            setSelectedDay={setAsOfDay}
            inputLabel='As of:'
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading 
            size={SectionHeadingSizeType.small}
            label="Accounts Types"
            handleClearButtonClick={handleAccountTypesClearButtonClick}
            actionText='Select Account Types'
          />
          <DropdownList
            dropdownOptions={accountTypeOptions}
            dropdownValue={accountTypes}
            handleDropdownValueChange={setAccountTypes}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label="Asset Classes"
            handleClearButtonClick={handleAssetClassClearButtonClick}
            actionText='Select Asset Classes'
          />
          <DropdownList
            dropdownOptions={assetClassOptions}
            dropdownValue={assetClasses}
            handleDropdownValueChange={setAssetClasses}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label="Tags"
            handleClearButtonClick={handleTagsClearButtonClick}
            actionText='Select Tags'
          />
          <CheckboxGroup
            checkboxOptions={tagOptions}
            checkedBoxesValues={tags}
            handleCheckBoxValueChange={handleCheckBoxValueChange}
          />
        </div>
      </div>
    </div>
  );
};


export const accountTypeOptions = [
  { value: 1, label: "Taxable" },
  { value: 2, label: "Tax Deferred" },
  { value: 3, label: "Tax Exempt" },
  { value: 4, label: "Health Savings" },
  { value: 5, label: "College Savings (529)" },
];

export const assetClassOptions = [
  { value: 1, label: "Cash Equivalents" },
  { value: 2, label: "Commodities" },
  { value: 3, label: "Crypto" },
  { value: 4, label: "Equities" },
  { value: 5, label: "Fixed Income" },
  { value: 6, label: "Private Investments" },
  { value: 7, label: "Real Estate" },
];

export const tagOptions = [
  { value: "Drawdown Assets", label: "Drawdown Assets" },
  { value: "Income Producing", label: "Income Producing" },
  { value: "Kid's College", label: "Kid's College" },
];