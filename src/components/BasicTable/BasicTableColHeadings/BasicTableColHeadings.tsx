import { Fragment } from 'react';
import './BasicTableColHeadings.css';
import { BasicTableColHeading } from './BasicTableHeading';


export interface IBasicTableColHeadingsSet {
  name: string,
  subName?: string,
  sortColumn?: string,
  justify?: string,
  infoButtonContent?: JSX.Element,
  allowWrap?: boolean,
  groupHeading?: { label: string, colspan?: number }, // Only specify colspan on first column with the label.
}
interface IBasicTableColHeadings {
  headingSet: IBasicTableColHeadingsSet[],
  sortColumn?: string,
  sortDirection?: string,
  setSortColumn?:(value: string) => void,
  setSortDirection?:(value: string) => void,
  freezeHeadings?: boolean,
}

export const BasicTableColHeadings: React.FC<IBasicTableColHeadings> = ({ headingSet, sortColumn, sortDirection, setSortColumn, setSortDirection, freezeHeadings }) => {
  let hasGroupHeadings = false;
  let index = 0;
  while(!hasGroupHeadings && index < headingSet.length) {
    if('groupHeading' in headingSet[index]) {
      hasGroupHeadings = true;
    }
    index++;
  }

  let groupHeadingClassRow1 = "basic-table--col-headings-group-heading-odd";
  let groupHeadingClassRow2 = "basic-table--col-headings-group-heading-child-odd";

  return (
    <thead className={"basic-table--col-headings" + (freezeHeadings ? " freeze-headings" : "")}>
      <tr className={freezeHeadings ? " freeze-headings" : ""}>
        { headingSet &&
            headingSet.map(heading => {
              const hasGroupHeading = ('groupHeading' in heading);
              const renderGroupHeading = hasGroupHeading && ('colspan' in heading.groupHeading!);

              if(renderGroupHeading) {
                if(groupHeadingClassRow1 === "basic-table--col-headings-group-heading-odd") {
                  groupHeadingClassRow1 = "basic-table--col-headings-group-heading-even";
                } else {
                  groupHeadingClassRow1 = "basic-table--col-headings-group-heading-odd";
                }
              }

              return (
                <Fragment key={"row1-" + heading.name}>
                  {
                    renderGroupHeading &&
                      <th className={"basic-table--col-headings-group-heading " + groupHeadingClassRow1} colSpan={heading.groupHeading?.colspan}>
                        {heading.groupHeading?.label}
                      </th>
                  }
                  {
                    !hasGroupHeading &&
                      <BasicTableColHeading
                        heading={heading}
                        rowspan={2}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        setSortColumn={setSortColumn}
                        setSortDirection={setSortDirection}
                      />
                  }
                </Fragment>
              )
            })
        }
      </tr>
      {
        (headingSet && hasGroupHeadings) &&
          <tr className={freezeHeadings ? " freeze-headings" : ""}>
            { headingSet.map(heading => {
                const hasGroupHeading = ('groupHeading' in heading);
                const renderGroupHeading = hasGroupHeading && ('colspan' in heading.groupHeading!);

                if(renderGroupHeading) {
                  if(groupHeadingClassRow2 === "basic-table--col-headings-group-heading-child-odd") {
                    groupHeadingClassRow2 = "basic-table--col-headings-group-heading-child-even";
                  } else {
                    groupHeadingClassRow2 = "basic-table--col-headings-group-heading-child-odd";
                  }
                }

                return (
                  <Fragment key={"row2-" + heading.name}>
                    {
                      hasGroupHeading &&
                        <BasicTableColHeading
                          heading={heading}
                          rowspan={1}
                          groupHeadingClass={hasGroupHeading ? groupHeadingClassRow2 : undefined}
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          setSortColumn={setSortColumn}
                          setSortDirection={setSortDirection}
                        />
                    }
                  </Fragment>
                )
              })
            }
          </tr>
      }
    </thead>
  );
};
