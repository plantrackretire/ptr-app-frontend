import { useContext, useEffect, useState } from 'react';
import { AccountView, IAccount, IAccountGroupCategoryValues } from '../../../components/AccountView';
import { HoldingView, HoldingsFilterTypes, IHolding, IHoldingsFilter, calcHoldingsTotals, holdingsFilterAll } from '../../../components/HoldingView';
import { createDateFromDayValue, getBeginningOfYear } from '../../../utils/dates';
import { IFilterBarValues } from '../../../components/FilterBar';
import { convertStringToArray, fetchData, getUserToken } from '../../../utils/general';
import { AuthenticatorContext } from '../../../providers/AppAuthenticatorProvider';
import { PtrAppApiStack } from '../../../../../ptr-app-backend/cdk-outputs.json';
import { ModalType, useModalContext } from '../../../providers/Modal';
import { AssetAllocationCharts } from './AssetAllocationCharts';
import './AssetAllocation.css';


interface IAssetAllocation {
    filterBarValues: IFilterBarValues,
    dbHoldings: IHolding[] | null,
    dbAccounts: {[index: number]: IAccount} | null,
}

export interface IAssetClass {
    assetClassId: number,
    assetClassName: string,
    assetClassFullName: string,
    assetClassLevel: number,
    parentAssetClassId: number | null,
    childAssetClassIdList: string,
    childAssetClassIdArray?: number[],
}

export interface ITargetAssetAllocation {
    assetClassId: number,
    allocationPercentage: number,
}

export interface ITargetAssetClassRecord extends IAssetClass {
    targetPercentage: number,
    targetValue: number,
    actualValue: number,
    actualPercentage: number,
    consolidatedAssetClassId: number, // Factors in asset classes being grouped together for charting
    color: string,
}

export type ITargetAssetClassRecords = { [index: number]: ITargetAssetClassRecord }

export enum AaDisplayTypes {
  actualsOnly = "actualsOnly",
  targetsOnly = "targetsOnly",
  actualsVsTargets = "actualsVsTargets",
}

