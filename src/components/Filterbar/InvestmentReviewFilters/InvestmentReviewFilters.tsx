import { SectionHeading, SectionHeadingSizeType } from '../../SectionHeading';
import { DateFilter } from './../DateFilter';
import { DropdownList } from '../../DropdownList';
import { DayValue, utils } from '@hassanmojab/react-modern-calendar-datepicker';
import { Fragment } from 'react';
import isEqual from 'lodash/isEqual';
import { createDayFromDate } from '../../../utils/dates';
import { ModalContextType, ModalType } from '../../../providers/Modal';
import { TreeFilter } from '../TreeFilter';
import { FilterableFilterBarCategories, IActivityRange, IFilterBarOption, IFilterBarOptions, IFilterBarValues } from '../FilterBarDeclarations';
import './InvestmentReviewFilters.css';


interface IInvestmentReviewFilters {
  activityRange: IActivityRange,
  updateFilterBarValues: (filterBarValues: IFilterBarValues) => void,
  activeFilterBarValues: IFilterBarValues,
  appliedFilterBarValues: IFilterBarValues,
  filterBarOptions: IFilterBarOptions,
  modalContext: ModalContextType,
  useApply: boolean,
}

export const InvestmentReviewFilters: React.FC<IInvestmentReviewFilters> = ({ activityRange, updateFilterBarValues, activeFilterBarValues, appliedFilterBarValues,
  filterBarOptions, modalContext, useApply }) => {
  const handleAsOfDateClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, asOfDate: utils('en').getToday() });
  const handleAccountsClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, accountTypes: [], accounts: [] });
  const handleAssetsClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, assetClasses: [], assets: [] });
  const handleTagsClearButtonClick = () => updateFilterBarValues({ ...activeFilterBarValues, tags: [] });

  const handleAsOfDateChange = (asOfDate: DayValue) => updateFilterBarValues({ ...activeFilterBarValues, asOfDate: asOfDate });
  const handleTagsChange = (tags: { value: number, label: string }[]) => {
    const newValues: IFilterBarValues = { ...activeFilterBarValues, tags: tags };
    updateFilterBarValues(newValues);
  };

  const handleAccountTreeFilterClicked = async() => {
    const preparedOptions = filterAndSortOptions(filterBarOptions, activeFilterBarValues, true);
    const results = await modalContext.showModal(
      ModalType.noButtons,
      <TreeFilter
        treeOptions={preparedOptions.accountTypes ? preparedOptions['accountTypes'] : []}
        drilldownOptions={preparedOptions.accounts ? preparedOptions['accounts'] : []}
        initialTreeValue={activeFilterBarValues.accountTypes ? activeFilterBarValues.accountTypes : []}
        initialDrilldownValue={activeFilterBarValues.accounts ? activeFilterBarValues.accounts : []}
        treeElementName="accountTypes"
        title='Account Types & Accounts'
        subTitle='Select an Account Type and/or Account'
        treeHeading='Account Types'
        drilldownHeading='Accounts'
        handleCloseWithContent={modalContext.closeWithContent}
      />
    );
    if(!isEqual(results.content.treeValue, activeFilterBarValues.accountTypes) ||
    !isEqual(results.content.drilldownValue, activeFilterBarValues.accounts)) {
      updateFilterBarValues({ ...activeFilterBarValues, accountTypes: results.content.treeValue, accounts: results.content.drilldownValue });
    }
  }
  const handleAssetTreeFilterClicked = async() => {
    const preparedOptions = filterAndSortOptions(filterBarOptions, activeFilterBarValues, true);
    const results = await modalContext.showModal(
      ModalType.noButtons,
      <TreeFilter
        treeOptions={preparedOptions.assetClasses ? preparedOptions['assetClasses'] : []}
        drilldownOptions={preparedOptions.assets ? preparedOptions['assets'] : []}
        initialTreeValue={activeFilterBarValues.assetClasses ? activeFilterBarValues.assetClasses : []}
        initialDrilldownValue={activeFilterBarValues.assets ? activeFilterBarValues.assets : []}
        treeElementName="assetClasses"
        title='Asset Classes & Assets'
        subTitle='Select an Asset Class and/or Asset'
        treeHeading='Asset Classes'
        drilldownHeading='Assets'
        handleCloseWithContent={modalContext.closeWithContent}
      />
    );
    if(!isEqual(results.content.treeValue, activeFilterBarValues.assetClasses) ||
    !isEqual(results.content.drilldownValue, activeFilterBarValues.assets)) {
      updateFilterBarValues({ ...activeFilterBarValues, assetClasses: results.content.treeValue, assets: results.content.drilldownValue });
    }
  }

  const preparedFilterBarOptions = filterAndSortOptions(filterBarOptions, activeFilterBarValues);

  return (
    <Fragment>
      <div className={'filterbar--filter' +
        ((useApply && activeFilterBarValues.asOfDate && isEqual(activeFilterBarValues.asOfDate, appliedFilterBarValues.asOfDate)) ? " filterbar--filter-applied" : "") +
        ((useApply && !isEqual(activeFilterBarValues.asOfDate, appliedFilterBarValues.asOfDate)) ? " filterbar--filter-not-applied" : "")}
      >
        <SectionHeading 
          size={SectionHeadingSizeType.small} 
          label="As of Date"
          handleClearButtonClick={handleAsOfDateClearButtonClick}
          infoButtonContent={asOfDateInfo}
        />
        <DateFilter 
          selectedDay={activeFilterBarValues.asOfDate}
          setSelectedDay={handleAsOfDateChange}
          inputLabel='As of Date:'
          minimumDate={activityRange.startDate}
          maximumDate={createDayFromDate(new Date())}
        />
      </div>
      <div className={'filterbar--filter' +
        (useApply && (((activeFilterBarValues.accountTypes && activeFilterBarValues.accountTypes.length) && 
        isEqual(activeFilterBarValues.accountTypes, appliedFilterBarValues.accountTypes)) ||
        ((activeFilterBarValues.accounts && activeFilterBarValues.accounts.length) && 
        isEqual(activeFilterBarValues.accounts, appliedFilterBarValues.accounts))) ? " filterbar--filter-applied" : "") +
        (useApply && ((!isEqual(activeFilterBarValues.accountTypes, appliedFilterBarValues.accountTypes) ||
        !isEqual(activeFilterBarValues.accounts, appliedFilterBarValues.accounts))) ? " filterbar--filter-not-applied" : "")}
      >
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label='Accounts'
          handleClearButtonClick={handleAccountsClearButtonClick}
          infoButtonContent={accountsInfo}
        />
        <div className='filterbar--filter-textbox' onClick={handleAccountTreeFilterClicked}>
          { (activeFilterBarValues.accounts && activeFilterBarValues.accounts.length > 0) ? <div>{activeFilterBarValues.accounts[0].label}</div> : 
            ((activeFilterBarValues.accountTypes && activeFilterBarValues.accountTypes.length > 0) ? 
              <div>{activeFilterBarValues.accountTypes[0].label}</div> : <div className='de-emphasize'>Select...</div>)
          }
        </div>
      </div>
      <div className={'filterbar--filter' +
        (useApply && (((activeFilterBarValues.assetClasses && activeFilterBarValues.assetClasses.length) && 
        isEqual(activeFilterBarValues.assetClasses, appliedFilterBarValues.assetClasses)) ||
        ((activeFilterBarValues.assets && activeFilterBarValues.assets.length) && 
        isEqual(activeFilterBarValues.assets, appliedFilterBarValues.assets))) ? " filterbar--filter-applied" : "") +
        (useApply && ((!isEqual(activeFilterBarValues.assetClasses, appliedFilterBarValues.assetClasses) ||
        !isEqual(activeFilterBarValues.assets, appliedFilterBarValues.assets))) ? " filterbar--filter-not-applied" : "")}
      >
        <SectionHeading
          size={SectionHeadingSizeType.small}
          label='Assets'
          handleClearButtonClick={handleAssetsClearButtonClick}
          infoButtonContent={assetsInfo}
        />
        <div className='filterbar--filter-textbox' onClick={handleAssetTreeFilterClicked}>
          { (activeFilterBarValues.assets && activeFilterBarValues.assets.length > 0) ? <div>{activeFilterBarValues.assets[0].label}</div> : 
            ((activeFilterBarValues.assetClasses && activeFilterBarValues.assetClasses.length > 0) ? 
              <div>{activeFilterBarValues.assetClasses[0].label}</div> : <div className='de-emphasize'>Select...</div>)
          }
        </div>
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
          dropdownOptions={preparedFilterBarOptions.tags ? preparedFilterBarOptions.tags : []}
          dropdownValue={activeFilterBarValues.tags ? activeFilterBarValues.tags : []}
          handleDropdownValueChange={handleTagsChange}
        />
      </div>
    </Fragment>
  );
};

