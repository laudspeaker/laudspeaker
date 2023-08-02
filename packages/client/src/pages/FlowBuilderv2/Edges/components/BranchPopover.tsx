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
import React, { FC, Fragment, ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Node, useViewport } from "reactflow";
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
  children: ReactNode;
  className?: string;
}

const BranchPopover: FC<BranchPopoverProps> = ({
  node,
  branch,
  children,
  className,
}) => {
  const dispatch = useAppDispatch();

  const [isPopperShowing, setIsPopperShowing] = useState(false);

  const elementRef = useRef<HTMLDivElement>(null);

  const bodyElement = document.body;

  const { zoom } = useViewport();

  return (
    <>
      <div
        ref={elementRef}
        onMouseEnter={() => setIsPopperShowing(true)}
        onMouseLeave={() => setIsPopperShowing(false)}
      >
        {children}
      </div>
      {elementRef.current &&
        createPortal(
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
              style={{
                top: elementRef.current.getBoundingClientRect().bottom,
                left: elementRef.current.getBoundingClientRect().left,
                transformOrigin: "0 0",
                transform: `scale(${zoom}) translateY(5px)`,
              }}
              className={`fixed p-[10px] w-[260px] bg-white z-[999999999] rounded-[4px] flex flex-col gap-[10px] ${
                className ? className : ""
              }`}
              onClick={() => dispatch(selectNode(node.id))}
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
                            {condition.providerType === ProviderType.CUSTOM
                              ? "Custom Event"
                              : condition.providerType === ProviderType.POSTHOG
                              ? "Posthog Event"
                              : "Tracker"}
                          </div>
                          {condition.providerType === ProviderType.TRACKER ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              {condition.statements.map((statement, j) => (
                                <div
                                  key={j}
                                  className="font-inter font-normal text-[12px] leading-[20px] text-[#18181B]"
                                >
                                  {statement.type === StatementType.PROPERTY ? (
                                    <div>
                                      Property "{statement.key}"{" "}
                                      {statement.comparisonType} "
                                      {statement.value}"
                                    </div>
                                  ) : (
                                    <div>
                                      Element{" "}
                                      <span className="font-bold">
                                        #{statement.order}
                                      </span>{" "}
                                      "
                                      {statement.elementKey ===
                                      ElementKey.TAG_NAME
                                        ? "Tag name"
                                        : "Text"}
                                      " {statement.comparisonType} "
                                      {statement.value}"
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        {i !== branch.conditions.length - 1 && i !== 2 && (
                          <div>
                            {condition.relationToNext === LogicRelation.AND
                              ? "And"
                              : "Or"}
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
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
                              "{statement.key}" {statement.comparisonType} "
                              {statement.value}"
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
                      }).format(
                        branch.waitFrom ? new Date(branch.waitFrom) : new Date()
                      )}
                    </div>
                    <div>
                      {new Intl.DateTimeFormat("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "numeric",
                        minute: "numeric",
                      }).format(
                        branch.waitTo ? new Date(branch.waitTo) : new Date()
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="font-inter font-normal text-[14px] leading-[22px]">
                {branch.type === BranchType.EVENT &&
                branch.conditions.length === 0 ? (
                  <></>
                ) : (branch.type === BranchType.EVENT &&
                    branch.conditions.length > 3) ||
                  (branch.type === BranchType.ATTRIBUTE &&
                    branch.attributeConditions.length > 3) ? (
                  <>More conditions</>
                ) : (
                  <>Then move to the next step.</>
                )}
              </div>
            </div>
          </Transition>,
          bodyElement
        )}
    </>
  );
};

export default BranchPopover;