export const AssetAllocation: React.FC<IAssetAllocation> = ({ filterBarValues, dbHoldings, dbAccounts }) => {
    const [aaViewLevel, setAaViewLevel] = useState<number>(-1);
    const [aaDisplay, setAaDisplay] = useState<AaDisplayTypes>(AaDisplayTypes.actualsVsTargets);
    const [dbAssetClasses, setDbAssetClasses] = useState<IAssetClass[] | null>(null);
    const [dbTargetAssetClassAllocations, setDbTargetAssetClassAllocations] = useState<ITargetAssetAllocation[] | null>(null);
    const [holdingsFilters, setHoldingsFilters] = useState<IHoldingsFilter[]>([holdingsFilterAll]);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        const getData = async() => {
          const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
          // Assumes only one tag chosen at a time, if more than one can be chosen the the first one is being used.
          const tagId = filterBarValues.tags.length > 0 ? filterBarValues.tags[0].value : 0;
          const includeTargets =
            !(filterBarValues.accounts.length > 0 || filterBarValues.accountTypes.length > 0 || filterBarValues.assetClasses.length > 0 || filterBarValues.assets.length > 0);
          const bodyHoldings = { 
            userId: appUserAttributes!.userId, 
            queryType: "getAssetClasses", 
            tagId: tagId, 
            includeTargetAllocations: includeTargets, 
          };

          const token = await getUserToken(appUserAttributes!.signOutFunction!, modalContext);

          const results = await Promise.all([
              fetchData(url, bodyHoldings, token),
          ]);
          if(results === null || results.length <= 0) {
              await modalContext.showModal(
                  ModalType.confirm,
                  'Error retreiving Asset Allocation page data, please try again.',
              );
              setDbAssetClasses([]);
              setDbTargetAssetClassAllocations([]);
              return () => { ignoreResults = true };
          }

          let assetClasses = [];
          if('assetClasses' in results[0]) {
            assetClasses = results[0].assetClasses;
          } else {
            // TODO: Throw exception
            console.log("assetClasses not in GetAssetClasses API results.");
          }
          let targetAssetClassAllocations = [];
          if('targetAssetClassAllocations' in results[0]) {
            targetAssetClassAllocations = results[0].targetAssetClassAllocations;
          } else {
            // TODO: Throw exception
            console.log("targetAssetClassAllocations not in GetAssetClasses API results.");
          }

          // Test data
          // const assetClasses = tmpAssetClasses;
          // const targetAssetClassAllocations = tmpTargetAllocation;
          
          // Convert string list of child asset class id's to an array of numbers on each asset class.
          createChildAssetClassArrays(assetClasses);
                  
          if(!ignoreResults) {
            setDbAssetClasses(assetClasses);
            if(targetAssetClassAllocations) {
              setDbTargetAssetClassAllocations(targetAssetClassAllocations);
            } else {
              setDbTargetAssetClassAllocations([]);
            }
          }
        }

        getData();
    
        return () => { ignoreResults = true };
    }, [filterBarValues])

    // Set a boolean to easily determine if actuals and/or targets should be displayed.
    const displayActuals = (aaDisplay === AaDisplayTypes.actualsOnly || aaDisplay === AaDisplayTypes.actualsVsTargets) ? true : false;
    const displayTargets = (aaDisplay === AaDisplayTypes.actualsVsTargets || aaDisplay === AaDisplayTypes.targetsOnly);

    // If holdings filter results in zero record and we do have holdings, then revert to 'All' filter.
    const handleZeroFilterResults = () => {
        if(dbHoldings && dbHoldings.length > 0) {
            setHoldingsFilters([holdingsFilterAll]);
        }
    }

    // Use dbHoldings to denote data loading and placeholders should be displayed.
    let holdings: IHolding[] | null = dbHoldings;
    let targetAssetClassAllocations: ITargetAssetAllocation[] | null = displayTargets ? dbTargetAssetClassAllocations : [];
    if(dbAssetClasses === null || dbTargetAssetClassAllocations === null) {
        holdings = null;
    }

    // Calc total holdings and change from start date for title.
    let changeFromStartDate = null; let total = null; let numAssetClasses = 0;
    if(holdings !== null) {
      const totals = calcHoldingsTotals(holdings);
      changeFromStartDate = totals.changeInValue;
      total = totals.endTotal;
      numAssetClasses = totals.uniqueAssetClasses;
    }

    // Create temp target records tree to calc max level.  
    // Will have to do again later after asset classes are updated for display level, but this must be done before that update to get the correct number of levels available.
    // TODO: If performance issues consider storing this as state to avoid repeating.
    let maxLevel = null; // maxLevel has to start as null as it tells other components to show placeholders.
    if(holdings !== null) {
      const [_tmpAcChildToTargetMapping, tmpTacRecordsTree] = createAcMappingAndTree(holdings, dbAssetClasses!, targetAssetClassAllocations!, displayActuals);
      maxLevel = getMaxAssetClassLevel(tmpTacRecordsTree, dbAssetClasses!);
    }

    // If viewing an asset class level other than the lowest level (highest number or -1) then make a copy of holdings and targets and set asset class id's accordingly.
    // level of -1 is default and denotes the lowest level (highest number level), which equates to the original asset classes, hence not re-creating records in that case.
    // TODO: If a performance issue do this in useEffect and store revised holdings in state.
    if(holdings !== null && (aaViewLevel !== -1 && aaViewLevel !== maxLevel)) {
      holdings = createHoldingsWithAssetClassLevel(holdings, aaViewLevel, dbAssetClasses!);
      if(displayTargets) {
        targetAssetClassAllocations = createTargetAllocationsWithAssetClassLevel(targetAssetClassAllocations!, aaViewLevel, dbAssetClasses!);
      }
    }

    let acChildToTargetMapping: { [index: number]: number } = {}; // Maps each used asset class to its target asset class.
    let tacRecordsTree: ITargetAssetClassRecords = {}; // Tree is used to quickly find each record when assigning holdings to target records.
    let tacRecords: ITargetAssetClassRecord[] | null = null; // Array of asset class records (actuals not mapped to a target will appear as their own target).
    if(holdings !== null) {
      [acChildToTargetMapping, tacRecordsTree] = createAcMappingAndTree(holdings, dbAssetClasses!, targetAssetClassAllocations!, displayActuals);
      tacRecords = Object.values(tacRecordsTree);
      assignValues(tacRecords, total ? total : 0);
    }

    // Used to determine how accounts are grouped in the account view.  Requires the record tree created above.
    const getAccountGroupValues = (holding: IHolding, _account: IAccount): IAccountGroupCategoryValues => {
        // TODO: Handle case where record not found (should not happen).
        const tacRecord: ITargetAssetClassRecord = tacRecordsTree[acChildToTargetMapping[holding.assetClassId]];

        return {
            accountGroupCategoryId: tacRecord.assetClassId,
            accountGroupCategoryName: tacRecord.assetClassFullName.replace(/:/g, " - "),
            accountGroupCategoryFilterValue: tacRecord.childAssetClassIdArray!,
        };
    }

    // startDate used in account and holdings views to get starting value to calc change in value
    const asOfDate = createDateFromDayValue(filterBarValues.asOfDate);
    const startDate = getBeginningOfYear(asOfDate);

    if(holdings !== null && tacRecords !== null && tacRecords.length === 0) {
      return <div className="no-data-found"><h1>No data found, please adjust your filters.</h1></div>;
    }

    return (
        <div className='content-two-col scrollable'>
            <div className='content-two-col--col scrollable'>
                <AssetAllocationCharts
                  aaDisplayType={aaDisplay}
                  setAaDisplayType={setAaDisplay}
                  aaDisplayLevel={aaViewLevel}
                  setAaDisplayLevel={setAaViewLevel}
                  filterBarValues={filterBarValues}
                  totalValue={total}
                  maxLevel={maxLevel}
                  numAssetClasses={numAssetClasses}
                  changeFromStartDate={changeFromStartDate}
                  dbTargetAssetClassAllocations={dbTargetAssetClassAllocations}
                  tacRecords={tacRecords}
                />
                { displayActuals &&
                  <AccountView
                      title="Accounts by Asset Class"
                      startDate={startDate}
                      asOfDate={asOfDate}
                      accounts={dbAccounts}
                      holdings={holdings}
                      getAccountGroupValues={getAccountGroupValues}
                      accountGroupCategoryFilterType={HoldingsFilterTypes.assetClass}
                      holdingsFilters={holdingsFilters}
                      setHoldingsFilters={setHoldingsFilters}
                  />
                }
            </div>
            <div className='content-two-col--col scrollable'>
                { displayActuals ?
                  <HoldingView 
                      startDate={startDate} 
                      asOfDate={asOfDate} 
                      holdings={holdings}
                      accounts={dbAccounts} 
                      filters={holdingsFilters}
                      filterBarValues={filterBarValues}
                      handleZeroFilterResults={handleZeroFilterResults}
                  />
                :
                  <div className="no-data-found"><h2>Only showing targets, no holdings to display.</h2></div>
                }
            </div>
        </div>
    );
};

