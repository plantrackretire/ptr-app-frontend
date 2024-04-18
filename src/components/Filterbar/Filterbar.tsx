import './FilterBar.css';
import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { DateFilter } from './DateFilter';
import { DropdownList } from '../DropdownList';
import { DayValue, Day, utils } from '@hassanmojab/react-modern-calendar-datepicker';
// import { CheckboxGroup } from '../CheckboxGroup/CheckboxGroup';
// import { HandleCheckBoxValueChangeType } from '../CheckboxGroup/Checkbox/Checkbox';
import { useContext, useEffect, useState } from 'react';
import isEqual from 'lodash/isEqual';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { AuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { fetchData } from '../../utils/general';
import { createDateFromDayValue, createDateStringFromDate, createDayFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../../utils/dates';


// Account Type Category does not appear here because they appear together with Account Types in account type filter (distinguished by level: 0 and 1).
export enum FilterableFilterBarCategories {
  accountTypes = "accountTypes",
  accounts = "accounts",
  assetClasses = "assetClasses",
  assets = "assets",
  tags = "tags",
};
export interface IFilterableFilterBarValues {
  accountTypes: { value: number, label: string, filter?: (number | string), level?: number }[],
  accounts: { value: number, label: string, filter?: (number | string), level?: number }[],
  assetClasses: { value: number, label: string, filter?: (number | string), level?: number }[],
  assets: { value: number, label: string, filter?: (number | string), level?: number }[],
  tags: string[],
};
export interface IFilterBarValues extends IFilterableFilterBarValues {
  asOfDate: DayValue,
};

export interface IActivityRange {
  startDate: Day,
  endDate: Day,
}

interface IAssociations {
  accountTypes: { [index: number]: number },
  accounts: { [index: number]: number },
  assetClasses: { [index: number]: number },
  assets: { [index: number]: number },
  tags: { [index: number]: number },
};

interface IFilterBar {
  appliedFilterBarValues: IFilterBarValues,
  setAppliedFilterBarValues: (filterBarValues: IFilterBarValues) => void,
}
interface IFilterBarOption {
  value: number,
  label: string,
  filter: any,
  level: number,
  parent: any,
  isDirect: number,
  associations: IAssociations,
}
interface IFilterBarOptions {
  accountTypeOptions: IFilterBarOption[],
  accountOptions: IFilterBarOption[],
  assetClassOptions: IFilterBarOption[],
  assetOptions: IFilterBarOption[],
}
// Format expected by REST API
export interface IServerFilterValues {
  accountTypeCategories: number[], 
  accountTypes: number[], 
  accounts: number[], 
  assetClasses: number[], 
  assets: number[], 
  tags: number[],
}

export const activityRangeInit = {
  startDate: utils('en').getToday(),
  endDate: utils('en').getToday(),
}
export const filterBarValuesInit = {
  asOfDate: utils('en').getToday(),
  accountTypes: [],
  accounts: [],
  assetClasses: [],
  assets: [],
  tags: [],
};
export const filterBarOptionsInit = {
  accountTypeOptions: [],
  accountOptions: [],
  assetClassOptions: [],
  assetOptions: [],
}

// appliedFilterBarValues - filter values that have been 'applied' and fed upstream to use in data retreival.
// filterBarValues - current value of each fitler, which may or may not have been fed upstream to apply.
// When apply button is pressed filterBarValues are fed upstream to apply to data retreival and will come back in appliedFilterBarValues.
// filterBarOptions - choices for each filter, loaded from db based on asOfDate, further filtered based on values of other filters.
export const FilterBar: React.FC<IFilterBar> = ({ appliedFilterBarValues, setAppliedFilterBarValues }) => {
  const [activityRange, setActivityRange] = useState<IActivityRange>(activityRangeInit);
  const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(filterBarValuesInit);
  const [filterBarOptions, setFilterBarOptions] = useState<IFilterBarOptions>(filterBarOptionsInit);
  const appUserAttributes = useContext(AuthenticatorContext);

  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    const getDbActivityRange = async() => {
      const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
      const body = { userId: 7493728439, queryType: "activityRange" };
      const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

      if(!ignoreResults) {
        if(!postResultJSON) {
          setActivityRange(activityRangeInit);
        } else {
          setActivityRange({
            startDate: createDayFromDate(createLocalDateFromDateTimeString(postResultJSON.startDate as unknown as string)),
            endDate: createDayFromDate(createLocalDateFromDateTimeString(postResultJSON.endDate as unknown as string)),
          });
        }
      }
    }

    getDbActivityRange();

    return () => { ignoreResults = true };
  }, []);
  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    const getDbFilterBarOptions = async() => {
      const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
      const asOfDate = createDateFromDayValue(filterBarValues.asOfDate);
      const startDate = getBeginningOfYear(asOfDate);
      const endDate = getPriorMonthEnd(asOfDate);
      const body = { userId: 7493728439, queryType: "filterBarOptions", startDate: createDateStringFromDate(startDate), 
        endDate: createDateStringFromDate(endDate) };
      const postResultJSON = await fetchData(url, body, appUserAttributes!.jwtToken);

      if(!ignoreResults) {
        const newFilterBarOptions: IFilterBarOptions = {
          accountTypeOptions: Object.values(postResultJSON.accountTypeOptions),
          accountOptions: Object.values(postResultJSON.accountOptions),
          assetClassOptions: Object.values(postResultJSON.assetClassOptions),
          assetOptions: Object.values(postResultJSON.assetOptions),
        };
        setFilterBarOptions(newFilterBarOptions);

        const [validatedFilterBarValues, didValuesChange] = validateFilterValues(newFilterBarOptions, filterBarValues);
        if(didValuesChange) {
          setFilterBarValues(validatedFilterBarValues);    
        }
      }
    }

    getDbFilterBarOptions();

    return () => { ignoreResults = true };
  }, [filterBarValues.asOfDate]);

  const handleFiltersClearButtonClick = () => { setFilterBarValues(filterBarValuesInit); };
  const handleAsOfDateClearButtonClick = () => setFilterBarValues({ ...filterBarValues, asOfDate: utils('en').getToday() });
  const handleAccountTypesClearButtonClick = () => setFilterBarValues({ ...filterBarValues, accountTypes: [] });
  const handleAccountsClearButtonClick = () => setFilterBarValues({ ...filterBarValues, accounts: [] });
  const handleAssetClassClearButtonClick = () => setFilterBarValues({ ...filterBarValues, assetClasses: [] });
  const handleAssetsClearButtonClick = () => setFilterBarValues({ ...filterBarValues, assets: [] });
  // const handleTagsClearButtonClick = () => setFilterBarValues({ ...filterBarValues, tags: [] });

  const handleAsOfDateChange = (asOfDate: DayValue) => setFilterBarValues({ ...filterBarValues, asOfDate: asOfDate });
  const handleAccoutTypesChange = (accountTypes: { value: number, label: string }[]) => {
    const [validatedFilterBarValues] = validateFilterValues(filterBarOptions, { ...filterBarValues, accountTypes: accountTypes });
    setFilterBarValues(validatedFilterBarValues);
  }
  const handleAccoutsChange = (accounts: { value: number, label: string }[]) => {
    const [validatedFilterBarValues] = validateFilterValues(filterBarOptions, { ...filterBarValues, accounts: accounts });
    setFilterBarValues(validatedFilterBarValues);
  }
  const handleAssetClassesChange = (assetClasses: { value: number, label: string }[]) => {
    const [validatedFilterBarValues] = validateFilterValues(filterBarOptions, { ...filterBarValues, assetClasses: assetClasses });
    setFilterBarValues(validatedFilterBarValues);
  }
  const handleAssetsChange = (assets: { value: number, label: string }[]) => {
    const [validatedFilterBarValues] = validateFilterValues(filterBarOptions, { ...filterBarValues, assets: assets });
    setFilterBarValues(validatedFilterBarValues);
  }
  // const handleTagsCheckBoxValueChange: HandleCheckBoxValueChangeType = (value: string, isChecked: boolean) => {
  //   let tags: string[] = [];
  //   if (isChecked) {
  //       tags = [...filterBarValues.tags, value];
  //   } else {
  //       tags = filterBarValues.tags.filter((item) => item !== value);
  //   }
  //   setFilterBarValues({ ...filterBarValues, tags: tags });
  // }
  const hanldeApplyClicked = () => {
    setAppliedFilterBarValues(filterBarValues);
  }
  const hanldeResetClicked = () => {
    if(!isEqual(appliedFilterBarValues, filterBarValues)) {
      setFilterBarValues(appliedFilterBarValues);
    }
  }

  let isApplyEnabled = false;
  if(!isEqual(appliedFilterBarValues, filterBarValues)) {
    isApplyEnabled = true;
  }

  const preparedFilterBarOptions = filterAndSortOptions(filterBarOptions, filterBarValues);

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
            selectedDay={filterBarValues.asOfDate}
            setSelectedDay={handleAsOfDateChange}
            inputLabel='As of:'
            minimumDate={activityRange.startDate}
            maximumDate={activityRange.endDate}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading 
            size={SectionHeadingSizeType.small}
            label="Accounts Types"
            handleClearButtonClick={handleAccountTypesClearButtonClick}
            actionText='Select Account Type'
          />
          <DropdownList
            dropdownOptions={preparedFilterBarOptions.accountTypeOptions}
            dropdownValue={filterBarValues.accountTypes}
            handleDropdownValueChange={handleAccoutTypesChange}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading 
            size={SectionHeadingSizeType.small}
            label="Accounts"
            handleClearButtonClick={handleAccountsClearButtonClick}
            actionText='Select Account'
          />
          <DropdownList
            dropdownOptions={preparedFilterBarOptions.accountOptions}
            dropdownValue={filterBarValues.accounts}
            handleDropdownValueChange={handleAccoutsChange}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label="Asset Classes"
            handleClearButtonClick={handleAssetClassClearButtonClick}
            actionText='Select Asset Class'
          />
          <DropdownList
            dropdownOptions={preparedFilterBarOptions.assetClassOptions}
            dropdownValue={filterBarValues.assetClasses}
            handleDropdownValueChange={handleAssetClassesChange}
          />
        </div>
        <div className='filterbar--filter'>
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label="Assets"
            handleClearButtonClick={handleAssetsClearButtonClick}
            actionText='Select Asset'
          />
          <DropdownList
            dropdownOptions={preparedFilterBarOptions.assetOptions}
            dropdownValue={filterBarValues.assets}
            handleDropdownValueChange={handleAssetsChange}
          />
        </div>
        {/* <div className='filterbar--filter'>
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label="Tags"
            handleClearButtonClick={handleTagsClearButtonClick}
            actionText='Select Tags'
          />
          <CheckboxGroup
            checkboxOptions={tagOptions}
            checkedBoxesValues={filterBarValues.tags}
            handleCheckBoxValueChange={handleTagsCheckBoxValueChange}
          />
        </div> */}
        <div className="filterbar--apply">
          <button className={"button-el--visual" + (isApplyEnabled ? "" : " button-el--disabled")} onClick={isApplyEnabled ? () => hanldeApplyClicked() : undefined}>
            Apply
          </button>
          <button className={"button-el" + (isApplyEnabled ? "" : " button-el--disabled")} 
            onClick={isApplyEnabled ? () => hanldeResetClicked() : undefined}>
            <small>Reset</small>
          </button>
        </div>
      </div>
    </div>
  );
};

