import { DayValue, Day } from '@hassanmojab/react-modern-calendar-datepicker';


export enum FilterBarTypes {
  investmentReview = "investmentReview",
  drawdown = "drawdown",
}

export interface IActivityRange {
  startDate: Day,
  endDate: Day,
}

// TODO: If no longer using droplist for majority of filters try to elimnate this and have everything work with FilterBarOption (will have to transalte for drop lists).
export type DropListFilterBarValue = { value: number, label: string, filter?: (number | string), level?: number, parent?: number };
export type DropListFilterBarValues = DropListFilterBarValue[];

export interface IInvestmentReviewFilterBarValues {
  accountTypes?: DropListFilterBarValues,
  accounts?: DropListFilterBarValues,
  assetClasses?: DropListFilterBarValues,
  assets?: DropListFilterBarValues,
  tags?: DropListFilterBarValues,
};
export interface IDrawdownFilterBarValues {
  cashflowCategories?: DropListFilterBarValues,
  years?: DropListFilterBarValues,
  tags?: DropListFilterBarValues,
};
export interface IFilterBarValues extends IInvestmentReviewFilterBarValues, IDrawdownFilterBarValues {
  asOfDate: DayValue,
  startDate?: DayValue,
};

export interface IFilterBarOption {
  value: number,
  label: string,
  filter?: any,
  level?: number,
  parent?: any,
  associations?: IAssociations,
  isDirect?: number,
};
interface IInvestmentReviewFilterBarOptions {
  accountTypes?: IFilterBarOption[],
  accounts?: IFilterBarOption[],
  assetClasses?: IFilterBarOption[],
  assets?: IFilterBarOption[],
  tags?: IFilterBarOption[],
};
interface IDrawdownFilterBarOptions {
  years?: IFilterBarOption[],
  tags?: IFilterBarOption[],
};
// All of the option category names must match those used in the server side function.
export interface IFilterBarOptions extends IInvestmentReviewFilterBarOptions, IDrawdownFilterBarOptions {};

// Used for generic mapping to filter categories in validation and other functions.  Only requires categories that utilize these functions.
// Account Type Category does not appear here because it goes together with Account Types in account type filter (distinguished by level: 0 and 1).
export enum FilterableFilterBarCategories {
  accountTypes = "accountTypes",
  accounts = "accounts",
  assetClasses = "assetClasses",
  assets = "assets",
  tags = "tags",
  years = "years",
};

export interface IAssociations {
  accountTypes: { [index: number]: number },
  accounts: { [index: number]: number },
  assetClasses: { [index: number]: number },
  assets: { [index: number]: number },
  tags: { [index: number]: number },
  years: { [index: number]: number },
};

// Format expected by REST API
export interface IServerFilterValues {
  accountTypeCategories?: number[], 
  accountTypes?: number[], 
  accounts?: number[], 
  assetClasses?: number[], 
  assets?: number[], 
  tags?: number[],
  cashflowCategories?: string[],
}