const createAcMappingAndTree = (holdings: IHolding[], assetClasses: IAssetClass[], targetAssetClassAllocations: ITargetAssetAllocation[], displayActuals: boolean):
  [{ [index: number]: number }, ITargetAssetClassRecords] => {
  // Creates reverse mapping of target asset class children back to target asset class for quick lookups.
  // This mapping is used to determine if a target record exists for an actual record.
  const acChildToTargetMapping = createAcChildToTargetMapping(targetAssetClassAllocations, assetClasses);

  // Create initial set of target recrods based on targets, actuals will be layered on top of this.
  const tacRecordsTree = createTargetAssetClassRecords(targetAssetClassAllocations, assetClasses);

  // Add actual holdings to the target record tree.  If it already exists then add to existing, otherwise create a new record for it.
  if(displayActuals) {
    addHoldingsToTargetAssetClassRecords(holdings, tacRecordsTree, assetClasses, acChildToTargetMapping);
  }

  return [acChildToTargetMapping, tacRecordsTree];
}

const getMaxAssetClassLevel = (tacRecords: ITargetAssetClassRecords, assetClasses: IAssetClass[]) => {
  const assetClassLevelMap: { [index: number]: number } = {};
  const assetClassLevelCount: { [index: number]: number } = {};
  let maxLevel = 0;

  Object.values(tacRecords).forEach(record => {
    if(!(record.assetClassId in assetClassLevelMap)) {
      const ac = assetClasses.find(ac => ac.assetClassId === record.assetClassId);
      (ac?.assetClassLevel! in assetClassLevelCount) ? 
        assetClassLevelCount[ac?.assetClassLevel!] = assetClassLevelCount[ac?.assetClassLevel!] + 1 :
        assetClassLevelCount[ac?.assetClassLevel!] = 1;
      assetClassLevelMap[record.assetClassId] = record.assetClassId
      // TODO: Handle not found case
      if(ac?.assetClassLevel! > maxLevel) maxLevel = ac?.assetClassLevel!;
    }
  });

  return maxLevel;
}

