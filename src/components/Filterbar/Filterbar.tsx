import { SectionHeading, SectionHeadingSizeType } from '../SectionHeading';
import { utils } from '@hassanmojab/react-modern-calendar-datepicker';
import { Fragment, useContext, useEffect, useState } from 'react';
import isEqual from 'lodash/isEqual';
import { PtrAppApiStack } from '../../../../ptr-app-backend/cdk-outputs.json';
import { AuthenticatorContext, IAuthenticatorContext } from '../../providers/AppAuthenticatorProvider';
import { convertStringToArray, fetchData, getUserToken } from '../../utils/general';
import { createDateFromDayValue, createDateStringFromDate, createDayFromDate, createLocalDateFromDateTimeString, getBeginningOfYear, getPriorMonthEnd } from '../../utils/dates';
import { ModalContextType, ModalType, useModalContext } from '../../providers/Modal';
import { InvestmentReviewFilters } from './InvestmentReviewFilters';
import { DrawdownFilters } from './DrawdownFilters';
import { FilterableFilterBarCategories, FilterBarTypes, IActivityRange, IFilterBarOptions, IFilterBarValues, IServerFilterValues } from './FilterBarDeclarations';
import { validateFilterValues } from './InvestmentReviewFilters/InvestmentReviewValidator';
import './FilterBar.css';

// For new filter types:
// * Add new filters to:
//     * Add a type to FilterBarTypes
//     * Create an IXXXFilterBarValues interface and add it to extensions of IFilterBarValues
//     * Create an IXXXFilterBarOptions interface and add it to extension of IFilterBarOptions if needed
//     * If it will be selectable in the filter bar:
//         * Add to FilterableFilterBarCategories enum if needed
//         * Add to IAssociations if needed
//     * Add to IServerFilterValues
//     * Add to any lambda functions that need it
// * Create Filters folder and files to generate the filters for the page (copy existing)

const CASH_EQUIVALENT_ASSET_CLASS_ID = 4;
const CASH_ASSET_CLASS_ID = 50;
const CASH_SECURITY_ID = 1;

interface IFilterBar {
  filterBarType: FilterBarTypes,
  appliedFilterBarValues: IFilterBarValues,
  setAppliedFilterBarValues: (filterBarValues: IFilterBarValues) => void,
  useApply: boolean,
}

