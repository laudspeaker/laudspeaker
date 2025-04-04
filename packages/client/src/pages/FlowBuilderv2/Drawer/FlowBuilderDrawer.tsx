import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";
import React, { DragEvent, FC } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import {
  clearCopyNodes,
  clearInsertNodes,
  setDragAction,
  setIsDragging,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import defaultFixtures, { DrawerAction } from "./drawer.fixtures";
import { MessageNodeData } from "../Nodes/NodeData";
import DeleteIcon from "assets/icons/DeleteIcon";
import {
  dragActionsNotToDoBetweenNodes,
  pastedDragActionsNotToDoBetweenNodes,
} from "../FlowPlugins/NodeDraggingProvider";

export interface FlowBuilderDrawerFixture {
  groupName: string;
  children: {
    id: DrawerAction | OnboardingAction;
    icon: JSX.Element;
    text: string;
    disabled?: boolean;
    targetId?: string;
    copiedId?: string;
  }[];
}

interface FlowBuilderDrawerProps {
  fixtures?: FlowBuilderDrawerFixture[];
  disableStepsCreation?: boolean;
}

const FlowBuilderDrawer: FC<FlowBuilderDrawerProps> = ({ fixtures }) => {
  const { isOnboarding, isDrawerDisabled, copiedNodes } = useAppSelector(
    (state) => state.flowBuilder
  );
  console.log(copiedNodes, "copiedNodes");
  const copiedNodesFixture = copiedNodes.length
    ? {
        groupName: "Copied",
        // children: copiedNodes.map((node) => {
        //   return {
        //     id: DrawerAction.EMAIL,
        //     icon: null,
        //     text: (node?.data as MessageNodeData)?.customName || "Copied",
        //     copiedId: node?.id,
        //     targetId: "",
        //   };
        // }),
        hasDelete: true,
        children: [
          {
            // id: DrawerAction[
            //   copiedNodes?.[0]?.data?.template?.type?.toUpperCase() ||
            //     copiedNodes?.[0]?.type?.toUpperCase()
            // ],
            id: null,
            actionIds: copiedNodes.map(
              (node) => node.data?.template?.type || node.type
            ),
            icon: null,
            text:
              copiedNodes.length === 1
                ? (copiedNodes[0]?.data as MessageNodeData)?.customName ||
                  copiedNodes[0]?.type
                : `${copiedNodes.length} copied nodes`,
            // copiedNodes
            //   .map((node) => {
            //     return (node?.data as MessageNodeData)?.customName;
            //   })
            //   .join(", ") || "Copied",
            copiedId: copiedNodes.map((node) => node?.id),
            targetId: "",
          },
        ],
      }
    : {};

  const fixturesToRender =
    fixtures ||
    (copiedNodes.length
      ? [copiedNodesFixture, ...defaultFixtures]
      : defaultFixtures);

  const dispatch = useAppDispatch();

  const onDragStart = (
    e: DragEvent<HTMLDivElement>,
    action: DrawerAction | OnboardingAction,
    targetId?: string,
    copiedId?: string[],
    actionIds?: DrawerAction[]
  ) => {
    e.dataTransfer.setData("action", action);
    if (actionIds?.length)
      e.dataTransfer.setData("actionIds", actionIds.join(","));
    if (targetId) e.dataTransfer.setData("targetId", targetId);
    if (copiedId) e.dataTransfer.setData("copiedId", copiedId.join(","));

    // const pastedDragActionsNotToDoBetweenNodes = [
    //   ...dragActionsNotToDoBetweenNodes,
    //   DrawerAction.MULTISPLIT,
    // ];
    //find a node that can't be put between nodes (e.g. jumpTo)
    const pastedNodeNotToBeBetweenNodes = actionIds?.find((id) =>
      pastedDragActionsNotToDoBetweenNodes.includes(id)
    );

    console.log(pastedNodeNotToBeBetweenNodes, "pastedNodeNotToBeBetweenNodes");
    //change dragActionsNotToDoBetweenNodes to add logic for not moving multisplit between nodes. Extend this object

    //if pasted actions have a node that can't be moves pass this type as type otherwise a first type
    //it ensures correct behavior for nodes that can't be between others
    const actionId = actionIds?.length
      ? pastedNodeNotToBeBetweenNodes
        ? { type: pastedNodeNotToBeBetweenNodes }
        : { type: actionIds[0] }
      : null;

    dispatch(setIsDragging(true));
    dispatch(setDragAction(actionId || { type: action }));
  };

  const onDragEnd = () => {
    dispatch(setIsDragging(false));
    dispatch(setDragAction());
    dispatch(clearInsertNodes());
  };

  return (
    <div className="min-w-[232px] w-[232px] border-col border-right-[1px] border-[#E5E7EB] bg-white h-full">
      <Scrollbars>
        <div className="px-[16px] py-5 flex flex-col gap-5">
          {fixturesToRender.map((group) => (
            <div
              className="flex flex-col gap-[10px] w-[200px]"
              key={group.groupName}
            >
              <div className="text-[#111827] text-[16px] font-semibold leading-[24px] font-segoe flex justify-space-between">
                {group.groupName}
                {group?.hasDelete && (
                  <button
                    className="ml-auto"
                    onClick={() => dispatch(clearCopyNodes())}
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>

              {group.children &&
                group.children.map((child, i) => (
                  <div
                    className={`w-full h-[44px] px-[15px] py-[10px] flex gap-[10px] border border-[#E5E7EB]  rounded select-none items-end cursor-grab ${
                      (child?.disabled || isDrawerDisabled) && !isOnboarding
                        ? "grayscale cursor-not-allowed !text-[#9CA3AF] !bg-[#F3F4F6]"
                        : ""
                    }`}
                    onDragStart={(e) =>
                      onDragStart(
                        e,
                        child.id,
                        child.targetId,
                        child?.copiedId,
                        child?.actionIds
                      )
                    }
                    onDragEnd={onDragEnd}
                    key={i}
                    id={child.id}
                    draggable={!child.disabled && !isDrawerDisabled}
                  >
                    <div className="text-[#6366F1]">{child.icon}</div>
                    <div className="font-segoe font-normal text-[14px] leading-[22px]">
                      {child.text}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </Scrollbars>
    </div>
  );
};

export default FlowBuilderDrawer;
