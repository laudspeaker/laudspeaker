import React, { FC, Fragment, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";
import { selectNode } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { NodeType } from "../FlowEditor";
import {
  Branch,
  BranchType,
  ElementKey,
  LogicRelation,
  StatementType,
  TimeType,
} from "../Nodes/NodeData";
import { BranchEdgeData } from "./EdgeData";
import { ProviderType } from "types/Workflow";
import { Transition } from "@headlessui/react";

const popperNameMap: Record<BranchType, string> = {
  [BranchType.EVENT]: "Wait people until",
  [BranchType.MAX_TIME]: "If wait until",
  [BranchType.ATTRIBUTE]: "If attribute",
};

export const BranchEdge: FC<EdgeProps<BranchEdgeData>> = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
  data,
  source,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const [isPopperShowing, setIsPopperShowing] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceNode = nodes.find((node) => node.id === source);

  if (
    !sourceNode ||
    !(
      sourceNode.type === NodeType.WAIT_UNTIL ||
      sourceNode.type === NodeType.USER_ATTRIBUTE
    ) ||
    !(
      sourceNode.data.type === NodeType.WAIT_UNTIL ||
      sourceNode.data.type === NodeType.USER_ATTRIBUTE
    ) ||
    !data?.branch
  )
    return <></>;

  const { branch } = data;

  const branchIndex = (sourceNode.data.branches as Branch[]).findIndex(
    (b) => b.id === branch.id
  );

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {sourceNode.data.branches.length > 1 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(${targetX - 100}px,${labelY + 20}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-[9999999999]"
            onClick={() => dispatch(selectNode(sourceNode.id))}
            onMouseEnter={() => setIsPopperShowing(true)}
            onMouseLeave={() => setIsPopperShowing(false)}
          >
            <span className="bg-[#F3F4F6] flex gap-[5px] items-center py-[8px] px-[4px] leading-[22px] text-[14px] text-[#111827] border-b-[1px] border-b-black">
              {branch.type === BranchType.MAX_TIME && (
                <span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2.1875C4.79063 2.1875 2.1875 4.79063 2.1875 8C2.1875 11.2094 4.79063 13.8125 8 13.8125C11.2094 13.8125 13.8125 11.2094 13.8125 8C13.8125 4.79063 11.2094 2.1875 8 2.1875ZM10.7578 10.1516L10.3109 10.7609C10.3012 10.7742 10.289 10.7854 10.2749 10.7939C10.2608 10.8025 10.2452 10.8081 10.229 10.8106C10.2127 10.8131 10.1961 10.8123 10.1801 10.8083C10.1642 10.8044 10.1492 10.7973 10.1359 10.7875L7.55156 8.90312C7.53546 8.89156 7.52238 8.8763 7.5134 8.85863C7.50443 8.84095 7.49983 8.82138 7.5 8.80156V4.5C7.5 4.43125 7.55625 4.375 7.625 4.375H8.37656C8.44531 4.375 8.50156 4.43125 8.50156 4.5V8.36719L10.7297 9.97812C10.7859 10.0172 10.7984 10.0953 10.7578 10.1516Z"
                      fill="#F3F4F6"
                    />
                    <path
                      d="M8 1C4.13437 1 1 4.13437 1 8C1 11.8656 4.13437 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13437 11.8656 1 8 1ZM8 13.8125C4.79063 13.8125 2.1875 11.2094 2.1875 8C2.1875 4.79063 4.79063 2.1875 8 2.1875C11.2094 2.1875 13.8125 4.79063 13.8125 8C13.8125 11.2094 11.2094 13.8125 8 13.8125Z"
                      fill="#111827"
                    />
                    <path
                      d="M10.7297 9.97811L8.50156 8.36718V4.5C8.50156 4.43125 8.44531 4.375 8.37656 4.375H7.625C7.55625 4.375 7.5 4.43125 7.5 4.5V8.80155C7.5 8.84218 7.51875 8.87968 7.55156 8.90312L10.1359 10.7875C10.1922 10.8281 10.2703 10.8172 10.3109 10.7609L10.7578 10.1516C10.7984 10.0953 10.7859 10.0172 10.7297 9.97811Z"
                      fill="#111827"
                    />
                  </svg>
                </span>
              )}

              <span className="font-semibold">
                <span>Branch {branchIndex + 1}: </span>
              </span>
              {branch.type === BranchType.EVENT ? (
                branch.conditions.length === 0 ? (
                  <span className="text-[#E11D48]">Has no conditions</span>
                ) : (
                  `Meet ${branch.conditions.length} conditions`
                )
              ) : branch.type === BranchType.ATTRIBUTE ? (
                branch.attributeConditions.length === 0 ? (
                  <span className="text-[#E11D48]">Has no conditions</span>
                ) : (
                  `Meet ${branch.attributeConditions.length} conditions`
                )
              ) : (
                <>Wait max time</>
              )}
            </span>

            <Transition
              as={Fragment}
              show={isPopperShowing}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <div className="absolute w-[260px] px-[10px] py-[12px] bg-white z-[999999999] rounded-[4px] flex flex-col gap-[10px]">
                <div className="font-inter font-semibold text-[16px] leading-[24px]">
                  {popperNameMap[branch.type]}
                </div>
                {branch.type === BranchType.EVENT ? (
                  <>
                    {branch.conditions.slice(0, 3).map((condition, i) => (
                      <React.Fragment key={i}>
                        <div className="p-[10px] bg-[#F3F4F6] flex flex-col gap-[5px]">
                          <div className="font-inter font-semibold text-[14px] leading-[22px] text-[#18181B]">
                            {condition.providerType === ProviderType.Custom
                              ? "Custom Event"
                              : "Posthog Event"}
                          </div>
                          {condition.statements.map((statement, j) => (
                            <div
                              key={j}
                              className="font-inter font-normal text-[12px] leading-[20px] text-[#18181B]"
                            >
                              {statement.type === StatementType.PROPERTY ? (
                                <div>
                                  Property "{statement.key}"{" "}
                                  {statement.comparisonType} "{statement.value}"
                                </div>
                              ) : (
                                <div>
                                  Element{" "}
                                  <span className="font-bold">
                                    #{statement.order}
                                  </span>{" "}
                                  "
                                  {statement.elementKey === ElementKey.TAG_NAME
                                    ? "Tag name"
                                    : "Text"}
                                  " {statement.comparisonType} "
                                  {statement.value}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {i !== branch.conditions.length - 1 && i !== 2 && (
                          <div>Or</div>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                ) : branch.type === BranchType.ATTRIBUTE ? (
                  <>
                    {branch.attributeConditions
                      .slice(0, 3)
                      .map((condition, i) => (
                        <React.Fragment key={i}>
                          <div className="p-[10px] bg-[#F3F4F6] flex flex-col gap-[5px]">
                            {condition.statements.map((statement, j) => (
                              <div
                                key={j}
                                className="font-inter font-normal text-[12px] leading-[20px] text-[#18181B]"
                              >
                                {statement.key} {statement.comparisonType}{" "}
                                {statement.value}
                              </div>
                            ))}
                          </div>
                          {i !== branch.attributeConditions.length - 1 &&
                            i !== 2 && (
                              <div className="font-inter font-normal text-[14px] leading-[22px]">
                                {condition.relationToNext === LogicRelation.AND
                                  ? "And"
                                  : "Or"}
                              </div>
                            )}
                        </React.Fragment>
                      ))}
                  </>
                ) : branch.timeType === TimeType.TIME_DELAY ? (
                  <div className="px-[8px] py-[10px] rounded-[4px] bg-[#F3F4F6] font-inter font-normal text-[14px] leading-[22px] text-[#18181B]">
                    {branch.delay.days} days {branch.delay.hours} hours{" "}
                    {branch.delay.minutes} min
                  </div>
                ) : (
                  <div className="flex gap-[10px] px-[8px] py-[10px] rounded-[4px] bg-[#F3F4F6] font-inter font-normal text-[14px] leading-[22px] text-[#18181B]">
                    <div>
                      <div>From</div>
                      <div>To</div>
                    </div>
                    <div>
                      <div>
                        {new Intl.DateTimeFormat("en-GB", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(branch.waitFrom))}
                      </div>
                      <div>
                        {new Intl.DateTimeFormat("en-GB", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(branch.waitTo))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="font-inter font-normal text-[14px] leading-[22px]">
                  {(branch.type === BranchType.EVENT &&
                    branch.conditions.length > 3) ||
                  (branch.type === BranchType.ATTRIBUTE &&
                    branch.attributeConditions.length > 3) ? (
                    <>More conditions</>
                  ) : (
                    <>Then move to the next step.</>
                  )}
                </div>
              </div>
            </Transition>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