// appliedFilterBarValues - filter values that have been 'applied' and fed upstream to use in data retreival.
// filterBarValues - current value of each fitler, which may or may not have been fed upstream to apply.
// When apply button is pressed filterBarValues are fed upstream to apply to data retreival and will come back in appliedFilterBarValues.
// filterBarOptions - choices for each filter, loaded from db based on asOfDate, further filtered in memory based on values of other filters.
// useApply toggles on or off the Apply button, with it off filters are applied as soon as they are changed, and active and applied filters are equal.
export const FilterBar: React.FC<IFilterBar> = ({ filterBarType, appliedFilterBarValues, setAppliedFilterBarValues, useApply }) => {
  const [activityRange, setActivityRange] = useState<IActivityRange>(getActivityRangeInit());
  const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(getFilterBarValuesInit(filterBarType));
  const [filterBarOptions, setFilterBarOptions] = useState<IFilterBarOptions>({});
  const appUserAttributes = useContext(AuthenticatorContext);
  const modalContext = useModalContext();

  // Determine which values to use (depending on whether apply button is being used).
  let activeFilterBarValues = appliedFilterBarValues;
  if(useApply) {
    activeFilterBarValues = filterBarValues;
  }

  useEffect(() => {
    // This avoids race conditions by ignoring results from stale calls
    let ignoreResults = false;


    const getActivityRange = async() => {
      const postResultJSON = await getDbActivityRange(appUserAttributes!, modalContext);
      if(postResultJSON === null) {
        setActivityRange(getActivityRangeInit());
      }

      if(!ignoreResults) {
        if(!postResultJSON) {
          setActivityRange(getActivityRangeInit());
        } else {
          const endDate = createLocalDateFromDateTimeString(postResultJSON.endDate as unknown as string);
          setActivityRange({
            startDate: createDayFromDate(createLocalDateFromDateTimeString(postResultJSON.startDate as unknown as string)),
            endDate: createDayFromDate(endDate),
          });
          if(filterBarType === FilterBarTypes.drawdown) {
            // If no year is set then set it to the last year in the activity range.  
            // Had some timing issues using the activity range to set the value in other places.
            if(!filterBarValues.years || filterBarValues.years.length === 0) {
              const yr = endDate.getFullYear();
              updateFilterBarValues({ ...activeFilterBarValues, years: [{ label: yr.toString(), value: yr }] });
            }
          }
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
      const asOfDate = createDateFromDayValue(activeFilterBarValues.asOfDate);
      let startDate = getBeginningOfYear(asOfDate);
      const endDate = getPriorMonthEnd(asOfDate);
      if(startDate > endDate) {
        startDate = endDate;
      }

      const postResultJSON = await getDbFilterBarOptions(appUserAttributes!, filterBarType, modalContext, startDate, endDate);
      if(postResultJSON === null) {
        await modalContext.showModal(
            ModalType.confirm,
            'Error retreiving reference data, please try again.',
        );
        setFilterBarOptions({});
        updateFilterBarValues(getFilterBarValuesInit(filterBarType));
        return () => { ignoreResults = true };
      }

      if(!ignoreResults) {
        const newFilterBarOptions: IFilterBarOptions = {};
        Object.keys(postResultJSON).forEach(key => {
          newFilterBarOptions[key as FilterableFilterBarCategories] = Object.values(postResultJSON[key]);
        });

        switch(filterBarType) {
          case FilterBarTypes.investmentReview:
            const [validatedFilterBarValues, didValuesChange] = validateFilterValues(newFilterBarOptions, activeFilterBarValues);
            if(didValuesChange) {
              updateFilterBarValues(validatedFilterBarValues);
            }
            break;
          case FilterBarTypes.drawdown:
            break;
        }

        setFilterBarOptions(newFilterBarOptions);
      }
    }

    getFilterBarOptions();

    return () => { ignoreResults = true };
  }, [activeFilterBarValues.asOfDate]);

  const updateFilterBarValues = (filterBarValues: IFilterBarValues) => {
    if(useApply) {
      setFilterBarValues(filterBarValues);
    } else {
      setAppliedFilterBarValues(filterBarValues);
    }
  }

  const handleFiltersClearButtonClick = () => updateFilterBarValues(getFilterBarValuesInit(filterBarType));

  const hanldeApplyClicked = () => setAppliedFilterBarValues(activeFilterBarValues);
  const hanldeResetClicked = async () => {
    if(!isEqual(appliedFilterBarValues, activeFilterBarValues)) {
      updateFilterBarValues(appliedFilterBarValues);
    }
  }

  const isApplyEnabled = !isEqual(appliedFilterBarValues, activeFilterBarValues) ? true : false;

  return (
    <Fragment>
    <div className='filterbar'>
      <SectionHeading 
        size={SectionHeadingSizeType.medium} 
        label="Filters" 
        handleClearButtonClick={handleFiltersClearButtonClick} 
        isClearAll={true} 
        infoButtonContent={headingInfo}
      />
      <div className='filterbar--filters'>
        { filterBarType === FilterBarTypes.investmentReview &&
          <InvestmentReviewFilters
            activityRange={activityRange}
            updateFilterBarValues={updateFilterBarValues}
            activeFilterBarValues={activeFilterBarValues}
            appliedFilterBarValues={appliedFilterBarValues}
            filterBarOptions={filterBarOptions}
            modalContext={modalContext}
            useApply={useApply}
          />
        }
        { filterBarType === FilterBarTypes.drawdown &&
          <DrawdownFilters
            updateFilterBarValues={updateFilterBarValues}
            activeFilterBarValues={activeFilterBarValues}
            appliedFilterBarValues={appliedFilterBarValues}
            filterBarOptions={filterBarOptions}
            activityRange={activityRange}
            useApply={useApply}
          />
        }
        { useApply &&
          <div className="filterbar--apply">
            <button className={"button-el--visual" + (isApplyEnabled ? "" : " button-el--disabled")} onClick={isApplyEnabled ? () => hanldeApplyClicked() : undefined}>
              Apply
            </button>
            <button className={"button-el" + (isApplyEnabled ? "" : " button-el--disabled")} 
              onClick={isApplyEnabled ? () => hanldeResetClicked() : undefined}>
              <small>Reset</small>
            </button>
          </div>
        }
      </div>
    </div>
    </Fragment>
  );
};

export const getFilterBarValuesInit = (filterBarType: FilterBarTypes) => {
  switch(filterBarType) {
    case FilterBarTypes.investmentReview:
      return { asOfDate: utils('en').getToday() };
    case FilterBarTypes.drawdown:
      return { asOfDate: utils('en').getToday() };
  }
}

export const getActivityRangeInit = () => {
  return {
    startDate: createDayFromDate(getBeginningOfYear(new Date())),
    endDate: utils('en').getToday(),
  };
}

const getDbActivityRange = async(appUserAttributes: IAuthenticatorContext, modalContext: ModalContextType) => {
  const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
  const body = { userId: appUserAttributes!.userId, queryType: "activityRange" };
  const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);
  const postResultJSON = await fetchData(url, body, token);

  return postResultJSON;
}

const getDbFilterBarOptions = async(appUserAttributes: IAuthenticatorContext, filterBarType: FilterBarTypes, modalContext: ModalContextType, startDate: Date, endDate: Date) => {
  const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
  const body = { userId: appUserAttributes!.userId, queryType: "filterBarOptions", filterBarType: filterBarType, startDate: createDateStringFromDate(startDate), 
    endDate: createDateStringFromDate(endDate) };
  
  const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);
  const postResultJSON = await fetchData(url, body, token);

  return postResultJSON;
}

