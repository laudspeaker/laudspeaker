import {
  EventBranch,
  LogicRelation,
  StatementType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { ProviderType } from "types/Workflow";

interface EventBranchViewProps {
  branch: EventBranch;
}

const EventBranchView: FC<EventBranchViewProps> = ({ branch }) => {
  return (
    <div className="flex flex-col gap-[10px]">
      {branch.conditions.map((condition, i) => (
        <React.Fragment key={i}>
          <div className="bg-gray-100 p-3 rounded flex flex-col relative">
            {condition.providerType === ProviderType.TRACKER ? (
              <div className="flex flex-col gap-[10px] font-inter text-[14px] font-normal text-[#111827] leading-[22px]">
                {condition.trackerId && (
                  <div className="flex gap-[5px] items-center">
                    <div>Tracker:</div>
                    <div className="px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white">
                      {condition.trackerId}
                    </div>
                  </div>
                )}
                {condition.event && (
                  <div className="flex gap-[5px] items-center">
                    <div>Event</div>
                    <div className="px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white">
                      {condition.event}
                    </div>
                    <div>is performed</div>
                  </div>
                )}
              </div>
            ) : condition.providerType === ProviderType.CUSTOM ||
              condition.providerType === ProviderType.POSTHOG ? (
              <>
                <span className="pb-3 font-semibold">{condition.name}</span>
                {condition.statements.map((statement, j) => (
                  <React.Fragment key={`${j}${i}`}>
                    <span>
                      “
                      {statement.type === StatementType.PROPERTY
                        ? statement.key
                        : statement.type === StatementType.ELEMENT
                        ? statement.elementKey
                        : ""}
                      ”{" "}
                      {statement.type === StatementType.PROPERTY ||
                      statement.type === StatementType.ELEMENT
                        ? statement.comparisonType
                        : ""}{" "}
                      “
                      {statement.type === StatementType.PROPERTY ||
                      statement.type === StatementType.ELEMENT
                        ? statement.value
                        : ""}
                      ”{" "}
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
            ) : (
              <></>
            )}
          </div>
          {i !== branch.conditions.length - 1 && (
            <div className="w-fit px-[12px] py-[5px] rounded-sm border border-[#E5E7EB] bg-[#F3F4F6]">
              {condition.relationToNext === LogicRelation.AND ? "And" : "Or"}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default EventBranchView;
