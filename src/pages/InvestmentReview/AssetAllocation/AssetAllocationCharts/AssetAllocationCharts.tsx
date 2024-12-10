import { useContext, useState } from 'react';
import { IFilterBarValues } from '../../../../components/FilterBar';
import { IPieChartItem, PieChart } from '../../../../components/PieChart';
import { formatBalance, formatChangePercentage } from '../../../../utils/general';
import { AssetAllocationBarTable } from './AssetAllocationBarTable';
import { ChartsOptions } from './ChartsOptions';
import { AaDisplayTypes, ITargetAssetAllocation, ITargetAssetClassRecord } from '../AssetAllocation';
import { ConfigContext } from '../../../../providers/ConfigProvider';
import { ChartsTitle } from '../../../../components/Charts/ChartsTitle';
import './AssetAllocationCharts.css';


interface IAssetAllocationCharts {
    aaDisplayType: AaDisplayTypes,
    setAaDisplayType: (value: AaDisplayTypes) => void,
    aaDisplayLevel: number,
    setAaDisplayLevel: (value: number) => void,
    filterBarValues: IFilterBarValues,
    totalValue: number | null,
    maxLevel: number | null,
    numAssetClasses: number,
    dbTargetAssetClassAllocations: ITargetAssetAllocation[] | null,
    tacRecords: ITargetAssetClassRecord[] | null,
}

export enum TargetAaDisplayReasons {
  okToDisplay = "okToDisplay",
  invalidFilter = "invalidFilter",
  noTargetsForPortfolio = "noTargetsForPortfolio",
  noTargetsForTag = "noTargetsForTag",
};

// Records with indexes greater than the number of colors are grouped under 'Other', using this index to highglight them on hover and handle click.
const otherAssetClassId = -1; 

