import { FilterableFilterBarCategories, IFilterBarOption, IFilterBarOptions, IFilterBarValues } from '../FilterBarDeclarations';


// Go through each filter selection and determine if it is a valid choice given the values in other filters.
// Supports multi selection in any filter.
export const validateFilterValues = (filterBarOptions: IFilterBarOptions, filterBarValues: IFilterBarValues): [IFilterBarValues, boolean] => {
  let accountTypeFilterValue: { value: number, label: string }[] | null = 
    (filterBarValues.accountTypes && filterBarValues.accountTypes.length > 0) ? filterBarValues.accountTypes : null;
  let accountFilterValue: { value: number, label: string }[] | null = 
    (filterBarValues.accounts && filterBarValues.accounts.length > 0) ? filterBarValues.accounts : null;
  let assetClassFilterValue: { value: number, label: string }[] | null = 
    (filterBarValues.assetClasses && filterBarValues.assetClasses.length > 0) ? filterBarValues.assetClasses : null;
  let assetFilterValue: { value: number, label: string }[] | null = 
    (filterBarValues.assets && filterBarValues.assets.length > 0) ? filterBarValues.assets : null;
  let tagFilterValue: { value: number, label: string }[] | null = 
    (filterBarValues.tags && filterBarValues.tags.length > 0) ? filterBarValues.tags : null;

  let validatedFilterBarValues = { ...filterBarValues };
  let didValuesChange = false;

  // Validate each filter selection is in its respective options list
  if(accountTypeFilterValue && !isValueInOptions(accountTypeFilterValue, filterBarOptions.accountTypes ? filterBarOptions.accountTypes : [])) {
    validatedFilterBarValues.accountTypes = [];
    accountTypeFilterValue = null;
    didValuesChange = true;
  }
  if(accountFilterValue && !isValueInOptions(accountFilterValue, filterBarOptions.accounts ? filterBarOptions.accounts : [])) {
    validatedFilterBarValues.accounts = [];
    accountFilterValue = null;
    didValuesChange = true;
  }
  if(assetFilterValue && !isValueInOptions(assetFilterValue, filterBarOptions.assets ? filterBarOptions.assets : [])) {
    validatedFilterBarValues.assets = [];
    assetFilterValue = null;
    didValuesChange = true;
  }
  if(assetClassFilterValue && !isValueInOptions(assetClassFilterValue, filterBarOptions.assetClasses ? filterBarOptions.assetClasses : [])) {
    validatedFilterBarValues.assetClasses = [];
    assetClassFilterValue = null;
    didValuesChange = true;
  }
  if(tagFilterValue && !isValueInOptions(tagFilterValue, filterBarOptions.tags ? filterBarOptions.tags : [])) {
    validatedFilterBarValues.tags = [];
    tagFilterValue = null;
    didValuesChange = true;
  }

  // First validate account is associated with account type
  if(accountFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(accountFilterValue, accountTypeFilterValue,
      filterBarOptions.accounts || [], FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.accounts = [];
        accountFilterValue = null;
        didValuesChange = true;
    }
  }

  // Second validate asset class is associated with account (first priority) or account type
  if(assetClassFilterValue && (accountFilterValue || accountTypeFilterValue)) {
    if(!isValueAssociatedWithOptions(assetClassFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assetClasses || [], accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assetClasses = [];
        assetClassFilterValue = null;
        didValuesChange = true;
    }
  }

  // Third validate asset is associated with asset class
  if(assetFilterValue && assetClassFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, assetClassFilterValue,
      filterBarOptions.assets || [], FilterableFilterBarCategories.assetClasses)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  // Fourth validate asset is associated with account (first priority) or account type
  if(assetFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(assetFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.assets || [], accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
        validatedFilterBarValues.assets = [];
        assetFilterValue = null;
        didValuesChange = true;
    }
  }

  // Fifth validate tag is associated with account (first priority) or account type
  if(tagFilterValue && accountTypeFilterValue) {
    if(!isValueAssociatedWithOptions(tagFilterValue, (accountFilterValue || accountTypeFilterValue!),
      filterBarOptions.tags || [], accountFilterValue ? FilterableFilterBarCategories.accounts : FilterableFilterBarCategories.accountTypes)) {
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

      const associations = checkOption.associations ? checkOption.associations[associationType] : {};
      // If at least one of the associated values for the checkValue option exists in the matchValue list then true (some function), else false.
      keepCheckValue = Object.values(associations).some((el => matchValue.find(el2 => el === el2.value)));
      index++;
  };

  return keepCheckValue;
};

const getFilterBarOption = (filterBarOptions: IFilterBarOption[], value: number): IFilterBarOption | undefined => {
  const result = filterBarOptions.find(el => el.value === value);
  return result;
};