import { EventBranch, StatementType } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { ProviderType } from "types/Workflow";

interface EventBranchViewProps {
  branch: EventBranch;
}

const EventBranchView: FC<EventBranchViewProps> = ({ branch }) => {
  return (
    <div className="flex flex-col gap-3">
      {branch.conditions.map((condition, i) => (
        <React.Fragment key={i}>
          {condition.statements.map((statement, j) => (
            <React.Fragment key={`${j}${i}`}>
              <div className="bg-gray-100 p-3 rounded flex flex-col">
                <span className="pb-3 font-semibold">{condition.name}</span>
                <span>
                  “
                  {statement.type === StatementType.PROPERTY
                    ? statement.key
                    : statement.elementKey}
                  ” {statement.comparisonType} “{statement.value}”
                </span>
              </div>
              <div className="bg-gray-100 [&:first-letter]:uppercase rounded px-3 py-1 text-gray-600 border border-gray-200 self-start">
                {statement.relationToNext}
              </div>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default EventBranchView;
