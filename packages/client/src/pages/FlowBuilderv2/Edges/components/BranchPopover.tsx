import { Transition } from "@headlessui/react";
import {
  Branch,
  BranchType,
  ElementKey,
  LogicRelation,
  StatementType,
  TimeType,
  UserAttributeNodeData,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, Fragment, ReactNode, useState } from "react";
import { Node } from "reactflow";
import { selectNode } from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import { ProviderType } from "types/Workflow";

const popperNameMap: Record<BranchType, string> = {
  [BranchType.EVENT]: "Wait people until",
  [BranchType.MAX_TIME]: "If wait until",
  [BranchType.ATTRIBUTE]: "If attribute",
};

interface BranchPopoverProps {
  node: Node<WaitUntilNodeData | UserAttributeNodeData>;
  branch: Branch;
  translateX: number;
  translateY: number;
  children: ReactNode;
  className?: string;
  popperClassName?: string;
}

const BranchPopover: FC<BranchPopoverProps> = ({
  node,
  branch,
  translateX,
  translateY,
  children,
  className,
  popperClassName,
}) => {
  const dispatch = useAppDispatch();

  const [isPopperShowing, setIsPopperShowing] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${translateX}px,${translateY}px)`,
        fontSize: 12,
        pointerEvents: "all",
      }}
      className={`nodrag nopan z-[9999999999] ${className ? className : ""}`}
      onClick={() => dispatch(selectNode(node.id))}
      onMouseEnter={() => setIsPopperShowing(true)}
      onMouseLeave={() => setIsPopperShowing(false)}
    >
      {children}

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
        <div
          className={`absolute w-[260px] p-[10px] bg-white z-[999999999] rounded-[4px] flex flex-col gap-[10px] ${
            popperClassName ? popperClassName : ""
          }`}
        >
          <div className="font-inter font-semibold text-[16px] leading-[24px]">
            {popperNameMap[branch.type]}
          </div>
          {branch.type === BranchType.EVENT ? (
            <>
              {branch.conditions.length === 0 ? (
                <div className="bg-[#FFF1F2] p-[10px] font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                  You need to set branch conditions
                </div>
              ) : (
                branch.conditions.slice(0, 3).map((condition, i) => (
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
                              " {statement.comparisonType} "{statement.value}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {i !== branch.conditions.length - 1 && i !== 2 && (
                      <div>Or</div>
                    )}
                  </React.Fragment>
                ))
              )}
            </>
          ) : branch.type === BranchType.ATTRIBUTE ? (
            <>
              {branch.attributeConditions.slice(0, 3).map((condition, i) => (
                <React.Fragment key={i}>
                  <div className="p-[10px] bg-[#F3F4F6] flex flex-col gap-[5px]">
                    {condition.statements.map((statement, j) => (
                      <div
                        key={j}
                        className="font-inter font-normal text-[12px] leading-[20px] text-[#18181B]"
                      >
                        "{statement.key}" {statement.comparisonType} "
                        {statement.value}"
                      </div>
                    ))}
                  </div>
                  {i !== branch.attributeConditions.length - 1 && i !== 2 && (
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
  );
};

export default BranchPopover;
