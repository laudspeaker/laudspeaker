import React, { FC } from "react";

interface AttributeBranchViewProps {
  branch: any;
}

const AttributeBranchView: FC<AttributeBranchViewProps> = ({ branch }) => {
  return (
    <div className="flex flex-col gap-3">
      {branch.attributeConditions.map((condition: any, i: any) => (
        <React.Fragment key={i}>
          <div className="p-3 flex flex-col bg-gray-100 rounded">
            <div className="flex justify-between items-center">
              <div className="font-inter font-semibold text-[14px] leading-[22px]">
                Attribute {i + 1}
              </div>
            </div>
            {condition.statements.map((statement: any, k: any) => (
              <div
                className="font-inter font-normal text-[14px] leading-[22px]"
                key={k}
              >
                “{statement.key}” {statement.comparisonType} “
                {String(statement.value)}”{" "}
                {condition.statements.length !== k + 1 &&
                  statement.relationToNext}
              </div>
            ))}
          </div>
          {branch.attributeConditions.length !== i + 1 && (
            <span className="bg-gray-100 text-gray-600 [&:first-letter]:uppercase rounded border border-gray-200 px-3 py-1 self-start">
              {condition.relationToNext}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default AttributeBranchView;