const createHoldingsWithAssetClassLevel = (records: IHolding[], aaViewLevel: number, assetClasses: IAssetClass[]): IHolding[] => {
  const assetClassLevelMap: { [index: number]: number } = {};

  const newRecords = records.map(record => {
    const newRecord = { ...record };
    if(!(record.assetClassId in assetClassLevelMap)) {
      const newAssetClassId = getAssetClassLevelMapping(assetClasses, record.assetClassId, aaViewLevel);
      assetClassLevelMap[record.assetClassId] = newAssetClassId;
    }
    newRecord.assetClassId = assetClassLevelMap[record.assetClassId];
    
    return newRecord;
  });
  
  return newRecords;
}

// Target asset allocation list is expected to have each asset class id once, so using map to consolidate where we have duplicates when moving to higher level.
const createTargetAllocationsWithAssetClassLevel = (records: ITargetAssetAllocation[], aaViewLevel: number, assetClasses: IAssetClass[]): ITargetAssetAllocation[] => {
  const assetClassLevelMap: { [index: number]: number } = {};
  const assetClassMap: { [index: number]: ITargetAssetAllocation } = {};

  records.forEach(record => { 
    let newAssetClassId = 0;
    if(!(record.assetClassId in assetClassLevelMap)) {
      const assetClassId = getAssetClassLevelMapping(assetClasses, record.assetClassId, aaViewLevel);
      newAssetClassId = assetClassId;
      assetClassLevelMap[record.assetClassId] = newAssetClassId;
    } else {
      newAssetClassId = assetClassLevelMap[record.assetClassId];
    }

    if(newAssetClassId in assetClassMap) {
      const existingRec = assetClassMap[newAssetClassId];
      existingRec.allocationPercentage += record.allocationPercentage;
    } else {
      const newRecord = { ...record };
      newRecord.assetClassId = newAssetClassId;
      assetClassMap[newAssetClassId] = newRecord;
    }
  });
  
  return Object.values(assetClassMap);
}

const getAssetClassLevelMapping = (assetClasses: IAssetClass[], assetClassId: number, aaViewLevel: number): number => {
  let currentAssetClass = assetClasses.find(ac => ac.assetClassId === assetClassId);

  if(!currentAssetClass) {
    // TODO: Throw exception
    return 0;
  }
  if(currentAssetClass.assetClassLevel <= aaViewLevel) {
    return assetClassId;
  }

  while(currentAssetClass.assetClassLevel !== aaViewLevel) {
    currentAssetClass = assetClasses.find(ac => ac.assetClassId === currentAssetClass?.parentAssetClassId);
    if(!currentAssetClass) {
      // TODO: Throw exception
      return 0;
    }
  }

  return currentAssetClass.assetClassId;
}

const createChildAssetClassArrays = (assetClasses: IAssetClass[]) => {
    assetClasses.forEach(assetClass => {
        assetClass.childAssetClassIdArray = convertStringToArray((assetClass.childAssetClassIdList), ',', Number);
    });
}

const createAcChildToTargetMapping = (targetAssetClassAllocations: ITargetAssetAllocation[], assetClasses: IAssetClass[]): { [index: number]: number } => {
    const acChildToParentMapping: { [index: number]: number } = {};

    targetAssetClassAllocations.forEach(targetAssetClassAllocation => {
        // TODO: Handle asset class not found and child list not existing.
        const ac = assetClasses.find(ac => ac.assetClassId === targetAssetClassAllocation.assetClassId);
        ac?.childAssetClassIdArray!.forEach(childAssetClassId => {
            if(!(childAssetClassId in acChildToParentMapping)) {
                acChildToParentMapping[childAssetClassId] = ac?.assetClassId!;
            }
        });
    });

    return acChildToParentMapping;
}

