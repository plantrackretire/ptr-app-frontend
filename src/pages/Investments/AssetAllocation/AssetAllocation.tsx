import { useContext, useEffect, useState } from 'react';
import { AccountView, IAccount, IAccountGroupCategoryValues } from '../../../components/AccountView';
import { HoldingView, HoldingsFilterTypes, IHolding, IHoldingsFilter, calcHoldingsTotals, holdingsFilterAll } from '../../../components/HoldingView';
import { createDateFromDayValue, getBeginningOfYear } from '../../../utils/dates';
import { IFilterBarValues } from '../../../components/FilterBar';
import { IPieChartItem, PieChart } from '../../../components/PieChart';
import { convertStringToArray, fetchData, formatBalance, formatChangePercentage, getUserToken } from '../../../utils/general';
import { AssetAllocationBarTable } from './AssetAllocationBarTable';
import { AuthenticatorContext } from '../../../providers/AppAuthenticatorProvider';
import { PtrAppApiStack } from '../../../../../ptr-app-backend/cdk-outputs.json';
import { ModalType, useModalContext } from '../../../providers/Modal';
import { ChartsTitle } from './ChartsTitle';
import { ChartsOptions } from './ChartsOptions';
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

export enum TargetAADisplayTypes {
  display = "display",
  invalidFilter = "invalidFilter",
  noTargetsForPortfolio = "noTargetsForPortfolio",
  noTargetsForTag = "noTargetsForTag",
};

// Color scheme for pie chart and bar chart, excludes greens and reds
const chartColors = [
    '#0066cc',
    '#009596',
    '#5752D1',
    '#F4C145',
    '#003737',
    '#EC7A08',
    '#B8BBBE',
    '#002F5D',
    '#C58C00',
    '#2A265F',
    '#8F4700',
    '#6A6E73',
];
// Records with indexes greater than the number of colors are grouped under 'Other', using this index to highglight them on hover and handle click.
const otherAssetClassId = -1; 

