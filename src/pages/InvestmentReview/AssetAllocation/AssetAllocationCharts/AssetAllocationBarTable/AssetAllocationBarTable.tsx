import { Fragment } from 'react';
import { formatBalance, formatChangePercentage, hexToRgb } from '../../../../../utils/general';
import { ITargetAssetClassRecord } from '../../AssetAllocation';
import { AssetAllocationBarTablePlaceholder } from './AssetAllocationBarTablePlaceholder';
import { AssetAllocationBarTableHeadings } from './AssetAllocationBarTableHeadings';
import { IBasicTableColHeadingsSet } from '../../../../../components/BasicTable/BasicTableColHeadings';
import './AssetAllocationBarTable.css';


interface IAssetAllocationBarTable {
    tacRecords: ITargetAssetClassRecord[] | null,
    hoverAc: number,
    setHoverAc: (value: number) => void,
    numLevels: number, // How many asset class levels to display.
    maxRecords: number, // Maximum number of asset classes to display, which equals number of asset classes is deepest level of tree.
    aaDisplayActuals: boolean, // At least one of aaDisplayActuals and aaDisplayTargets must be true.
    aaDisplayTargets: boolean,
    sortColumn: string,
    sortDirection: string,
    setSortColumn:(value: string) => void,
    setSortDirection:(value: string) => void,
  }

export const AssetAllocationBarTable: React.FC<IAssetAllocationBarTable> = ({ tacRecords, hoverAc, setHoverAc, numLevels, maxRecords, aaDisplayActuals, aaDisplayTargets,
    sortColumn, sortDirection, setSortColumn, setSortDirection }) => {

    if(tacRecords === null) {
        return <AssetAllocationBarTablePlaceholder />
    }

    // Create explicit grid template columns to account for varaible number of asset class levels. 
    // First is color block, then variable number of asset class levels, then the various metrics.
    let gridColumnsString = '1em ';
    const headingSet: IBasicTableColHeadingsSet[] = [ { sortColumn: '', name: '', justify: '' } ];

    for(let i=1; i <= numLevels; i++) {
        // 'assetClassLevel' substring is used to determine column sort is based on an asset class level, the level number is used to determine the level to sort.
        headingSet.push({ sortColumn: 'assetClassLevel-' + i, name: 'Level ' + i, justify: 'left' });
        if(i === numLevels) {
            gridColumnsString += ' minmax(4em, auto)'; // Use auto on last asset class level to have it take up all white space.
        } else {
            gridColumnsString += ' minmax(4em, max-content)'; // Use max-content on all but last asset class level to have it only use space needed so names or close together.
        }
    }

    // Push remaining columns for the various metrics.
    if(aaDisplayActuals && aaDisplayTargets) {
        headingSet.push(...[
            { sortColumn: 'actValue', name: 'Act Value', justify: 'right', },
            { sortColumn: 'actPercent', name: 'Act %', justify: 'right', },
            { sortColumn: 'tgtPercent', name: 'Tgt %', justify: 'right', },
            { sortColumn: 'delta', name: 'Delta', justify: 'right', infoButtonContent: deltaInfo },
        ]);
        gridColumnsString += ' max-content max-content max-content max-content';
    } else if(aaDisplayActuals) {
        headingSet.push(...[
            { sortColumn: 'actValue', name: 'Act Value', justify: 'right', },
            { sortColumn: 'actPercent', name: 'Act %', justify: 'right', },
        ]);
        gridColumnsString += ' max-content max-content';
    } else { // targets only
        headingSet.push(...[
            { sortColumn: 'tgtValue', name: 'Tgt Value', justify: 'right', },
            { sortColumn: 'tgtPercent', name: 'Tgt %', justify: 'right', },
        ]);
        gridColumnsString += ' max-content max-content';
    }

    // Create explicit grid-template-rows to allow for animation of the change in number of rows.
    let gridRowsString = '2.5em';
    for(let i=1; i <= tacRecords.length; i++) gridRowsString += ' 1.75em';
    for(let i=1; i <= (maxRecords - tacRecords.length); i++) gridRowsString += ' 0em';

    const tableStyle = { gridTemplateRows: gridRowsString, gridTemplateColumns: gridColumnsString };

    return (
        <div className='asset-class-allocation-bar-table'
            style={tableStyle}
        >
            <AssetAllocationBarTableHeadings
                headingSet={headingSet}
                sortColumn= {sortColumn}
                sortDirection= {sortDirection}
                setSortColumn={setSortColumn}
                setSortDirection={setSortDirection}
                freezeHeadings={false}
            />
            {
                tacRecords.map((rec) => { 
                    const isHoverAc = rec.consolidatedAssetClassId === hoverAc;
                    let barColor = rec.color;
                    let levelColor = hexToRgb(rec.color, 0.25);

                    let percentageChange = 0; let percentageChangeStyle = {};
                    if(aaDisplayActuals && aaDisplayTargets) {
                        percentageChange = rec.targetPercentage ? ((rec.actualPercentage - rec.targetPercentage) / rec.targetPercentage) : 
                        (rec.actualPercentage > 0 ? 1 : 
                            (rec.actualPercentage < 0 ? -1 : 0)
                        );
                        percentageChangeStyle = {
                            color: getChangeColor(percentageChange),
                        };
                    }

                    // Create list of asset class level names to display (use blank where doesn't exist).
                    const assetClassLevelNames = new Array(numLevels);
                    const fullAssetClassNameArray = rec.assetClassFullName.split(":");
                    for(let i=0; i < numLevels; i++) {
                        if(fullAssetClassNameArray.length >= (i+1)) {
                            assetClassLevelNames[i] = (fullAssetClassNameArray[i]);
                        } else {
                            assetClassLevelNames[i] = ("");
                        }
                    }

                    if(('targetValue' in rec && rec.targetValue === 0) && ('actualValue' in rec && rec.actualValue === 0)) {
                        return "";
                    }
                    
                    return(
                        <div 
                            key={rec.assetClassId} className='asset-class-allocation-bar-table--row button-el' 
                            onMouseEnter={() => setHoverAc(rec.consolidatedAssetClassId)}
                            onMouseLeave={() => setHoverAc(0)}
                        >
                            <div style={{ backgroundColor: barColor }} />
                            { assetClassLevelNames.map((level, index) => (
                                <div key={"level" + index} className={'asset-class-allocation-bar-table--content nowrap' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}
                                    style={ level.length > 0 ? { backgroundColor: levelColor, marginRight: '.25em' } : { marginRight: '.25em' } }
                                >
                                    {level}
                                </div>
                            ))}
                            { aaDisplayActuals &&
                                <Fragment>
                                    <div className={'asset-class-allocation-bar-table--content right-justify' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}>
                                        { formatBalance((rec.actualValue)) }
                                    </div>
                                    <div className={'asset-class-allocation-bar-table--content right-justify' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}>
                                        { formatChangePercentage((rec.actualPercentage)) }
                                    </div>
                                </Fragment>
                            }
                            { (aaDisplayTargets && !aaDisplayActuals) &&
                                <div className={'asset-class-allocation-bar-table--content right-justify' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}>
                                    { formatBalance((rec.targetValue)) }
                                </div>
                            }
                            { aaDisplayTargets &&
                                <div className={'asset-class-allocation-bar-table--content right-justify' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}>
                                    { formatChangePercentage((rec.targetPercentage)) }
                                </div>
                            }
                            { (aaDisplayActuals && aaDisplayTargets) &&
                                <div 
                                    className={'asset-class-allocation-bar-table--content right-justify' + (isHoverAc ? ' asset-class-allocation-bar-table--hover' : '')}
                                    style={percentageChangeStyle}
                                >
                                    { formatChangePercentage(percentageChange) }
                                </div>
                            }
                        </div>
                    ) 
                })
            }
        </div>
    );
};