export const formatFilterBarValuesForServer = (filterBarValues: IFilterBarValues): IServerFilterValues => {
  const formattedFilterBarValues: IServerFilterValues = 
      { accountTypeCategories: [], accountTypes: [], accounts: [], assetClasses: [], assets: [], tags: [] };

  if(filterBarValues.accounts && filterBarValues.accounts.length > 0) {
    formattedFilterBarValues.accounts = filterBarValues.accounts.map(el => el.value);
  }
  // Account type filter holds both account type category and account type values, distinguished by level.
  if((filterBarValues.accountTypes && filterBarValues.accountTypes.length > 0) && (filterBarValues.accounts && filterBarValues.accounts.length <= 0)) {
    formattedFilterBarValues.accountTypes = filterBarValues.accountTypes.flatMap(el => el.level === 1 ? el.value : []);
    formattedFilterBarValues.accountTypeCategories = filterBarValues.accountTypes.flatMap(el => el.level === 0 ? el.value : []);
  }
  if(filterBarValues.assets && filterBarValues.assets.length > 0) {
    formattedFilterBarValues.assets = filterBarValues.assets.map(el => el.value);
  }
  if((filterBarValues.assetClasses && filterBarValues.assetClasses.length > 0) && (filterBarValues.assets && filterBarValues.assets.length <= 0)) {
    formattedFilterBarValues.assetClasses = filterBarValues.assetClasses.flatMap(el => convertStringToArray((el.filter as string), ',', Number));
  }
  if(filterBarValues.tags && filterBarValues.tags.length > 0) {
    formattedFilterBarValues.tags = filterBarValues.tags.flatMap(el => el.value);
  }
  if('cashflowCategories' in filterBarValues && filterBarValues.cashflowCategories!.length > 0) {
    formattedFilterBarValues.cashflowCategories = filterBarValues.cashflowCategories!.flatMap(el => el.filter! as string);
  }

  return formattedFilterBarValues;
};

// Determine if asset class and/or asset filters are filtering on Cash along with a subset (or none) of all other securities in scope (accounts, dates...).
// Filtering on asset classes 'Cash Equivalent' or 'Cash', or on asset 'Cash' excludes most or all other securities.  If they are included,
// with or without any other asset classes or assets, then Cash is being included without all other assets.  
// This impacts return calculations and will result in inaccurate returns for Cash and aggregates including Cash.
// Assumes if filters are set on asset class or asset then not all assets are being included.  There is a case where the filter chosen can still include
// all assets, but this function does not cover that case.
export const isCashFilteredWithSubsetOfAssets = (filterBarValues: IFilterBarValues): boolean => {
  // Check assets first, any value here would take precedence over asset classes.
  if('assets' in filterBarValues) {
    for(let i=0; i < filterBarValues.assets!.length; i++) {
      if(filterBarValues.assets![i].value === CASH_SECURITY_ID) {
        return true;
      }
    }
  }

  if('assetClasses' in filterBarValues) {
    for(let i=0; i < filterBarValues.assetClasses!.length; i++) {
      if((filterBarValues.assetClasses![i].value === CASH_EQUIVALENT_ASSET_CLASS_ID) || (filterBarValues.assetClasses![i].value === CASH_ASSET_CLASS_ID)) {
        return true;
      }
    }
  }

  return false;
}

const headingInfo = 
<div className="info-button--info">
  <h2>Filters</h2>
  <div>The Filters Bar allows you to narrow down the data shown in the main panels based on the selected filter options.</div>
  <div>If you click 'clear all,' it resets the 'As of Date' to today and removes all other filters, so you can see all of the current data without any restrictions.</div>
</div>;