export const AssetAllocation: React.FC<IAssetAllocation> = ({ filterBarValues, dbHoldings, dbAccounts }) => {
    const [aaViewLevel, setAaViewLevel] = useState<number>(-1); 
    const [dbAssetClasses, setDbAssetClasses] = useState<IAssetClass[] | null>(null);
    const [dbTargetAssetClassAllocations, setDbTargetAssetClassAllocations] = useState<ITargetAssetAllocation[] | null>(null);
    const [displayTargetAssetClassAllocations, setDisplayTargetAssetClassAllocations] = useState<TargetAADisplayTypes>(TargetAADisplayTypes.display);
    const [sortColumn, setSortColumn] = useState<string>("actPercent");
    const [sortDirection, setSortDirection] = useState<string>("desc");
    const [hoverAc, setHoverAc] = useState<number>(0); 
    const [hoverAcChart, setHoverAcChart] = useState<number>(0); 
    const [holdingsFilters, setHoldingsFilters] = useState<IHoldingsFilter[]>([holdingsFilterAll]);
    const appUserAttributes = useContext(AuthenticatorContext);
    const modalContext = useModalContext();

    useEffect(() => {
        // This avoids race conditions by ignoring results from stale calls
        let ignoreResults = false;

        // Assumes only one tag chosen at a time, if more than one can be chosen the the first one is being used.
        const getData = async() => {
          let displayTargets = TargetAADisplayTypes.display;

          // Targets no longer make sense if actuals data is filtered (other than tag).
          if(filterBarValues.accounts.length > 0 || filterBarValues.accountTypes.length > 0 || filterBarValues.assetClasses.length > 0 || filterBarValues.assets.length > 0) {
            displayTargets = TargetAADisplayTypes.invalidFilter;
          }
          const url = PtrAppApiStack.PtrAppApiEndpoint + "GetRefData";
          const tagId = filterBarValues.tags.length > 0 ? filterBarValues.tags[0].value : 0;
          const bodyHoldings = { 
            userId: appUserAttributes!.userId, 
            queryType: "getAssetClasses", 
            tagId: tagId, 
            includeTargetAllocations: (displayTargets === TargetAADisplayTypes.display), 
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
          if(displayTargets === TargetAADisplayTypes.display) {
            if('targetAssetClassAllocations' in results[0]) {
              targetAssetClassAllocations = results[0].targetAssetClassAllocations;
            } else {
              // TODO: Throw exception
              console.log("targetAssetClassAllocations not in GetAssetClasses API results.");
            }
          }

          // Test data
          // const assetClasses = tmpAssetClasses;
          // const targetAssetClassAllocations = tmpTargetAllocation;
          
          if(displayTargets === TargetAADisplayTypes.display && targetAssetClassAllocations.length === 0) {
            if(tagId !== 0) {
              displayTargets = TargetAADisplayTypes.noTargetsForTag;
            } else {
              displayTargets = TargetAADisplayTypes.noTargetsForPortfolio;
            }
          }

          // Convert string list of child asset class id's to an array of numbers on each asset class.
          createChildAssetClassArrays(assetClasses);
                  
          if(!ignoreResults) {
            setDbAssetClasses(assetClasses);
            if(displayTargets === TargetAADisplayTypes.display) {
              setDbTargetAssetClassAllocations(targetAssetClassAllocations);
            } else {
              setDbTargetAssetClassAllocations([]);
            }
            if(displayTargetAssetClassAllocations !== displayTargets) {
              setDisplayTargetAssetClassAllocations(displayTargets);
            }
          }
        }

        getData();
    
        return () => { ignoreResults = true };
    }, [filterBarValues])

    const handlePieChartHover = (keyValue: number) => {
      if(keyValue !== hoverAc) {
        setHoverAc(keyValue);
      }
    }
    const createPieChartTooltipLabel = (tooltipItem: any) => { 
        var dataset = tooltipItem.dataset;
        var total = dataset.data.reduce(function(previousValue: number, currentValue: any) {
          return previousValue + currentValue.value;
        }, 0);
        
        return formatBalance(tooltipItem.raw.value) + " (" + formatChangePercentage(total ? tooltipItem.raw.value / total : 0) + ")"; 
    }    
        
    // If holdings filter results in zero record and we do have holdings, then revert to 'All' filter.
    const handleZeroFilterResults = () => {
        if(dbHoldings && dbHoldings.length > 0) {
            setHoldingsFilters([holdingsFilterAll]);
        }
    }

    // This sort function must be defined here to access state variables, there are an unknown number of levels that may be sorted.
    const assetClassLevelSort = (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => {
      const level = (sortColumn.split('-')[1] as unknown) as number;
      const aSplitFullName = a.assetClassFullName.split(":");
      const bSplitFullName = b.assetClassFullName.split(":");
      const aValue = aSplitFullName.length >= level ? aSplitFullName[level-1] : "";
      const bValue = bSplitFullName.length >= level ? bSplitFullName[level-1] : "";

      return (sortDirection === 'asc') ? (aValue >= bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    }

    // Use dbHoldings to denote data loading and placeholders should be displayed.
    let holdings: IHolding[] | null = dbHoldings;
    let targetAssetClassAllocations: ITargetAssetAllocation[] | null = dbTargetAssetClassAllocations;
    if(dbAssetClasses === null || dbTargetAssetClassAllocations === null) {
        holdings = null;
    }

    // Consolidate actuals and targets to determine max level before updating asset classes for current view level (otherwise full depth will be lost).
    // Need to consolidate because if we don't then max level may be exaggerated (if actual has level 3 asset class, but it is consolidated under level 1 target then max is 1).
    // TODO: If performance issues consider storing this as state to avoid repeating.
    let maxLevel = null; let maxLevelNumAssetClasses = 0;
    if(holdings !== null) {
      // Mapping needed to consolidate actuals and targets.  Creates reverse mapping of target asset class children back to target asset class for quick lookups.
      // This mapping is used to determine if a target record exists for an actual record.
      const tmpAcChildToTargetMapping = createAcChildToTargetMapping(targetAssetClassAllocations!, dbAssetClasses!);

      // Create tree of target asset class records, than add actual holdings into it for a consolidated view.
      const tmpTacRecordsTree = createTargetAssetClassRecords(targetAssetClassAllocations!, dbAssetClasses!);
      addHoldingsToTargetAssetClassRecords(holdings ? holdings : [], tmpTacRecordsTree, dbAssetClasses!, tmpAcChildToTargetMapping, true);

      [maxLevel, maxLevelNumAssetClasses] = getMaxAssetClassLevel(tmpTacRecordsTree, dbAssetClasses!);
    }

    // If viewing an asset class level other than the lowest level (highest number or -1) then make a copy of holdings and set asset class id's accordingly.
    // TODO: If a performance issue do this in useEffect and store revised holdings in state.
    // level of -1 is default and denotes the lowest level (highest number level), which equates to the original asset classes, hence not re-creating records in that case.
    if(holdings !== null && aaViewLevel !== -1) {
      holdings = createHoldingsWithAssetClassLevel(holdings, aaViewLevel, dbAssetClasses!);
      targetAssetClassAllocations = createTargetAllocationsWithAssetClassLevel(targetAssetClassAllocations!, aaViewLevel, dbAssetClasses!);
    }

    // Mapping needed to consolidate actuals and targets.  Creates reverse mapping of target asset class children back to target asset class for quick lookups.
    // This mapping is used to determine if a target record exists for an actual record.
    let acChildToTargetMapping: { [index: number]: number } = {};
    if(targetAssetClassAllocations !== null) {
      acChildToTargetMapping = createAcChildToTargetMapping(targetAssetClassAllocations!, dbAssetClasses!);
    }

    let tacRecordsTree: ITargetAssetClassRecords = {}; // Tree is used to quickly find each record when assigning holdings to target records.
    let tacRecords: ITargetAssetClassRecord[] | null = null;
    let actualsPieChartRecords: IPieChartItem[] | null = null;
    let targetsPieChartRecords: IPieChartItem[] | null = null;
    if(holdings !== null) {
        tacRecordsTree = createTargetAssetClassRecords(targetAssetClassAllocations!, dbAssetClasses!);
        const totalValue = addHoldingsToTargetAssetClassRecords(holdings ? holdings : [], tacRecordsTree, dbAssetClasses!, acChildToTargetMapping);
        tacRecords = Object.values(tacRecordsTree);
        assignValues(tacRecords, totalValue);
        let sortFunc = null;
        if(sortColumn.substring(0, 15) === 'assetClassLevel') {
          sortFunc = assetClassLevelSort;
        } else {
          sortFunc = sortFunctions[sortColumn][sortDirection];
        }
        tacRecords = tacRecords.sort(sortFunc);
        consolidateRecords(tacRecords, chartColors);

        actualsPieChartRecords = consolidateTacRecords(tacRecords, 'actuals');
        targetsPieChartRecords = consolidateTacRecords(tacRecords, 'targets');
    }

    // Used to determine how accounts are grouped in the account view.
    const getAccountGroupValues = (holding: IHolding, _account: IAccount): IAccountGroupCategoryValues => {
        // TODO: Handle case where record not found (should not happen).
        const tacRecord: ITargetAssetClassRecord = tacRecordsTree[acChildToTargetMapping[holding.assetClassId]];

        return {
            accountGroupCategoryId: tacRecord.assetClassId,
            accountGroupCategoryName: tacRecord.assetClassFullName,
            accountGroupCategoryFilterValue: tacRecord.childAssetClassIdArray!,
        };
    }

    // startDate used in account and holdings views to get starting value to calc change in value
    const asOfDate = createDateFromDayValue(filterBarValues.asOfDate);
    const startDate = getBeginningOfYear(asOfDate);

    const tag = filterBarValues.tags.length > 0 ? filterBarValues.tags[0] : 0;
    const targetsSource = tag ? tag.label : 'Entire Portfolio';

    let changeFromStartDate = null; let total = null;
    if(holdings !== null) {
      const totals = calcHoldingsTotals(holdings);
      changeFromStartDate = totals.changeInValue;
      total = totals.endTotal;
    }

    if(holdings !== null && holdings.length === 0) {
      return <div className="no-data-found"><h1>No data found, please adjust your filters.</h1></div>;
    }

    return (
        <div className='content-two-col scrollable'>
            <div className='content-two-col--col scrollable'>
                <div className='asset-allocation--chart-area'>
                  <ChartsTitle titleBalance={total} titleChangeFromStartDate={changeFromStartDate} />
                  <ChartsOptions
                      currentLevel={aaViewLevel}
                      maxLevel={maxLevel}
                      setLevel={setAaViewLevel}
                      displayTargetAssetClassAllocations={displayTargetAssetClassAllocations}
                      targetsSource={targetsSource}
                  />
                  <AssetAllocationBarTable
                      tacRecords={tacRecords}
                      hoverAc={hoverAc}
                      setHoverAc={(ac: number) => {
                        setHoverAcChart(1);
                        setHoverAc(ac);
                      }}
                      numLevels={(aaViewLevel === -1) ? (maxLevel ? (maxLevel+1) : 1) : (aaViewLevel+1)}
                      maxRecords={maxLevelNumAssetClasses}
                      displayTargetAssetClassAllocations={(displayTargetAssetClassAllocations === TargetAADisplayTypes.display)}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      setSortColumn={setSortColumn}
                      setSortDirection={setSortDirection}
                  />
                  <div className='asset-allocation--pie-charts'>
                      <PieChart
                          pieChartItems={actualsPieChartRecords}
                          title='Actuals'
                          height='250px'
                          hoverLookupValue={hoverAc}
                          hoverLookupType={(hoverAcChart === 2 ? 'internal' : 'external')}
                          createTooltipLabel={createPieChartTooltipLabel}
                          handleOnHover={(ac: number) => {
                            setHoverAcChart(2);
                            handlePieChartHover(ac);
                          }}
                      />
                      { (displayTargetAssetClassAllocations === TargetAADisplayTypes.display) &&
                        <PieChart
                            pieChartItems={targetsPieChartRecords}
                            title='Targets'
                            height='250px'
                            hoverLookupValue={hoverAc}
                            hoverLookupType={(hoverAcChart === 3 ? 'internal' : 'external')}
                            createTooltipLabel={createPieChartTooltipLabel}
                            handleOnHover={(ac: number) => {
                              setHoverAcChart(3);
                              handlePieChartHover(ac);
                            }}
                        />
                      }
                  </div>
                </div>
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
            </div>
            <div className='content-two-col--col scrollable'>
                <HoldingView 
                    startDate={startDate} 
                    asOfDate={asOfDate} 
                    holdings={holdings}
                    accounts={dbAccounts} 
                    filters={holdingsFilters}
                    filterBarValues={filterBarValues}
                    handleZeroFilterResults={handleZeroFilterResults}
                />
            </div>
        </div>
    );
};

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

  let maxLevelNumAssetClasses = 0;
  assetClasses.forEach(ac => { if(ac.assetClassLevel === maxLevel) maxLevelNumAssetClasses++; });

  return [maxLevel, maxLevelNumAssetClasses];
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
    assetClasses: IAssetClass[], acChildToTargetMapping: { [index: number]: number }, ignoreValues?: boolean): number => {
    let totalValue = 0;
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
        if(!ignoreValues) {
          tacRecord.actualValue += holding.balance;
          totalValue += holding.balance;
        }
    });

    return totalValue;
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

// If there are more records than colors then create an 'Other' group and put remaining records into it.  Assumes records are sorted as desired.
const consolidateRecords = (tacRecords: ITargetAssetClassRecord[], chartColors: string[]) => {
  tacRecords.forEach((tacRecord, index) => {
      if(index < chartColors.length) {
          tacRecord.color = chartColors[index];
          if(index === (chartColors.length-1) && (tacRecords.length > chartColors.length)) {
              tacRecord.consolidatedAssetClassId = otherAssetClassId;
          }
      } else {
          tacRecord.color = chartColors[chartColors.length-1];
          tacRecord.consolidatedAssetClassId = otherAssetClassId;
      }
  });
}

// allocType is either 'actuals' or 'targets'.
// consolidatedAssetClassId is the same as assetClassId, unless there are more records than colors, excess records will share an 'Other' consolidated id.
const consolidateTacRecords = (tacRecords: ITargetAssetClassRecord[], allocType: string): IPieChartItem[] => {
    let pcr: IPieChartItem[] = [];
    const tacConsolidatedMapping: { [index: number]: number } = {}; // Capture index of pcr array each color is in, used to group together records with same color.

    const pieChartRecords = tacRecords.reduce((pcr, tacRecord) => {
        if((allocType === 'actuals' && tacRecord.actualValue !== 0) || (allocType === 'targets' && tacRecord.targetValue !== 0)) {
            if(tacRecord.consolidatedAssetClassId in tacConsolidatedMapping) {
                const pcrRec = pcr[tacConsolidatedMapping[tacRecord.consolidatedAssetClassId]];
                pcrRec.value += (allocType === 'actuals') ? tacRecord.actualValue : tacRecord.targetValue;
                pcrRec.label = 'Other';
                pcrRec.lookupValue = otherAssetClassId;
            } else {
                tacConsolidatedMapping[tacRecord.consolidatedAssetClassId] = pcr.length;
                pcr.push({
                    value: (allocType === 'actuals') ? tacRecord.actualValue : tacRecord.targetValue,
                    label: tacRecord.assetClassFullName, // Don't use 'Other' in case there are no more records to consolidate with.
                    lookupValue: tacRecord.consolidatedAssetClassId,
                    color: tacRecord.color,
                });
            }
        }

        return pcr;
    }, pcr);

    return pieChartRecords;
}  

const sortFunctions: { [index: string]: { [index: string]: (a: ITargetAssetClassRecord, b: ITargetAssetClassRecord) => number } } = {
  'assetClass': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        a.assetClassFullName >= b.assetClassFullName ? 1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        a.assetClassFullName <= b.assetClassFullName ? 1 : -1,
    },
  'assetClassLevel': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => {
        return a.assetClassFullName >= b.assetClassFullName ? 1 : -1
      },
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => {
        return a.assetClassFullName <= b.assetClassFullName ? 1 : -1
      },
    },
  'actValue': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.actualValue || 0) >= (b.actualValue || 0) ? 1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.actualValue || 0) <= (b.actualValue || 0) ? 1 : -1,
    },
  'actPercent':
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.actualPercentage || 0) >= (b.actualPercentage || 0) ? 1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.actualPercentage || 0) <= (b.actualPercentage || 0) ? 1 : -1,
    },
  'tgtPercent': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        a.targetPercentage >= b.targetPercentage ? 1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        a.targetPercentage <= b.targetPercentage ? 1 : -1,
    },
    'delta': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.targetPercentage ? ((a.actualPercentage - a.targetPercentage) / a.targetPercentage) : (a.actualPercentage > 0 ? 1 : (a.actualPercentage < 0 ? -1 : 0))) >= 
        (a.targetPercentage ? ((b.actualPercentage - b.targetPercentage) / b.targetPercentage) : (b.actualPercentage > 0 ? 1 : (b.actualPercentage < 0 ? -1 : 0))) ? 
        1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.targetPercentage ? ((a.actualPercentage - a.targetPercentage) / a.targetPercentage) : (a.actualPercentage > 0 ? 1 : (a.actualPercentage < 0 ? -1 : 0))) <= 
        (a.targetPercentage ? ((b.actualPercentage - b.targetPercentage) / b.targetPercentage) : (b.actualPercentage > 0 ? 1 : (b.actualPercentage < 0 ? -1 : 0))) ? 
        1 : -1,
    },
};


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


/* Possible color palletes
#003f5c
#2f4b7c
#665191
#a05195
#d45087
#f95d6a
#ff7c43
#ffa600


// Color groups, each group is progressively darker
#8BC1F7
#BDE2B9
#A2D9D9
#B2B0EA
#F9E0A2
#F4B678
#C9190B
#F0F0F0

#519DE9
#7CC674
#73C5C5
#8481DD
#F6D173
#EF9234
#A30000
#D2D2D2

#06C
#4CB140
#009596
#5752D1
#F4C145
#EC7A08
#7D1007
#B8BBBE

#004B95
#38812F
#005F60
#3C3D99
#F0AB00
#C46100
#470000
#8A8D90

#002F5D
#23511E
#003737
#2A265F
#C58C00
#8F4700
#2C0000
#6A6E73
*/