// Assumes only one choice per filter is possible (does not support multi select for any filter.)
// Assume two sets of related filters: Account Types and Accounts, and Asset Classes and Assets (securities).  Tags are separate.
// Filters are applied as follows:
// If more general value selected then more specific filter is limited to options associated with the general filter selected.
// E.g. If Account Type selected the Accounts filter is limited to accounts in the account type selected.  Same applies to Asset Class and Assets.
// In addition, Asset Class and Asset filters are limited to the values associated with the Account (first priority) or Account Type selected.
// Tags are filtered based on accounts.
const filterAndSortOptions = (filterBarOptions: IFilterBarOptions, filterBarValues: IFilterBarValues, sortOnly?: boolean): IFilterBarOptions => {
  const accountTypeFilterValue: number | null = (filterBarValues.accountTypes && filterBarValues.accountTypes.length > 0) ? filterBarValues.accountTypes[0].value : null;
  const accountFilterValue: number | null = (filterBarValues.accounts && filterBarValues.accounts.length > 0) ? filterBarValues.accounts[0].value : null;
  const assetClassFilterValue: number | null = (filterBarValues.assetClasses && filterBarValues.assetClasses.length > 0) ? filterBarValues.assetClasses[0].value : null;

  // Use account filter if set, otherwise use account type filter if set (or null).  Intent is to use most granular filter.
  let accountFilterLevelField: FilterableFilterBarCategories | null = null, accountFilterLevelValue: number = 0;
  if(accountFilterValue !== null) {
    accountFilterLevelField = FilterableFilterBarCategories.accounts; accountFilterLevelValue = accountFilterValue;
  } else if(accountTypeFilterValue !== null) {
    accountFilterLevelField = FilterableFilterBarCategories.accountTypes; accountFilterLevelValue = accountTypeFilterValue;
  }

  // Account Types - this is top level filter so is not filtered based on other filters
  const sortedFilteredAccountTypeOptions = sortHierarchyArray(filterBarOptions.accountTypes || []);

  // Accounts - filtered to values associated with selected account type
  let filteredAccountOptions = filterBarOptions.accounts || [];
  if(accountTypeFilterValue !== null && !sortOnly) {
    filteredAccountOptions = filterBarOptions.accounts ? filterBarOptions.accounts.filter((item: IFilterBarOption) => {
      if(accountTypeFilterValue && item.associations && !(accountTypeFilterValue in item.associations.accountTypes)) {
        return false;
      }
      return true;
    }) : [];
  }
  const sortedFilteredAccountOptions = filteredAccountOptions.sort((a: IFilterBarOption, b: IFilterBarOption) => {
    if(a.label < b.label) return -1;
    if(a.label > b.label) return 1;
    return 0;
  });

  // Asset Classes - filtered to values associated with selected account (first priority) or account type
  let filteredAssetClassOptions = filterBarOptions.assetClasses || [];
  if(accountFilterLevelField !== null && !sortOnly) {
    filteredAssetClassOptions = filterBarOptions.assetClasses ? filterBarOptions.assetClasses.filter((item: IFilterBarOption) => {
      return (item.associations && (accountFilterLevelValue in item.associations[accountFilterLevelField!]));
    }) : [];
  }
  const sortedFilteredAssetClassOptions = sortHierarchyArray(filteredAssetClassOptions);

  // Assets - filtered to values associated with selected asset class, and account (first priority) or account type
  let filteredAssetOptions = filterBarOptions.assets || [];
  if((assetClassFilterValue !== null || accountFilterLevelField !== null) && !sortOnly) {
    filteredAssetOptions = filterBarOptions.assets ? filterBarOptions.assets.filter((item: IFilterBarOption) => {
      if(assetClassFilterValue && item.associations && !(assetClassFilterValue in item.associations.assetClasses)) {
        return false;
      }
      if(accountFilterLevelField && item.associations && !(accountFilterLevelValue in item.associations[accountFilterLevelField!])) {
        return false;
      }
      return true;
    }) : [];
  }
  const sortedFilteredAssetOptions = filteredAssetOptions.sort((a: IFilterBarOption, b: IFilterBarOption) => {
    if(a.label < b.label) return -1;
    if(a.label > b.label) return 1;
    return 0;
  });

  // Tags - filtered to values associated with selected account (first priority) or account type (tags currently only associated with accounts).
  let filteredTagOptions = filterBarOptions.tags || [];
  if(accountFilterLevelField !== null && !sortOnly) {
    filteredTagOptions = filterBarOptions.tags ? filterBarOptions.tags.filter((item: IFilterBarOption) => {
      if(accountFilterLevelField && item.associations && !(accountFilterLevelValue in item.associations[accountFilterLevelField!])) {
        return false;
      }
      return true;
    }) : [];
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

function sortHierarchyArray(arry: IFilterBarOption[]): IFilterBarOption[] {
  const map = new Map<number, IFilterBarOption[]>();

  // Group elements by parent
  arry.forEach(item => {
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

const asOfDateInfo = 
<div className="info-button--info">
  <h2>As of Date</h2>
  <div>The "As of Date" sets the date for which the data is shown.</div>
  <div>By default, it’s set to the current date, so you’ll see the most recent data.</div>
  <div><br /></div>
  <div>You can also choose a past date to view data from an earlier time. The dropdown list offers some common dates to pick from, or you can click on the date field to select a specific date from the calendar.</div>
</div>;

const accountsInfo = 
<div className="info-button--info">
  <h2>Accounts Filter</h2>
  <div>The Accounts Filter lets you choose an account type or a specific account to view. Click on the account field to open the account selector.</div>
  <div><br /></div>
  <div>You can either select an account type to see data for all accounts in that category, or pick a specific account to view data just for that account.</div>
  <div>If you're choosing a specific account, you can still filter by account type to narrow down the list of accounts.</div>
</div>;

const assetsInfo = 
<div className="info-button--info">
  <h2>Assets Filter</h2>
  <div>The Asset Filter lets you choose an asset class or a specific asset to view. Click on the asset field to open the asset selector.</div>
  <div>You can select an asset class from the list to see data for all assets in that class, or choose a specific asset to view data just for that asset.</div>
  <div>If you're picking a specific asset, you can still filter by asset class to narrow down the list of assets.</div>
</div>;

const tagsInfo = 
<div className="info-button--info">
  <h2>Tags Filter</h2>
  <div>Tags let you create custom groupings of accounts.</div>
  <div>For example, you might have a tag for all accounts used for retirement or for your kid's college savings.</div>
  <div>Select a tag to filter the data based on that group, making it easier to view and manage accounts for specific purposes.</div>
</div>;