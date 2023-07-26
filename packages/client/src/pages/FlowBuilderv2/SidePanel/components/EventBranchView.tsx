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
          <div className="bg-gray-100 p-3 rounded flex flex-col relative [&:not(:last-child)]:mb-11">
            {condition.providerType === ProviderType.TRACKER ? (
              <div className="flex flex-col gap-[10px] font-inter text-[14px] font-normal text-[#111827] leading-[22px]">
                {condition.trackerId && (
                  <div className="flex gap-[5px] items-center">
                    <div>Tracker:</div>
                    <div className="px-[5px] py-[2px] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                      {condition.trackerId}
                    </div>
                  </div>
                )}
                {condition.event && (
                  <div className="flex gap-[5px] items-center">
                    <div>Event</div>
                    <div className="px-[5px] py-[2px] border-[1px] border-[#E5E7EB] rounded-[2px] bg-white">
                      {condition.event}
                    </div>
                    <div>is performed</div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <span className="pb-3 font-semibold">{condition.name}</span>
                {condition.statements.map((statement, j) => (
                  <React.Fragment key={`${j}${i}`}>
                    <span>
                      “
                      {statement.type === StatementType.PROPERTY
                        ? statement.key
                        : statement.elementKey}
                      ” {statement.comparisonType} “{statement.value}”{" "}
                      {condition.statements.length !== j + 1 &&
                        statement.relationToNext}
                    </span>
                    {condition.statements.length === j + 1 &&
                      branch.conditions.length !== i + 1 && (
                        <div className="bg-gray-100 [&:first-letter]:uppercase rounded px-3 py-1 text-gray-600 border border-gray-200 self-start absolute -bottom-11 left-0">
                          {statement.relationToNext}
                        </div>
                      )}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default EventBranchView;