// Go through each filter selection and determine if it is a valid choice given the values in other filters.
// Supports multi selection in any filter.
const validateFilterValues = (filterBarOptions: IFilterBarOptions, filterBarValues: IFilterBarValues): [IFilterBarValues, boolean] => {
  let accountTypeFilterValue: { value: number, label: string }[] | null = 
    filterBarValues.accountTypes.length > 0 ? filterBarValues.accountTypes : null;
  let accountFilterValue: { value: number, label: string }[] | null = 
    filterBarValues.accounts.length > 0 ? filterBarValues.accounts : null;
  let assetClassFilterValue: { value: number, label: string }[] | null = 
    filterBarValues.assetClasses.length > 0 ? filterBarValues.assetClasses : null;
  let assetFilterValue: { value: number, label: string }[] | null = 
    filterBarValues.assets.length > 0 ? filterBarValues.assets : null;

  let validatedFilterBarValues = { ...filterBarValues };
  let didValuesChange = false;

  // Validate each filter selection is in its respective options list
  if(accountTypeFilterValue && !isValueInOptions(accountTypeFilterValue, filterBarOptions.accountTypeOptions)) {
    validatedFilterBarValues.accountTypes = [];
    accountTypeFilterValue = null;
    didValuesChange = true;
  }
  if(accountFilterValue && !isValueInOptions(accountFilterValue, filterBarOptions.accountOptions)) {
    validatedFilterBarValues.accounts = [];
    accountFilterValue = null;
    didValuesChange = true;
  }
  if(assetFilterValue && !isValueInOptions(assetFilterValue, filterBarOptions.assetOptions)) {
    validatedFilterBarValues.assets = [];
    assetFilterValue = null;
    didValuesChange = true;
  }
  if(assetClassFilterValue && !isValueInOptions(assetClassFilterValue, filterBarOptions.assetClassOptions)) {
    validatedFilterBarValues.assetClasses = [];
    assetClassFilterValue = null;
    didValuesChange = true;
  }

  // First validate account is associated with account type
  if(accountFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(accountFilterValue, accountTypeFilterValue,
      filterBarOptions.accountOptions, FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.accounts = [];
        accountFilterValue = null;
        didValuesChange = true;
    }
  }

  // Second validate asset class is associated with account (first priority) or account type
  if(assetClassFilterValue && (accountFilterValue || accountTypeFilterValue)) {
    if(!isValueAssociatedWithOptions(assetClassFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assetClassOptions, accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assetClasses = [];
        assetClassFilterValue = null;
        didValuesChange = true;
    }
  }

  // Third validate asset is associated with asset class
  if(assetFilterValue && assetClassFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, assetClassFilterValue,
      filterBarOptions.assetOptions, FilterableFilterBarCategories.assetClasses)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  // Fourth validate asset is associated with account (first priority) or account type
  if(assetFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assetOptions, accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  return [validatedFilterBarValues, didValuesChange];
}

const isValueInOptions = (value: { value: number, label: string }[], options: IFilterBarOption[]) => {
  let index = 0, keepValue = true;
  while(keepValue && index < value.length) {
    const currentValue = value[index];
    if(options.find(el => el.value === currentValue.value) === undefined) {
      keepValue = false;
    }
    index++;
  }

  return keepValue;
};

// If any one of the elements in checkValue is not associated with one of the elements in matchValue then result is false, otherwise true.
const isValueAssociatedWithOptions = (checkValue: { value: number, label: string }[], matchValue: { value: number, label: string }[],
  checkOptions: IFilterBarOption[], associationType: FilterableFilterBarCategories): boolean => {
  let keepCheckValue = true, index = 0;

  while(keepCheckValue && index < checkValue.length) {
    const currentCheckValue = checkValue[index].value;
    const checkOption = getFilterBarOption(checkOptions, currentCheckValue);
      if(checkOption === undefined) {
        // TODO: Throw exception
        console.log("Did not find assetOption in isValueAssociatedWithOptions");
        return false;
      }

      const associations = checkOption.associations[associationType];
      // If at least one of the associated values for the checkValue option exists in the matchValue list then true (some function), else false.
      keepCheckValue = Object.values(associations).some((el => matchValue.find(el2 => el === el2.value)));
      index++;
  };

  return keepCheckValue;
};

// Assumes only one choice per filter is possible (does not support multi select for any filter.)
// Assume two sets of related filters: Account Types and Accounts, and Asset Classes and Assets (securities).
// Filters are applied as follows:
// If more general value selected then more specific filter is limited to options associated with the general filter selected.
// E.g. If Account Type selected the Accounts filter is limited to accounts in the account type selected.  Same applies to Asset Class and Assets.
// In addition, Asset Class and Asset filters are limited to the values associated with the Account (first priority) or Account Type selected.
const filterAndSortOptions = (filterBarOptions: IFilterBarOptions, filterBarValues: IFilterBarValues): IFilterBarOptions => {
  const accountTypeFilterValue: number | null = filterBarValues.accountTypes.length > 0 ? filterBarValues.accountTypes[0].value : null;
  const accountFilterValue: number | null = filterBarValues.accounts.length > 0 ? filterBarValues.accounts[0].value : null;
  const assetClassFilterValue: number | null = filterBarValues.assetClasses.length > 0 ? filterBarValues.assetClasses[0].value : null;

  // Use account filter if set, otherwise use account type filter if set (or null).  Intent is to use most granular filter.
  let accountFilterLevelField: FilterableFilterBarCategories | null = null, accountFilterLevelValue: number = 0;
  if(accountFilterValue !== null) {
    accountFilterLevelField = FilterableFilterBarCategories.accounts; accountFilterLevelValue = accountFilterValue;
  } else if(accountTypeFilterValue !== null) {
    accountFilterLevelField = FilterableFilterBarCategories.accountTypes; accountFilterLevelValue = accountTypeFilterValue;
  }

  // Account Types - this is top level filter so is not filtered based on other filters
  const sortedFilteredAccountTypeOptions = sortHierarchyArray(filterBarOptions.accountTypeOptions);

  // Accounts - filtered to values associated with selected account type
  let filteredAccountOptions = filterBarOptions.accountOptions;
  if(accountTypeFilterValue !== null) {
    filteredAccountOptions = filterBarOptions.accountOptions.filter((item: IFilterBarOption) => {
      if(accountTypeFilterValue && !(accountTypeFilterValue in item.associations.accountTypes)) {
        return false;
      }
      return true;
    });
  }
  const sortedFilteredAccountOptions = filteredAccountOptions.sort((a: IFilterBarOption, b: IFilterBarOption) => {
    if(a.label < b.label) return -1;
    if(a.label > b.label) return 1;
    return 0;
  });

  // Asset Classes - filtered to values associated with selected account (first priority) or account type
  let filteredAssetClassOptions = filterBarOptions.assetClassOptions;
  if(accountFilterLevelField !== null) {
    filteredAssetClassOptions = filterBarOptions.assetClassOptions.filter((item: IFilterBarOption) => {
      return (accountFilterLevelValue in item.associations[accountFilterLevelField!]);
    });
  }
  const sortedFilteredAssetClassOptions = sortHierarchyArray(filteredAssetClassOptions);

  // Assets - filtered to values associated with selected asset class, and account (first priority) or account type
  let filteredAssetOptions = filterBarOptions.assetOptions;
  if(assetClassFilterValue !== null || accountFilterLevelField !== null) {
    filteredAssetOptions = filterBarOptions.assetOptions.filter((item: IFilterBarOption) => {
      if(assetClassFilterValue && !(assetClassFilterValue in item.associations.assetClasses)) {
        return false;
      }
      if(accountFilterLevelField && !(accountFilterLevelValue in item.associations[accountFilterLevelField!])) {
        return false;
      }
      return true;
    });
  }
  const sortedFilteredAssetOptions = filteredAssetOptions.sort((a: IFilterBarOption, b: IFilterBarOption) => {
    if(a.label < b.label) return -1;
    if(a.label > b.label) return 1;
    return 0;
  });

  return {
    accountTypeOptions: sortedFilteredAccountTypeOptions,
    accountOptions: sortedFilteredAccountOptions,
    assetClassOptions: sortedFilteredAssetClassOptions,
    assetOptions: sortedFilteredAssetOptions,
  };
};

const getFilterBarOption = (filterBarOptions: IFilterBarOption[], value: number): IFilterBarOption | undefined => {
  const result = filterBarOptions.find(el => el.value === value);
  return result;
};

function sortHierarchyArray(array: IFilterBarOption[]): IFilterBarOption[] {
  const map = new Map<number, IFilterBarOption[]>();

  // Group elements by parent
  array.forEach(item => {
      if (!map.has(item.parent)) {
          map.set(item.parent, []);
      }
      map.get(item.parent)!.push(item);
  });

  // Function to sort elements based on label
  function customSort(a: IFilterBarOption, b: IFilterBarOption): number {
      return a.label.localeCompare(b.label);
  }

  // Function to sort elements recursively
  function sortElements(elements: IFilterBarOption[]): IFilterBarOption[] {
      const result: IFilterBarOption[] = [];
      elements.forEach(element => {
          result.push(element); // Add current element
          if (map.has(element.value)) {
              const children = map.get(element.value)!;
              children.sort(customSort); // Sort children by label
              result.push(...sortElements(children)); // Recursively add sorted children
          }
      });
      return result;
  }

  // Sort top-level elements and their children recursively
  const topLevel = map.get(0) || [];
  topLevel.sort(customSort);
  const sortedArray = sortElements(topLevel);

  return sortedArray;
}

export const formatFilterBarValuesForServer = (filterBarValues: IFilterBarValues): IServerFilterValues => {
  const formattedFilterBarValues: IServerFilterValues = 
      { accountTypeCategories: [], accountTypes: [], accounts: [], assetClasses: [], assets: [], tags: [] };

  if(filterBarValues.accounts.length > 0) {
    formattedFilterBarValues.accounts = filterBarValues.accounts.map(el => el.value);
  }
  // Account type filter holds both account type category and account type values, distinguished by level.
  if((filterBarValues.accountTypes.length > 0) && (filterBarValues.accounts.length <= 0)) {
    formattedFilterBarValues.accountTypes = filterBarValues.accountTypes.flatMap(el => el.level === 1 ? el.value : []);
    formattedFilterBarValues.accountTypeCategories = filterBarValues.accountTypes.flatMap(el => el.level === 0 ? el.value : []);
  }
  if(filterBarValues.assets.length > 0) {
    formattedFilterBarValues.assets = filterBarValues.assets.map(el => el.value);
  }
  if((filterBarValues.assetClasses.length) > 0 && (filterBarValues.assets.length <= 0)) {
    formattedFilterBarValues.assetClasses = filterBarValues.assetClasses.flatMap(el => (el.filter as string)!.split(',').map(Number));
  }

  return formattedFilterBarValues;
};


export const accountTypeOptions = [
  { value: 1, label: "Taxable", filter: [1, 2, 3] },
  { value: 2, label: "Tax Deferred", filter: [1, 4, 3] },
  { value: 3, label: "Tax Exempt", filter: [1, 2, 8] },
  { value: 4, label: "Health Savings", filter: [3] },
  { value: 5, label: "College Savings (529)", filter: [4, 5] },
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