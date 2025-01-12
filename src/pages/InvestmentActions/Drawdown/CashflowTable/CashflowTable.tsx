import { CashflowCategories, getCashflowTimeperiodKey, ICashflowAccountGroup, ICashflowMetrics, ICashflowTimeperiodGroup, IHandleCashflowActionButtonClick } from '..';
import { Fragment } from 'react';
import { BasicTable } from '../../../../components/BasicTable';
import { BasicTableBody } from '../../../../components/BasicTable/BasicTableBody';
import { BasicTableColHeadings } from '../../../../components/BasicTable/BasicTableColHeadings';
import { BasicTableRow } from '../../../../components/BasicTable/BasicTableRow';
import { createDay, createDayFromDate, getMonthEnd, getMonthName } from '../../../../utils/dates';
import { formatBalance } from '../../../../utils/general';
import { BasicTableHeading } from '../../../../components/BasicTable/BasicTableHeading';
import { roundNumber } from '../../../../utils/calcs';
import { MoneyInput } from '../../../../components/Inputs/MoneyInput';
import './CashflowTable.css';


interface ICashflowTable {
  cashflowTimeperiodGroups: { [index: string]: ICashflowTimeperiodGroup },
  totals: ICashflowMetrics | null,
  handleCashflowActionButtonClick: (params: IHandleCashflowActionButtonClick) => void,
  handleReserveAmountChange: (accountId: number, month: number, year: number, value: number, handleValueSubmitResult: (result: string) => void) => void,
  handleDeleteReserveAmount: (accountId: number, month: number, year: number, handleValueDeleteResult: (result: string) => void) => void,
}