export const AssetAllocationCharts: React.FC<IAssetAllocationCharts> = ({ aaDisplayType, aaDisplayLevel, setAaDisplayLevel, filterBarValues, totalValue, 
    maxLevel, numAssetClasses, setAaDisplayType, dbTargetAssetClassAllocations, tacRecords }) => {
    const [sortColumn, setSortColumn] = useState<string>("actPercent");
    const [sortDirection, setSortDirection] = useState<string>("desc");
    const [hoverAc, setHoverAc] = useState<number>(0); 
    const [hoverAcChart, setHoverAcChart] = useState<number>(0); 
    const config = useContext(ConfigContext);
    const chartColors = config?.chartColors!;

    // Set a boolean to easily determine if actuals should be displayed.
    const displayActuals = (aaDisplayType === AaDisplayTypes.actualsOnly || aaDisplayType === AaDisplayTypes.actualsVsTargets) ? true : false;

    // Figure out if targets should be displayed, and if not the reason.
    const displayTargetsReason = determineDisplayTargets(filterBarValues, dbTargetAssetClassAllocations ? dbTargetAssetClassAllocations : []);
    let displayTargets = (aaDisplayType === AaDisplayTypes.actualsVsTargets || aaDisplayType === AaDisplayTypes.targetsOnly) &&
      (displayTargetsReason === TargetAaDisplayReasons.okToDisplay);
    
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

    const handleAaDisplayTypeChange = (value: AaDisplayTypes) => {
      setAaDisplayType(value);
      setAaDisplayLevel(-1); // Don't know if new display will have sufficient levels to support current selection, so reset to max.
      switch(value) {
        case AaDisplayTypes.targetsOnly:
          setSortColumn('tgtPercent');
          setSortDirection('desc');
          break;
        default: // All other cases include actuals so sort on that.
          setSortColumn('actPercent');
          setSortDirection('desc');
          break;
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

    let actualsPieChartRecords: IPieChartItem[] | null = null;
    let targetsPieChartRecords: IPieChartItem[] | null = null;
    if(tacRecords !== null) {
      // Sort the records.
      let sortFunc = null;
      if(sortColumn.substring(0, 15) === 'assetClassLevel') {
        sortFunc = assetClassLevelSort;
      } else {
        sortFunc = sortFunctions[sortColumn][sortDirection];
      }
      tacRecords = tacRecords.sort(sortFunc);

      // Consolidate records if there are more records than colors available.
      consolidateRecords(tacRecords, chartColors.sequenceColors);

      // Reduce records into format for pie chart, one set for actuals (if included) and one for targets (if included).
      if(displayActuals) {
        actualsPieChartRecords = consolidateTacRecords(tacRecords, 'actuals');
      }
      if(displayTargets) {
        targetsPieChartRecords = consolidateTacRecords(tacRecords, 'targets');
      }
    } else {
      // If waiting on data make sure targets placeholder is displayed.
      displayTargets = true;
    }

    // Create label for source of targets.
    const tag = filterBarValues.tags.length > 0 ? filterBarValues.tags[0] : 0;
    const targetsSource = tag ? tag.label : 'Entire Portfolio';

    return (
        <div className='asset-allocation--chart-area'>
          <ChartsTitle titleBalance={totalValue} />
          <ChartsOptions
              currentLevel={aaDisplayLevel}
              maxLevel={maxLevel}
              setLevel={setAaDisplayLevel}
              aaDisplay={aaDisplayType}
              setAaDisplay={handleAaDisplayTypeChange}
              displayTargets={displayTargets}
              displayTargetsReason={displayTargetsReason}
              targetsSource={targetsSource}
          />
          <div className="asset-allocation--table">
            <AssetAllocationBarTable
                tacRecords={tacRecords}
                hoverAc={hoverAc}
                setHoverAc={(ac: number) => {
                  setHoverAcChart(1);
                  setHoverAc(ac);
                }}
                numLevels={(aaDisplayLevel === -1) ? (maxLevel ? (maxLevel+1) : 1) : (aaDisplayLevel+1)}
                maxRecords={numAssetClasses}
                aaDisplayActuals={displayActuals}
                aaDisplayTargets={displayTargets}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                setSortColumn={setSortColumn}
                setSortDirection={setSortDirection}
            />
          </div>
          <div className='asset-allocation--pie-charts'>
              { displayActuals ?
                <PieChart
                    pieChartItems={actualsPieChartRecords}
                    title='Actuals'
                    height='250px'
                    hoverOffset={35}
                    hoverLookupValue={hoverAc}
                    hoverLookupType={(hoverAcChart === 2 ? 'internal' : 'external')}
                    createTooltipLabel={createPieChartTooltipLabel}
                    handleOnHover={(ac: number) => {
                      setHoverAcChart(2);
                      handlePieChartHover(ac);
                    }}
                />
              : <div><br /></div>
              }
              { displayTargets ?
                <PieChart
                    pieChartItems={targetsPieChartRecords}
                    title='Targets'
                    height='250px'
                    hoverOffset={35}
                    hoverLookupValue={hoverAc}
                    hoverLookupType={(hoverAcChart === 3 ? 'internal' : 'external')}
                    createTooltipLabel={createPieChartTooltipLabel}
                    handleOnHover={(ac: number) => {
                      setHoverAcChart(3);
                      handlePieChartHover(ac);
                    }}
                />
              : <div><br /></div>
              }
          </div>
        </div>
    );
};

// Set to do not display if display type doesn't include targets.
// If targets are included, check if targets were found, if not determine why and set the reason, otherwise if found to to 'display'.
const determineDisplayTargets = (filterBarValues: IFilterBarValues, dbTargetAssetClassAllocations: ITargetAssetAllocation[]) => {
  let displayTargets: TargetAaDisplayReasons;

  if(filterBarValues.accounts.length > 0 || filterBarValues.accountTypes.length > 0 || filterBarValues.assetClasses.length > 0 || filterBarValues.assets.length > 0) {
    displayTargets = TargetAaDisplayReasons.invalidFilter;
  } else if(dbTargetAssetClassAllocations !== null && dbTargetAssetClassAllocations.length === 0) {
      const tagId = filterBarValues.tags.length > 0 ? filterBarValues.tags[0].value : 0;
      if(tagId !== 0) {
        displayTargets = TargetAaDisplayReasons.noTargetsForTag;
      } else {
        displayTargets = TargetAaDisplayReasons.noTargetsForPortfolio;
      }
  } else {
    displayTargets = TargetAaDisplayReasons.okToDisplay;
  }

  return displayTargets;
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
  'tgtValue': 
    {
      'asc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.targetValue || 0) >= (b.targetValue || 0) ? 1 : -1,
      'desc': (a: ITargetAssetClassRecord,b: ITargetAssetClassRecord) => 
        (a.targetValue || 0) <= (b.targetValue || 0) ? 1 : -1,
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