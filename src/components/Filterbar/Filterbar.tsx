import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { DateFilter } from './DateFilter';
import { DropdownList } from '../DropdownList';
import { DayValue, Day, utils } from '@hassanmojab/react-modern-calendar-datepicker';
import { Fragment, useContext, useEffect, useState } from 'react';
import isEqual from 'lodash/isEqual';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { AuthenticatorContext, IAuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { convertStringToArray, fetchData, getUserToken } from '../../utils/general';
import { createDateFromDayValue, createDateStringFromDate, createDayFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../../utils/dates';
import { ModalContextType, ModalType, useModalContext } from '../../providers/Modal';
import { TreeFilter } from './TreeFilter';
import './FilterBar.css';


// Account Type Category does not appear here because it goes together with Account Types in account type filter (distinguished by level: 0 and 1).
export enum FilterableFilterBarCategories {
  accountTypes = "accountTypes",
  accounts = "accounts",
  assetClasses = "assetClasses",
  assets = "assets",
  tags = "tags",
};

// TODO: If no longer using droplist for majority of filters try to elimnate this and have everything work with FilterBarOption (will have to transalte for drop lists).
export type DropListFilterBarValue = { value: number, label: string, filter?: (number | string), level?: number, parent?: number };
export type DropListFilterBarValues = DropListFilterBarValue[];

export interface IFilterableFilterBarValues {
  accountTypes: DropListFilterBarValues,
  accounts: DropListFilterBarValues,
  assetClasses: DropListFilterBarValues,
  assets: DropListFilterBarValues,
  tags: DropListFilterBarValues,
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
export interface IFilterBarOption {
  value: number,
  label: string,
  filter: any,
  level: number,
  parent: any,
  associations: IAssociations,
  isDirect?: number,
}
interface IFilterBarOptions {
  accountTypes: IFilterBarOption[],
  accounts: IFilterBarOption[],
  assetClasses: IFilterBarOption[],
  assets: IFilterBarOption[],
  tags: IFilterBarOption[],
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
  startDate: createDayFromDate(getBeginningOfYear(new Date())),
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
  accountTypes: [],
  accounts: [],
  assetClasses: [],
  assets: [],
  tags: [],
}

// Filters that use a dropdown list, share common rendering logic.
const dropListFilters = [
  { filterObjectName: 'tags', label: 'Tags', filterClearValue: [], },
];

// TODO: Delete this version if never going to use drop lists for account and asset related filters.
// const dropListFilters = [
//   { filterObjectName: 'accountTypes', label: 'Account Types', filterClearValue: [], },
//   { filterObjectName: 'accounts', label: 'Accounts', filterClearValue: [], },
//   { filterObjectName: 'assetClasses', label: 'Asset Classes', filterClearValue: [], },
//   { filterObjectName: 'assets', label: 'Assets', filterClearValue: [], },
//   { filterObjectName: 'tags', label: 'Tags', filterClearValue: [], },
// ];

// appliedFilterBarValues - filter values that have been 'applied' and fed upstream to use in data retreival.
// filterBarValues - current value of each fitler, which may or may not have been fed upstream to apply.
// When apply button is pressed filterBarValues are fed upstream to apply to data retreival and will come back in appliedFilterBarValues.
// filterBarOptions - choices for each filter, loaded from db based on asOfDate, further filtered in memory based on values of other filters.
export const FilterBar: React.FC<IFilterBar> = ({ appliedFilterBarValues, setAppliedFilterBarValues }) => {
  const [activityRange, setActivityRange] = useState<IActivityRange>(activityRangeInit);
  const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(filterBarValuesInit);
  const [filterBarOptions, setFilterBarOptions] = useState<IFilterBarOptions>(filterBarOptionsInit);
  const appUserAttributes = useContext(AuthenticatorContext);
  const modalContext = useModalContext();

  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;


    const getActivityRange = async() => {
      const postResultJSON = await getDbActivityRange(appUserAttributes!, modalContext);
      if(postResultJSON === null) {
        setActivityRange(activityRangeInit);
      }

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

    getActivityRange();

    return () => { ignoreResults = true };
  }, []);

  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;

    const getFilterBarOptions = async() => {
      const asOfDate = createDateFromDayValue(filterBarValues.asOfDate);
      const startDate = getBeginningOfYear(asOfDate);
      const endDate = getPriorMonthEnd(asOfDate);

      const postResultJSON = await getDbFilterBarOptions(appUserAttributes!, modalContext, startDate, endDate);
      if(postResultJSON === null) {
        await modalContext.showModal(
            ModalType.confirm,
            'Error retreiving reference data, please try again.',
        );
        setFilterBarOptions(filterBarOptionsInit);
        setFilterBarValues(filterBarValuesInit);
        return () => { ignoreResults = true };
      }

      if(!ignoreResults) {
        const newFilterBarOptions: IFilterBarOptions = {
          accountTypes: Object.values(postResultJSON.accountTypeOptions),
          accounts: Object.values(postResultJSON.accountOptions),
          assetClasses: Object.values(postResultJSON.assetClassOptions),
          assets: Object.values(postResultJSON.assetOptions),
          tags: Object.values(postResultJSON.tagOptions),
        };
        setFilterBarOptions(newFilterBarOptions);

        const [validatedFilterBarValues, didValuesChange] = validateFilterValues(newFilterBarOptions, filterBarValues);
        if(didValuesChange) {
          setFilterBarValues(validatedFilterBarValues);    
        }
      }
    }

    getFilterBarOptions();

    return () => { ignoreResults = true };
  }, [filterBarValues.asOfDate]);

  const handleFiltersClearButtonClick = () => setFilterBarValues(filterBarValuesInit);
  const handleAsOfDateClearButtonClick = () => setFilterBarValues({ ...filterBarValues, asOfDate: utils('en').getToday() });
  const handleAccountsClearButtonClick = () => setFilterBarValues({ ...filterBarValues, accountTypes: [], accounts: [] });
  const handleAssetsClearButtonClick = () => setFilterBarValues({ ...filterBarValues, assetClasses: [], assets: [] });

  const handleAsOfDateChange = (asOfDate: DayValue) => setFilterBarValues({ ...filterBarValues, asOfDate: asOfDate });

  const handleAccountTreeFilterClicked = async() => {
    const preparedOptions = filterAndSortOptions(filterBarOptions, filterBarValues, true);
    const results = await modalContext.showModal(
      ModalType.noButtons,
      <TreeFilter
        treeOptions={preparedOptions['accountTypes']}
        drilldownOptions={preparedOptions['accounts']}
        initialTreeValue={filterBarValues.accountTypes}
        initialDrilldownValue={filterBarValues.accounts}
        treeElementName="accountTypes"
        title='Account Types & Accounts'
        subTitle='Select an Account Type and/or Account'
        treeHeading='Account Types'
        drilldownHeading='Accounts'
        handleCloseWithContent={modalContext.closeWithContent}
      />
    );
    if(!isEqual(results.content.treeValue, filterBarValues.accountTypes) ||
    !isEqual(results.content.drilldownValue, filterBarValues.accounts)) {
      setFilterBarValues({ ...filterBarValues, accountTypes: results.content.treeValue, accounts: results.content.drilldownValue });
    }
  }
  const handleAssetTreeFilterClicked = async() => {
    const preparedOptions = filterAndSortOptions(filterBarOptions, filterBarValues, true);
    const results = await modalContext.showModal(
      ModalType.noButtons,
      <TreeFilter
        treeOptions={preparedOptions['assetClasses']}
        drilldownOptions={preparedOptions['assets']}
        initialTreeValue={filterBarValues.assetClasses}
        initialDrilldownValue={filterBarValues.assets}
        treeElementName="assetClasses"
        title='Asset Classes & Assets'
        subTitle='Select an Asset Class and/or Asset'
        treeHeading='Asset Classes'
        drilldownHeading='Assets'
        handleCloseWithContent={modalContext.closeWithContent}
      />
    );
    if(!isEqual(results.content.treeValue, filterBarValues.assetClasses) ||
    !isEqual(results.content.drilldownValue, filterBarValues.assets)) {
      setFilterBarValues({ ...filterBarValues, assetClasses: results.content.treeValue, assets: results.content.drilldownValue });
    }
  }

  const hanldeApplyClicked = () => setAppliedFilterBarValues(filterBarValues);
  const hanldeResetClicked = async () => {
    if(!isEqual(appliedFilterBarValues, filterBarValues)) {
      setFilterBarValues(appliedFilterBarValues);
    }
  }

  const isApplyEnabled = !isEqual(appliedFilterBarValues, filterBarValues) ? true : false;

  const preparedFilterBarOptions = filterAndSortOptions(filterBarOptions, filterBarValues);

  // For each droplist type filter create the callback functions and html.
  const dropListFiltersElements = dropListFilters.map(filter => 
    createDropListFilterOption(filter.filterObjectName, filter.label, filterBarValues[filter.filterObjectName as FilterableFilterBarCategories], 
      appliedFilterBarValues[filter.filterObjectName as FilterableFilterBarCategories], filter.filterClearValue, 
      preparedFilterBarOptions[filter.filterObjectName as FilterableFilterBarCategories], 
      preparedFilterBarOptions, filterBarValues, setFilterBarValues,
      (filter.filterObjectName === 'accountTypes' || filter.filterObjectName === 'accounts') ? handleAccountTreeFilterClicked : 
      ((filter.filterObjectName === 'assetClasses' || filter.filterObjectName === 'assets') ? handleAssetTreeFilterClicked : undefined))
  );

  return (
    <Fragment>
    <div className='filterbar'>
      <SectionHeading 
        size={SectionHeadingSizeType.medium} 
        label="Filters" 
        handleClearButtonClick={handleFiltersClearButtonClick} 
        isClearAll={true} 
      />
      <div className='filterbar--filters'>
        <div className={'filterbar--filter' +
          ((filterBarValues.asOfDate && isEqual(filterBarValues.asOfDate, appliedFilterBarValues.asOfDate)) ? " filterbar--filter-applied" : "") +
          ((!isEqual(filterBarValues.asOfDate, appliedFilterBarValues.asOfDate)) ? " filterbar--filter-not-applied" : "")}
        >
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
            maximumDate={createDayFromDate(new Date())}
          />
        </div>
        <div className={'filterbar--filter' +
          ((filterBarValues.accountTypes.length && isEqual(filterBarValues.accountTypes, appliedFilterBarValues.accountTypes)) ||
          (filterBarValues.accounts.length && isEqual(filterBarValues.accounts, appliedFilterBarValues.accounts)) ? " filterbar--filter-applied" : "") +
          ((!isEqual(filterBarValues.accountTypes, appliedFilterBarValues.accountTypes) ||
          !isEqual(filterBarValues.accounts, appliedFilterBarValues.accounts)) ? " filterbar--filter-not-applied" : "")}
        >
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label='Accounts'
            handleClearButtonClick={handleAccountsClearButtonClick}
          />
          <div className='filterbar--filter-textbox' onClick={handleAccountTreeFilterClicked}>
            { filterBarValues.accounts.length > 0 ? <div>{filterBarValues.accounts[0].label}</div> : 
              (filterBarValues.accountTypes.length > 0 ? <div>{filterBarValues.accountTypes[0].label}</div> : <small className='de-emphasize'>Select...</small>)
            }
          </div>
        </div>
        <div className={'filterbar--filter' +
          ((filterBarValues.assetClasses.length && isEqual(filterBarValues.assetClasses, appliedFilterBarValues.assetClasses)) ||
          (filterBarValues.assets.length && isEqual(filterBarValues.assets, appliedFilterBarValues.assets)) ? " filterbar--filter-applied" : "") +
          ((!isEqual(filterBarValues.assetClasses, appliedFilterBarValues.assetClasses) ||
          !isEqual(filterBarValues.assets, appliedFilterBarValues.assets)) ? " filterbar--filter-not-applied" : "")}
        >
          <SectionHeading
            size={SectionHeadingSizeType.small}
            label='Assets'
            handleClearButtonClick={handleAssetsClearButtonClick}
          />
          <div className='filterbar--filter-textbox' onClick={handleAssetTreeFilterClicked}>
            { filterBarValues.assets.length > 0 ? <div>{filterBarValues.assets[0].label}</div> : 
              (filterBarValues.assetClasses.length > 0 ? <div>{filterBarValues.assetClasses[0].label}</div> : <small className='de-emphasize'>Select...</small>)
            }
          </div>
        </div>
        {dropListFiltersElements}
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
    </Fragment>
  );
};