export const CashflowTable: React.FC<ICashflowTable> = ({ cashflowTimeperiodGroups, totals, handleCashflowActionButtonClick, 
  handleReserveAmountChange, handleDeleteReserveAmount }) => {

  if(totals === null) {
    return (
      <div className="cashflow-table">
        <div className="placeholder placeholder-heading1"><br /></div>
        <div className="placeholder placeholder-heading2"><br /></div>
        <div className="placeholder placeholder--indented"><br /><br /><br /><br /><br /><br /><br /><br /><br /></div>
        <div className="placeholder placeholder-heading2"><br /></div>
        <div className="placeholder placeholder--indented"><br /><br /><br /><br /><br /><br /><br /><br /><br /></div>
        <div className="placeholder placeholder-heading2"><br /></div>
        <div className="placeholder placeholder--indented"><br /><br /><br /><br /><br /><br /><br /><br /><br /></div>
      </div>
    )
  }

  const sortedCashflowTimeperiodGroups = Object.values(cashflowTimeperiodGroups).sort((a: ICashflowTimeperiodGroup, b: ICashflowTimeperiodGroup) => {
    if(a.month < b.month) return -1; else if(a.month > b.month) return 1; else return 0;
  })

  const headingSet = [
    { name: "Label", sortColumn: "month" }, 
    { name: "Starting Cash Balance", allowWrap: true }, 
    { name: "Withdrawals/ Drawndown" },
    { name: "Deposits" },
    { name: "Purchases/Fees" }, 
    { name: "Net Transfers" },
    { name: "Proceeds", groupHeading: { label: 'Generated Cash', colspan: 4 } },
    { name: "Interest", groupHeading: { label: 'Generated Cash' } },
    { name: "Dividends", groupHeading: { label: 'Generated Cash' } },
    { name: "Distributions", groupHeading: { label: 'Generated Cash' } },
    { name: "Ending Cash Balance", allowWrap: true },
    { name: "Reserve", allowWrap: true },
    { name: "Available to Drawdown", allowWrap: true },
  ];

  return (
    <div className="cashflow-table">
      <BasicTable areRowsClickable={false} highlightRowsOnHover={true}>            
        <BasicTableColHeadings
          headingSet={headingSet}
          freezeHeadings={true}
        />
          <Fragment>
          <BasicTableHeading highlight={true}>
            <BasicTableRow>
              <th><span>TOTAL</span></th>
              <th><span>{formatBalance(totals.startingCashBalance)}</span></th>
              { (CashflowCategories.withdrawals in totals.activity) ?
                  ((roundNumber(totals.activity[CashflowCategories.withdrawals], 2) === roundNumber(totals.drawndown, 2)) ?
                    <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.withdrawals])}</span></th> :
                    <th><div className="two-line">
                      <span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.withdrawals])}</span>
                      <small className='nowrap'>{formatBalance(totals.drawndown)}</small>
                    </div></th>
                  ) :
                    <th><br></br></th>
              }
              { (CashflowCategories.deposits in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.deposits])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.purchasesAndFees in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.purchasesAndFees])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.transfers in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.transfers])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.sales in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.sales])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.interest in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.interest])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.dividends in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.dividends])}</span></th> :
                  <th><br></br></th>
              }
              { (CashflowCategories.distributions in totals.activity) ?
                  <th><span className='nowrap'>{formatBalance(totals.activity[CashflowCategories.distributions])}</span></th> :
                  <th><br></br></th>
              }
              <th><span className='nowrap'>{formatBalance(totals.endingCashBalance)}</span></th>
              <th><span className='nowrap'>{formatBalance(totals.reserve)}</span></th>
              <th><span className='nowrap'>{formatBalance(totals.availableToDrawdown)}</span></th>
            </BasicTableRow>
          </BasicTableHeading>
          {
            sortedCashflowTimeperiodGroups.map((ctg) => {
              const cags = Object.values(ctg.cashflowAccountGroups);
              if(cags.length <= 0)
                return <Fragment></Fragment>;

              const timeperiodKey = getCashflowTimeperiodKey(ctg);

              const sortedCags = cags.sort((a: ICashflowAccountGroup, b: ICashflowAccountGroup) => {
                if(a.accountName < b.accountName) return -1; else if(a.accountName > b.accountName) return 1; else return 0;
              });

              return (
                <Fragment key={timeperiodKey}>
                  <BasicTableHeading>
                  <BasicTableRow>
                    <th><span>{getMonthName(ctg.month-1)}</span></th>
                    <th className="cashflow-table--balance"><span className='nowrap'>{formatBalance(ctg.startingCashBalance)}</span></th>
                    { (CashflowCategories.withdrawals in ctg.activity) ?
                        ((roundNumber(ctg.activity[CashflowCategories.withdrawals], 2) === roundNumber(ctg.drawndown, 2)) ?
                          <th className="basic-table--clickable-cells cashflow-table--drawdown" onClick={() => 
                            handleCashflowActionButtonClick({
                              startDate: createDay(ctg.year, ctg.month, 1),
                              endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                              accountId: undefined,
                              accountName: undefined,
                              cashflowCategory: CashflowCategories.withdrawals,
                            })
                          }>
                            <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.withdrawals])}</span>
                          </th> 
                          :
                          <th className="basic-table--clickable-cells cashflow-table--drawdown" onClick={() => 
                            handleCashflowActionButtonClick({
                              startDate: createDay(ctg.year, ctg.month, 1),
                              endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                              accountId: undefined,
                              accountName: undefined,
                              cashflowCategory: CashflowCategories.withdrawals,
                            })
                          }>
                            <div className="two-line">
                              <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.withdrawals])}</span>
                              <small className='nowrap'>{formatBalance(ctg.drawndown)}</small>
                            </div>
                          </th>
                      ) :
                        <th className="cashflow-table--drawdown"><br></br></th>
                      }
                    { (CashflowCategories.deposits in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.deposits,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.deposits])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.purchasesAndFees in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.purchasesAndFees,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.purchasesAndFees])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.transfers in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.transfers,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.transfers])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.sales in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.sales,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.sales])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.interest in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.interest,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.interest])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.dividends in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.dividends,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.dividends])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    { (CashflowCategories.distributions in ctg.activity) ?
                        <th className="basic-table--clickable-cells" onClick={() => 
                          handleCashflowActionButtonClick({
                            startDate: createDay(ctg.year, ctg.month, 1),
                            endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                            accountId: undefined,
                            accountName: undefined,
                            cashflowCategory: CashflowCategories.distributions,
                          })
                        }>
                          <span className='nowrap'>{formatBalance(ctg.activity[CashflowCategories.distributions])}</span>
                        </th> :
                        <th><br></br></th>
                    }
                    <th className="cashflow-table--balance"><span className='nowrap'>{formatBalance(ctg.endingCashBalance)}</span></th>
                    <th className="basic-table--clickable-cells">
                      <span className='nowrap'>{formatBalance(ctg.reserve)}</span>
                    </th>
                    <th className="cashflow-table--balance"><span className='nowrap'>{formatBalance(ctg.availableToDrawdown)}</span></th>
                  </BasicTableRow>
                  </BasicTableHeading>
                  <BasicTableBody>
                  { 
                    sortedCags.map((cag) => (
                      <BasicTableRow key={timeperiodKey + cag.accountId}>
                        <td><span>{cag.accountName}</span></td>
                        <td className="cashflow-table--balance"><span className='nowrap'>{formatBalance(cag.startingCashBalance)}</span></td>
                        { (CashflowCategories.withdrawals in cag.activity) ?
                            ((roundNumber(cag.activity[CashflowCategories.withdrawals], 2) === roundNumber(cag.drawndown, 2)) ?
                              <td className="basic-table--clickable-cells cashflow-table--drawdown" onClick={() => 
                                handleCashflowActionButtonClick({
                                  startDate: createDay(ctg.year, ctg.month, 1),
                                  endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                  accountId: cag.accountId,
                                  accountName: cag.accountName,
                                  cashflowCategory: CashflowCategories.withdrawals,
                                })
                              }>
                                <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.withdrawals])}</span>
                              </td>
                              :
                              <td className="basic-table--clickable-cells cashflow-table--drawdown" onClick={() => 
                                handleCashflowActionButtonClick({
                                  startDate: createDay(ctg.year, ctg.month, 1),
                                  endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                  accountId: cag.accountId,
                                  accountName: cag.accountName,
                                  cashflowCategory: CashflowCategories.withdrawals,
                                })
                              }>
                                <div className="two-line">
                                  <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.withdrawals])}</span>
                                  <small className='nowrap'>{formatBalance(cag.drawndown)}</small>
                                </div>
                              </td>
                            ) :
                              <td className="cashflow-table--drawdown"><br></br></td>
                          }
                        { (CashflowCategories.deposits in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.deposits,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.deposits])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.purchasesAndFees in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.purchasesAndFees,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.purchasesAndFees])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.transfers in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.transfers,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.transfers])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.sales in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.sales,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.sales])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.interest in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.interest,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.interest])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.dividends in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.dividends,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.dividends])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        { (CashflowCategories.distributions in cag.activity) ?
                            <td className="basic-table--clickable-cells" onClick={() => 
                              handleCashflowActionButtonClick({
                                startDate: createDay(ctg.year, ctg.month, 1),
                                endDate: createDayFromDate(getMonthEnd(new Date(ctg.year, ctg.month-1, 1))),
                                accountId: cag.accountId,
                                accountName: cag.accountName,
                                cashflowCategory: CashflowCategories.distributions,
                              })
                            }>
                              <span className='nowrap'>{formatBalance(cag.activity[CashflowCategories.distributions])}</span>
                            </td> :
                            <td><br></br></td>
                        }
                        <td className="cashflow-table--balance"><span className='nowrap'>{formatBalance(cag.endingCashBalance)}</span></td>
                        <td className="basic-table--clickable-cells">
                          <MoneyInput
                            onValueSubmit={(value: number, handleValueSubmitResult: (result: string) => void) => 
                              handleReserveAmountChange(cag.accountId, ctg.month, ctg.year, value, handleValueSubmitResult)}
                            initialValue={cag.reserve ? cag.reserve.toString() : ""}
                            onDeleteValue={cag.isReserveActual ?
                              (handleValueDeleteResult: (result: string) => void) => handleDeleteReserveAmount(cag.accountId, ctg.month, ctg.year, handleValueDeleteResult)
                              : undefined}
                          />
                        </td>
                        <td className="cashflow-table--balance"><span className='nowrap'>{formatBalance(cag.availableToDrawdown)}</span></td>
                      </BasicTableRow>
                    ))
                  }
                </BasicTableBody>
                </Fragment>
              )
            })
          }
          </Fragment>
      </BasicTable>
    </div>
  );
};