const severityRanges: { [index: number]: string } = {
    10: '#38812F',
    25: '#f21e0d',
    100: '#A30000',
};
const getChangeColor = (value: number): string => {
    const absValue = Math.abs(value)*100;

    let index = 0;
    let color = null;
    const severityRangesKeys = Object.keys(severityRanges);
    while((index < severityRangesKeys.length) && !color) {
        const maxValueNumber = ((severityRangesKeys[index] as unknown) as number);
        if(absValue <= maxValueNumber) {
            color = severityRanges[maxValueNumber];
        } else {
            index++;
        }
    }

    if(!color) {
        const values = Object.values(severityRanges);
        color = values[values.length-1];
    }

    return(color);
}

const deltaInfo = 
<div className="info-button--info">
  <h2>Delta</h2>
  <div>The "Delta" shows the percentage difference between your actual and target allocations for each asset class.</div>
  <div>For example, if your actual allocation is 3% and your target is 2%, the Delta would be 50%.</div>
  <div><br /></div>
  <div>The color coding helps you see how close your actual allocation is to the target:</div>
  <ul>
    <li className="info-button--info-indent"><strong>Green: </strong>If the difference (Delta) is within 10% of the target, it shows as green.</li>
    <li className="info-button--info-indent"><strong>Red: </strong>If the Delta is more than 10%, it appears red, with darker shades indicating a bigger difference.</li>
  </ul>
</div>;