const createTargetAssetClassRecords = (targetAssetClassAllocations: ITargetAssetAllocation[], assetClasses: IAssetClass[]): ITargetAssetClassRecords => {
    const tacRecords: { [index: number]: any } = {};

    targetAssetClassAllocations.forEach(taca => {
        // TODO: Handle asset class not found.
        const ac = assetClasses.find(ac => ac.assetClassId === taca.assetClassId);

        tacRecords[taca.assetClassId] = createTargetAssetClassAllocationRecord(ac!, taca);
    });

    return tacRecords;
}

const addHoldingsToTargetAssetClassRecords = (holdings: IHolding[], tacRecordsTree: ITargetAssetClassRecords,
    assetClasses: IAssetClass[], acChildToTargetMapping: { [index: number]: number }) => {
    let tacRecord: ITargetAssetClassRecord;

    holdings.forEach(holding => {
      if(holding.assetClassId in acChildToTargetMapping) {
          tacRecord = tacRecordsTree[acChildToTargetMapping[holding.assetClassId]];
      } else {
          acChildToTargetMapping[holding.assetClassId] = holding.assetClassId;
          const ac = assetClasses.find(ac => ac.assetClassId === holding.assetClassId);
          tacRecord = createTargetAssetClassAllocationRecord(ac!, { assetClassId: holding.assetClassId, allocationPercentage: 0 });
          tacRecordsTree[holding.assetClassId] = tacRecord;
      }
      tacRecord.actualValue += holding.balance;
    });
}

const createTargetAssetClassAllocationRecord = (ac: IAssetClass, taca: ITargetAssetAllocation): ITargetAssetClassRecord => {
    return { 
        ...ac,
        targetPercentage: taca.allocationPercentage,
        targetValue: 0,
        actualValue: 0,
        actualPercentage: 0,
        consolidatedAssetClassId: ac.assetClassId,
        color: '',
    };
}

// Calc values that require the total value and the full list.
const assignValues = (tacRecords: ITargetAssetClassRecord[], totalValue: number) => {
    tacRecords.forEach((tacRecord) => {
        tacRecord.targetValue = totalValue * tacRecord.targetPercentage;
        tacRecord.actualPercentage = totalValue ? tacRecord.actualValue / totalValue : 0;
    });
}


// const tmpTargetAllocation = [
//     {
//       assetClassId: 8,
//       allocationPercentage: 0.4,
//     },
//     {
//       assetClassId: 31,
//       // assetClassId: 12,
//       allocationPercentage: 0.25,
//     },
//     {
//       assetClassId: 34,
//       allocationPercentage: 0.07,
//     },
//     {
//       assetClassId: 43,
//       // assetClassId: 36,
//       allocationPercentage: 0.15,
//     },
//     {
//       assetClassId: 14,
//       // assetClassId: 54,
//       allocationPercentage: 0.13,
//     },
//   ];