const getDbActivityRange = async(appUserAttributes: IAuthenticatorContext, modalContext: ModalContextType) => {
  const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
  const body = { userId: appUserAttributes!.userId, queryType: "activityRange" };
  const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);
  const postResultJSON = await fetchData(url, body, token);

  return postResultJSON;
}

const getDbFilterBarOptions = async(appUserAttributes: IAuthenticatorContext, modalContext: ModalContextType, startDate: Date, endDate: Date) => {
  const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
  const body = { userId: appUserAttributes!.userId, queryType: "filterBarOptions", startDate: createDateStringFromDate(startDate), 
    endDate: createDateStringFromDate(endDate) };
  
  const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);
  const postResultJSON = await fetchData(url, body, token);

  return postResultJSON;
}

const createDropListFilterOption = (filterObjectName: string, label: string, filterValues: DropListFilterBarValues, 
  filterAppliedValues: DropListFilterBarValues, filterClearValue: DropListFilterBarValues, filterOptions: IFilterBarOption[], 
  allOptions: IFilterBarOptions, allValues: IFilterBarValues, setFilterBarValues: ((value: IFilterBarValues) => void),
  handleTreeFilterClicked?: () => void) => {
  const handleClearButtonClick = () => {
    const newValues: IFilterBarValues = { ...allValues };
    newValues[filterObjectName as FilterableFilterBarCategories] = filterClearValue;
    setFilterBarValues(newValues);
  };

  const handleChange = (value: { value: number, label: string }[]) => {
    const newValues: IFilterBarValues = { ...allValues };
    newValues[filterObjectName as FilterableFilterBarCategories] = value;
    const [validatedFilterBarValues] = validateFilterValues(allOptions, newValues);
    setFilterBarValues(validatedFilterBarValues);
  };

  return (
    <div key={filterObjectName} className={'filterbar--filter' +
      ((filterValues.length && isEqual(filterValues, filterAppliedValues)) ? " filterbar--filter-applied" : "") +
      ((!isEqual(filterValues, filterAppliedValues)) ? " filterbar--filter-not-applied" : "")}
    >
      { handleTreeFilterClicked ?
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label={label}
          handleActionButtonClick={handleTreeFilterClicked}
          handleClearButtonClick={handleClearButtonClick}
        />
      :
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label={label}
          handleClearButtonClick={handleClearButtonClick}
        />
      }
      <DropdownList
        dropdownOptions={filterOptions}
        dropdownValue={filterValues}
        handleDropdownValueChange={handleChange}
      />
    </div>
  );
}

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
  let tagFilterValue: { value: number, label: string }[] | null = 
    filterBarValues.tags.length > 0 ? filterBarValues.tags : null;

  let validatedFilterBarValues = { ...filterBarValues };
  let didValuesChange = false;

  // Validate each filter selection is in its respective options list
  if(accountTypeFilterValue && !isValueInOptions(accountTypeFilterValue, filterBarOptions.accountTypes)) {
    validatedFilterBarValues.accountTypes = [];
    accountTypeFilterValue = null;
    didValuesChange = true;
  }
  if(accountFilterValue && !isValueInOptions(accountFilterValue, filterBarOptions.accounts)) {
    validatedFilterBarValues.accounts = [];
    accountFilterValue = null;
    didValuesChange = true;
  }
  if(assetFilterValue && !isValueInOptions(assetFilterValue, filterBarOptions.assets)) {
    validatedFilterBarValues.assets = [];
    assetFilterValue = null;
    didValuesChange = true;
  }
  if(assetClassFilterValue && !isValueInOptions(assetClassFilterValue, filterBarOptions.assetClasses)) {
    validatedFilterBarValues.assetClasses = [];
    assetClassFilterValue = null;
    didValuesChange = true;
  }
  if(tagFilterValue && !isValueInOptions(tagFilterValue, filterBarOptions.tags)) {
    validatedFilterBarValues.tags = [];
    tagFilterValue = null;
    didValuesChange = true;
  }

  // First validate account is associated with account type
  if(accountFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(accountFilterValue, accountTypeFilterValue,
      filterBarOptions.accounts, FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.accounts = [];
        accountFilterValue = null;
        didValuesChange = true;
    }
  }

  // Second validate asset class is associated with account (first priority) or account type
  if(assetClassFilterValue && (accountFilterValue || accountTypeFilterValue)) {
    if(!isValueAssociatedWithOptions(assetClassFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assetClasses, accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assetClasses = [];
        assetClassFilterValue = null;
        didValuesChange = true;
    }
  }

  // Third validate asset is associated with asset class
  if(assetFilterValue && assetClassFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, assetClassFilterValue,
      filterBarOptions.assets, FilterableFilterBarCategories.assetClasses)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  // Fourth validate asset is associated with account (first priority) or account type
  if(assetFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assets, accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  // Fifth validate tag is associated with account (first priority) or account type
  if(tagFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(tagFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.tags, accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.tags = [];
        tagFilterValue = null;
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
// Assume two sets of related filters: Account Types and Accounts, and Asset Classes and Assets (securities).  Tags are separate.
// Filters are applied as follows:
// If more general value selected then more specific filter is limited to options associated with the general filter selected.
// E.g. If Account Type selected the Accounts filter is limited to accounts in the account type selected.  Same applies to Asset Class and Assets.
// In addition, Asset Class and Asset filters are limited to the values associated with the Account (first priority) or Account Type selected.
// Tags are filtered based on accounts.
const filterAndSortOptions = (filterBarOptions: IFilterBarOptions, filterBarValues: IFilterBarValues, sortOnly?: boolean): IFilterBarOptions => {
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
  const sortedFilteredAccountTypeOptions = sortHierarchyArray(filterBarOptions.accountTypes);

  // Accounts - filtered to values associated with selected account type
  let filteredAccountOptions = filterBarOptions.accounts;
  if(accountTypeFilterValue !== null && !sortOnly) {
    filteredAccountOptions = filterBarOptions.accounts.filter((item: IFilterBarOption) => {
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
  let filteredAssetClassOptions = filterBarOptions.assetClasses;
  if(accountFilterLevelField !== null && !sortOnly) {
    filteredAssetClassOptions = filterBarOptions.assetClasses.filter((item: IFilterBarOption) => {
      return (accountFilterLevelValue in item.associations[accountFilterLevelField!]);
    });
  }
  const sortedFilteredAssetClassOptions = sortHierarchyArray(filteredAssetClassOptions);

  // Assets - filtered to values associated with selected asset class, and account (first priority) or account type
  let filteredAssetOptions = filterBarOptions.assets;
  if((assetClassFilterValue !== null || accountFilterLevelField !== null) && !sortOnly) {
    filteredAssetOptions = filterBarOptions.assets.filter((item: IFilterBarOption) => {
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

  // Tags - filtered to values associated with selected account (first priority) or account type (tags currently only associated with accounts).
  let filteredTagOptions = filterBarOptions.tags;
  if(accountFilterLevelField !== null && !sortOnly) {
    filteredTagOptions = filterBarOptions.tags.filter((item: IFilterBarOption) => {
      if(accountFilterLevelField && !(accountFilterLevelValue in item.associations[accountFilterLevelField!])) {
        return false;
      }
      return true;
    });
  }
  const sortedFilteredTagOptions = filteredTagOptions.sort((a: IFilterBarOption, b: IFilterBarOption) => {
    if(a.label < b.label) return -1;
    if(a.label > b.label) return 1;
    return 0;
  });
  
  return {
    accountTypes: sortedFilteredAccountTypeOptions,
    accounts: sortedFilteredAccountOptions,
    assetClasses: sortedFilteredAssetClassOptions,
    assets: sortedFilteredAssetOptions,
    tags: sortedFilteredTagOptions,
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
    formattedFilterBarValues.assetClasses = filterBarValues.assetClasses.flatMap(el => convertStringToArray((el.filter as string), ',', Number));
  }
  if(filterBarValues.tags.length > 0) {
    formattedFilterBarValues.tags = filterBarValues.tags.flatMap(el => el.value);
  }

  return formattedFilterBarValues;
};
