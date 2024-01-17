import { Transition } from "@headlessui/react";
import { capitalize } from "lodash";
import {
  Branch,
  BranchType,
  ElementKey,
  LogicRelation,
  MessageCondition,
  MultisplitNodeData,
  StatementType,
  TimeType,
  UserAttributeNodeData,
  WaitUntilNodeData,
  WUAttributeCondition,
  WUAttributeHappenCondition,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import MultisplitCondtionsReview from "pages/FlowBuilderv2/SidePanel/components/MultisplitCondtionsReview";
import { limitQuery } from "pages/FlowBuilderv2/SidePanel/settings/MulisplitSettings";
import React, { FC, Fragment, ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Node, useViewport } from "reactflow";
import {
  selectNode,
  WaitUntilMessageProviderCorelation,
} from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import { ProviderType } from "types/Workflow";

const popperNameMap: Record<BranchType, string> = {
  [BranchType.EVENT]: "Wait people until",
  [BranchType.MAX_TIME]: "If wait until",
  [BranchType.ATTRIBUTE]: "If attribute",
  [BranchType.MESSAGE]: "Wait people until",
  [BranchType.WU_ATTRIBUTE]: "Wait people until",
  [BranchType.MULTISPLIT]: "If users are",
  [BranchType.EXPERIMENT]: "Percentage of users",
};

interface BranchPopoverProps {
  node: Node<WaitUntilNodeData | UserAttributeNodeData | MultisplitNodeData>;
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
              className={`fixed p-[10px] w-[260px] bg-white z-[999999999] rounded flex flex-col gap-[10px] ${
                className ? className : ""
              }`}
              onClick={() => dispatch(selectNode(node.id))}
            >
              <div className="font-inter font-semibold text-base">
                {popperNameMap[branch.type]}
              </div>
              {branch.type === BranchType.EVENT ||
              branch.type === BranchType.MESSAGE ? (
                <>
                  {branch.conditions.length === 0 ? (
                    <div className="bg-[#FFF1F2] p-[10px] font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
                      You need to set branch conditions
                    </div>
                  ) : (
                    branch.conditions.slice(0, 3).map((condition, i) => {
                      const isMessageEditing = [
                        ProviderType.EMAIL_MESSAGE,
                        ProviderType.IN_APP_MESSAGE,
                        ProviderType.PUSH_MESSAGE,
                        ProviderType.SMS_MESSAGE,
                      ].includes(condition.providerType);

                      return (
                        <React.Fragment key={i}>
                          <div className="p-[10px] bg-[#F3F4F6] flex flex-col gap-[5px]">
                            <div className="font-inter font-semibold text-[14px] leading-[22px] text-[#18181B]">
                              {condition.providerType === ProviderType.CUSTOM
                                ? "Custom Event"
                                : condition.providerType ===
                                  ProviderType.POSTHOG
                                ? "Posthog Event"
                                : isMessageEditing
                                ? capitalize(
                                    WaitUntilMessageProviderCorelation[
                                      condition.providerType
                                    ]
                                  )
                                : condition.providerType ===
                                  ProviderType.WU_ATTRIBUTE
                                ? "Attribute"
                                : "Tracker"}
                            </div>
                            {condition.providerType === ProviderType.TRACKER ? (
                              <>
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
                              </>
                            ) : condition.providerType ===
                              ProviderType.CUSTOM ? (
                              <>
                                {condition.statements.map((statement, j) => (
                                  <div
                                    key={j}
                                    className="font-inter font-normal text-[12px] leading-5 text-[#18181B]"
                                  >
                                    {statement.type ===
                                    StatementType.PROPERTY ? (
                                      <div>
                                        Property "{statement.key}"{" "}
                                        {statement.comparisonType} "
                                        {statement.value}"
                                      </div>
                                    ) : statement.type ===
                                      StatementType.ELEMENT ? (
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
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : isMessageEditing ? (
                              <>
                                <div className="flex w-full items-center">
                                  {(condition as MessageCondition)
                                    .fromSpecificMessage.key === "ANY" ? (
                                    <span className="whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis inline-block text-[14px] font-bold text-[#111827]">
                                      Any{" "}
                                      {
                                        WaitUntilMessageProviderCorelation[
                                          condition.providerType
                                        ]
                                      }
                                    </span>
                                  ) : (
                                    <span className="whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis inline-block text-[14px] px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                                      {
                                        (condition as MessageCondition)
                                          .fromSpecificMessage.title
                                      }
                                    </span>
                                  )}
                                  <span className="px-1 text-[12px]">from</span>
                                  {(condition as MessageCondition).from?.key ? (
                                    <span className="whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis inline-block text-[14px] px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                                      {
                                        (condition as MessageCondition).from
                                          ?.title
                                      }
                                    </span>
                                  ) : (
                                    <span className="text-[14px] font-bold text-[#EB5757]">
                                      Select journey
                                    </span>
                                  )}
                                </div>
                                <div className="text-[14px] leading-5 font-inter">
                                  is{" "}
                                  {
                                    (condition as MessageCondition)
                                      .eventCondition
                                  }
                                </div>
                              </>
                            ) : condition.providerType ===
                              ProviderType.WU_ATTRIBUTE ? (
                              <div className="flex w-full items-center flex-wrap gap-[4px]">
                                {(condition as WUAttributeCondition)
                                  .attributeName ? (
                                  <span className="whitespace-nowrap text-[14px] max-w-[80px] overflow-hidden text-ellipsis inline-block px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                                    {
                                      (
                                        condition as WUAttributeCondition
                                      ).attributeName.split(";;")[0]
                                    }
                                  </span>
                                ) : (
                                  <span className="font-bold text-[#EB5757] font-inter">
                                    Select attribute
                                  </span>
                                )}
                                <span className="text-[#111827] text-[12px] font-inter">
                                  {" "}
                                  is{" "}
                                  {
                                    (condition as WUAttributeCondition)
                                      .happenCondition
                                  }{" "}
                                </span>
                                {(condition as WUAttributeCondition)
                                  .happenCondition ===
                                  WUAttributeHappenCondition.CHANGED_TO && (
                                  <span className="whitespace-nowrap text-[14px] max-w-[100px] overflow-hidden text-ellipsis inline-block px-[5px] py-[2px] border border-[#E5E7EB] rounded-sm bg-white font-inter">
                                    {(condition as WUAttributeCondition)
                                      .value || (
                                      <i className="opacity-70">Empty value</i>
                                    )}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <></>
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
                      );
                    })
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
                              className="font-inter font-normal text-[12px] leading-5 text-[#18181B]"
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
              ) : branch.type === BranchType.MAX_TIME ? (
                <>
                  {branch.timeType === TimeType.TIME_DELAY ? (
                    <div className="px-2 py-[10px] rounded bg-[#F3F4F6] font-inter font-normal text-[14px] leading-[22px] text-[#18181B]">
                      {branch.delay.days} days {branch.delay.hours} hours{" "}
                      {branch.delay.minutes} min
                    </div>
                  ) : (
                    <div className="flex gap-[10px] px-2 py-[10px] rounded bg-[#F3F4F6] font-inter font-normal text-[14px] leading-[22px] text-[#18181B]">
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
                            branch.waitFrom
                              ? new Date(branch.waitFrom)
                              : new Date()
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
                </>
              ) : branch.type === BranchType.MULTISPLIT ? (
                <div>
                  {branch.conditions ? (
                    <MultisplitCondtionsReview
                      condition={limitQuery(branch.conditions?.query, 3)[0]}
                    />
                  ) : (
                    <div className="font-inter font-normal text-[14px] leading-5 text-[#18181B]">
                      Not suitable for other branches
                    </div>
                  )}
                </div>
              ) : (
                <></>
              )}

              <div className="font-inter font-normal text-[14px] leading-[22px]">
                {(branch.type === BranchType.EVENT ||
                  branch.type === BranchType.MESSAGE) &&
                branch.conditions.length === 0 ? (
                  <></>
                ) : ((branch.type === BranchType.EVENT ||
                    branch.type === BranchType.MESSAGE) &&
                    branch.conditions.length > 3) ||
                  (branch.type === BranchType.ATTRIBUTE &&
                    branch.attributeConditions.length > 3) ||
                  (branch.type === BranchType.MULTISPLIT &&
                    branch.conditions &&
                    limitQuery(branch.conditions.query, 3)[1] >= 3) ? (
                  <>More conditions</>
                ) : branch.type === BranchType.EXPERIMENT ? (
                  <>That will be moved to this branch.</>
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