//   const tmpAssetClasses = [
//     {
//       assetClassId: 4,
//       assetClassName: "Cash Equivalents",
//       assetClassFullName: "Cash Equivalents",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "4,51,50",
//     },
//     {
//       assetClassId: 50,
//       assetClassName: "Currency",
//       assetClassFullName: "Cash Equivalents:Currency",
//       assetClassLevel: 1,
//       parentAssetClassId: 4,
//       childAssetClassIdList: "50",
//     },
//     {
//       assetClassId: 51,
//       assetClassName: "Money Market",
//       assetClassFullName: "Cash Equivalents:Money Market",
//       assetClassLevel: 1,
//       parentAssetClassId: 4,
//       childAssetClassIdList: "51",
//     },
//     {
//       assetClassId: 53,
//       assetClassName: "Commodities",
//       assetClassFullName: "Commodities",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "53,54",
//     },
//     {
//       assetClassId: 54,
//       assetClassName: "Gold",
//       assetClassFullName: "Commodities:Gold",
//       assetClassLevel: 1,
//       parentAssetClassId: 53,
//       childAssetClassIdList: "54",
//     },
//     {
//       assetClassId: 5,
//       assetClassName: "Crypto",
//       assetClassFullName: "Crypto",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "5,65,60,52",
//     },
//     {
//       assetClassId: 65,
//       assetClassName: "Blend",
//       assetClassFullName: "Crypto:Blend",
//       assetClassLevel: 1,
//       parentAssetClassId: 5,
//       childAssetClassIdList: "65",
//     },
//     {
//       assetClassId: 52,
//       assetClassName: "Coin",
//       assetClassFullName: "Crypto:Coin",
//       assetClassLevel: 1,
//       parentAssetClassId: 5,
//       childAssetClassIdList: "52",
//     },
//     {
//       assetClassId: 60,
//       assetClassName: "Stable Coin",
//       assetClassFullName: "Crypto:Stable Coin",
//       assetClassLevel: 1,
//       parentAssetClassId: 5,
//       childAssetClassIdList: "60",
//     },
//     {
//       assetClassId: 1,
//       assetClassName: "Equities",
//       assetClassFullName: "Equities",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "1,11,10,9,8,7,6,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12",
//     },
//     {
//       assetClassId: 10,
//       assetClassName: "Emerging Markets",
//       assetClassFullName: "Equities:Emerging Markets",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "10,26,25,24",
//     },
//     {
//       assetClassId: 26,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:Emerging Markets:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 10,
//       childAssetClassIdList: "26",
//     },
//     {
//       assetClassId: 25,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:Emerging Markets:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 10,
//       childAssetClassIdList: "25",
//     },
//     {
//       assetClassId: 24,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:Emerging Markets:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 10,
//       childAssetClassIdList: "24",
//     },
//     {
//       assetClassId: 9,
//       assetClassName: "International",
//       assetClassFullName: "Equities:International",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "9,23,22,21",
//     },
//     {
//       assetClassId: 23,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:International:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 9,
//       childAssetClassIdList: "23",
//     },
//     {
//       assetClassId: 22,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:International:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 9,
//       childAssetClassIdList: "22",
//     },
//     {
//       assetClassId: 21,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:International:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 9,
//       childAssetClassIdList: "21",
//     },
//     {
//       assetClassId: 8,
//       assetClassName: "Large Cap",
//       assetClassFullName: "Equities:Large Cap",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "8,20,19,18",
//     },
//     {
//       assetClassId: 20,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:Large Cap:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 8,
//       childAssetClassIdList: "20",
//     },
//     {
//       assetClassId: 19,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:Large Cap:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 8,
//       childAssetClassIdList: "19",
//     },
//     {
//       assetClassId: 18,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:Large Cap:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 8,
//       childAssetClassIdList: "18",
//     },
//     {
//       assetClassId: 7,
//       assetClassName: "Mid Cap",
//       assetClassFullName: "Equities:Mid Cap",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "7,17,16,15",
//     },
//     {
//       assetClassId: 17,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:Mid Cap:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 7,
//       childAssetClassIdList: "17",
//     },
//     {
//       assetClassId: 16,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:Mid Cap:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 7,
//       childAssetClassIdList: "16",
//     },
//     {
//       assetClassId: 15,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:Mid Cap:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 7,
//       childAssetClassIdList: "15",
//     },
//     {
//       assetClassId: 11,
//       assetClassName: "Real Estate",
//       assetClassFullName: "Equities:Real Estate",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "11,29,28,27",
//     },
//     {
//       assetClassId: 29,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:Real Estate:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 11,
//       childAssetClassIdList: "29",
//     },
//     {
//       assetClassId: 28,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:Real Estate:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 11,
//       childAssetClassIdList: "28",
//     },
//     {
//       assetClassId: 27,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:Real Estate:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 11,
//       childAssetClassIdList: "27",
//     },
//     {
//       assetClassId: 6,
//       assetClassName: "Small Cap",
//       assetClassFullName: "Equities:Small Cap",
//       assetClassLevel: 1,
//       parentAssetClassId: 1,
//       childAssetClassIdList: "6,14,13,12",
//     },
//     {
//       assetClassId: 14,
//       assetClassName: "Blend",
//       assetClassFullName: "Equities:Small Cap:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 6,
//       childAssetClassIdList: "14",
//     },
//     {
//       assetClassId: 13,
//       assetClassName: "Growth",
//       assetClassFullName: "Equities:Small Cap:Growth",
//       assetClassLevel: 2,
//       parentAssetClassId: 6,
//       childAssetClassIdList: "13",
//     },
//     {
//       assetClassId: 12,
//       assetClassName: "Value",
//       assetClassFullName: "Equities:Small Cap:Value",
//       assetClassLevel: 2,
//       parentAssetClassId: 6,
//       childAssetClassIdList: "12",
//     },
//     {
//       assetClassId: 2,
//       assetClassName: "Fixed Income",
//       assetClassFullName: "Fixed Income",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "2,33,32,31,30,64,63,61,45,44,43,42,41,40,39,38,37,36,35,34",
//     },
//     {
//       assetClassId: 30,
//       assetClassName: "Government",
//       assetClassFullName: "Fixed Income:Government",
//       assetClassLevel: 1,
//       parentAssetClassId: 2,
//       childAssetClassIdList: "30,36,35,34",
//     },
//     {
//       assetClassId: 35,
//       assetClassName: "Intermediate Term",
//       assetClassFullName: "Fixed Income:Government:Intermediate Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 30,
//       childAssetClassIdList: "35",
//     },
//     {
//       assetClassId: 36,
//       assetClassName: "Long Term",
//       assetClassFullName: "Fixed Income:Government:Long Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 30,
//       childAssetClassIdList: "36",
//     },
//     {
//       assetClassId: 34,
//       assetClassName: "Short term",
//       assetClassFullName: "Fixed Income:Government:Short term",
//       assetClassLevel: 2,
//       parentAssetClassId: 30,
//       childAssetClassIdList: "34",
//     },
//     {
//       assetClassId: 33,
//       assetClassName: "High Yield",
//       assetClassFullName: "Fixed Income:High Yield",
//       assetClassLevel: 1,
//       parentAssetClassId: 2,
//       childAssetClassIdList: "33,64,45,44,43",
//     },
//     {
//       assetClassId: 64,
//       assetClassName: "Blend",
//       assetClassFullName: "Fixed Income:High Yield:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 33,
//       childAssetClassIdList: "64",
//     },
//     {
//       assetClassId: 44,
//       assetClassName: "Intermediate Term",
//       assetClassFullName: "Fixed Income:High Yield:Intermediate Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 33,
//       childAssetClassIdList: "44",
//     },
//     {
//       assetClassId: 45,
//       assetClassName: "Long Term",
//       assetClassFullName: "Fixed Income:High Yield:Long Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 33,
//       childAssetClassIdList: "45",
//     },
//     {
//       assetClassId: 43,
//       assetClassName: "Short term",
//       assetClassFullName: "Fixed Income:High Yield:Short term",
//       assetClassLevel: 2,
//       parentAssetClassId: 33,
//       childAssetClassIdList: "43",
//     },
//     {
//       assetClassId: 32,
//       assetClassName: "Investment Grade",
//       assetClassFullName: "Fixed Income:Investment Grade",
//       assetClassLevel: 1,
//       parentAssetClassId: 2,
//       childAssetClassIdList: "32,61,42,41,40",
//     },
//     {
//       assetClassId: 61,
//       assetClassName: "Blend",
//       assetClassFullName: "Fixed Income:Investment Grade:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 32,
//       childAssetClassIdList: "61",
//     },
//     {
//       assetClassId: 41,
//       assetClassName: "Intermediate Term",
//       assetClassFullName: "Fixed Income:Investment Grade:Intermediate Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 32,
//       childAssetClassIdList: "41",
//     },
//     {
//       assetClassId: 42,
//       assetClassName: "Long Term",
//       assetClassFullName: "Fixed Income:Investment Grade:Long Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 32,
//       childAssetClassIdList: "42",
//     },
//     {
//       assetClassId: 40,
//       assetClassName: "Short term",
//       assetClassFullName: "Fixed Income:Investment Grade:Short term",
//       assetClassLevel: 2,
//       parentAssetClassId: 32,
//       childAssetClassIdList: "40",
//     },
//     {
//       assetClassId: 31,
//       assetClassName: "Municipal",
//       assetClassFullName: "Fixed Income:Municipal",
//       assetClassLevel: 1,
//       parentAssetClassId: 2,
//       childAssetClassIdList: "31,63,39,38,37",
//     },
//     {
//       assetClassId: 63,
//       assetClassName: "Blend",
//       assetClassFullName: "Fixed Income:Municipal:Blend",
//       assetClassLevel: 2,
//       parentAssetClassId: 31,
//       childAssetClassIdList: "63",
//     },
//     {
//       assetClassId: 38,
//       assetClassName: "Intermediate Term",
//       assetClassFullName: "Fixed Income:Municipal:Intermediate Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 31,
//       childAssetClassIdList: "38",
//     },
//     {
//       assetClassId: 39,
//       assetClassName: "Long Term",
//       assetClassFullName: "Fixed Income:Municipal:Long Term",
//       assetClassLevel: 2,
//       parentAssetClassId: 31,
//       childAssetClassIdList: "39",
//     },
//     {
//       assetClassId: 37,
//       assetClassName: "Short term",
//       assetClassFullName: "Fixed Income:Municipal:Short term",
//       assetClassLevel: 2,
//       parentAssetClassId: 31,
//       childAssetClassIdList: "37",
//     },
//     {
//       assetClassId: 55,
//       assetClassName: "Private Investment",
//       assetClassFullName: "Private Investment",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "55,66,57,56,62,59,58",
//     },
//     {
//       assetClassId: 66,
//       assetClassName: "Debt",
//       assetClassFullName: "Private Investment:Debt",
//       assetClassLevel: 1,
//       parentAssetClassId: 55,
//       childAssetClassIdList: "66",
//     },
//     {
//       assetClassId: 56,
//       assetClassName: "Private Company",
//       assetClassFullName: "Private Investment:Private Company",
//       assetClassLevel: 1,
//       parentAssetClassId: 55,
//       childAssetClassIdList: "56,62,59,58",
//     },
//     {
//       assetClassId: 59,
//       assetClassName: "Financial Service",
//       assetClassFullName: "Private Investment:Private Company:Financial Service",
//       assetClassLevel: 2,
//       parentAssetClassId: 56,
//       childAssetClassIdList: "59",
//     },
//     {
//       assetClassId: 58,
//       assetClassName: "MMO Gaming",
//       assetClassFullName: "Private Investment:Private Company:MMO Gaming",
//       assetClassLevel: 2,
//       parentAssetClassId: 56,
//       childAssetClassIdList: "58",
//     },
//     {
//       assetClassId: 62,
//       assetClassName: "Other",
//       assetClassFullName: "Private Investment:Private Company:Other",
//       assetClassLevel: 2,
//       parentAssetClassId: 56,
//       childAssetClassIdList: "62",
//     },
//     {
//       assetClassId: 57,
//       assetClassName: "Venture Capital",
//       assetClassFullName: "Private Investment:Venture Capital",
//       assetClassLevel: 1,
//       parentAssetClassId: 55,
//       childAssetClassIdList: "57",
//     },
//     {
//       assetClassId: 3,
//       assetClassName: "Real Estate",
//       assetClassFullName: "Real Estate",
//       assetClassLevel: 0,
//       parentAssetClassId: null,
//       childAssetClassIdList: "3,46,67,49,48,47",
//     },
//     {
//       assetClassId: 46,
//       assetClassName: "Syndication",
//       assetClassFullName: "Real Estate:Syndication",
//       assetClassLevel: 1,
//       parentAssetClassId: 3,
//       childAssetClassIdList: "46,67,49,48,47",
//     },
//     {
//       assetClassId: 67,
//       assetClassName: "Industrial NNN",
//       assetClassFullName: "Real Estate:Syndication:Industrial NNN",
//       assetClassLevel: 2,
//       parentAssetClassId: 46,
//       childAssetClassIdList: "67",
//     },
//     {
//       assetClassId: 48,
//       assetClassName: "Mobile Home Park",
//       assetClassFullName: "Real Estate:Syndication:Mobile Home Park",
//       assetClassLevel: 2,
//       parentAssetClassId: 46,
//       childAssetClassIdList: "48",
//     },
//     {
//       assetClassId: 47,
//       assetClassName: "Multi-Family",
//       assetClassFullName: "Real Estate:Syndication:Multi-Family",
//       assetClassLevel: 2,
//       parentAssetClassId: 46,
//       childAssetClassIdList: "47",
//     },
//     {
//       assetClassId: 49,
//       assetClassName: "Self Storage",
//       assetClassFullName: "Real Estate:Syndication:Self Storage",
//       assetClassLevel: 2,
//       parentAssetClassId: 46,
//       childAssetClassIdList: "49",
//     },
//   ];
