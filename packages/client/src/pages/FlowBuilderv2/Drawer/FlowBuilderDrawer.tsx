import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";
import React, { DragEvent, FC } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import {
  clearInsertNodes,
  setDragAction,
  setIsDragging,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import defaultFixtures, { DrawerAction } from "./drawer.fixtures";

export interface FlowBuilderDrawerFixture {
  groupName: string;
  children: {
    id: DrawerAction | OnboardingAction;
    icon: JSX.Element;
    text: string;
    disabled?: boolean;
    targetId?: string;
  }[];
}

interface FlowBuilderDrawerProps {
  fixtures?: FlowBuilderDrawerFixture[];
  disableStepsCreation?: boolean;
}

const FlowBuilderDrawer: FC<FlowBuilderDrawerProps> = ({ fixtures }) => {
  const fixturesToRender = fixtures || defaultFixtures;

  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  const dispatch = useAppDispatch();

  const onDragStart = (
    e: DragEvent<HTMLDivElement>,
    action: DrawerAction | OnboardingAction,
    targetId?: string
  ) => {
    e.dataTransfer.setData("action", action);
    if (targetId) e.dataTransfer.setData("targetId", targetId);
    dispatch(setIsDragging(true));
    dispatch(setDragAction({ type: action }));
  };

  const onDragEnd = () => {
    dispatch(setIsDragging(false));
    dispatch(setDragAction());
    dispatch(clearInsertNodes());
  };

  return (
    <div className="min-w-[232px] w-[232px] border-col border-right-[1px] border-[#E5E7EB] bg-white h-full">
      <Scrollbars>
        <div className="px-[16px] py-[20px] flex flex-col gap-[20px]">
          {fixturesToRender.map((group) => (
            <div
              className="flex flex-col gap-[10px] w-[200px]"
              key={group.groupName}
            >
              <div className="text-[#111827] text-[16px] font-semibold leading-[24px] font-segoe">
                {group.groupName}
              </div>
              {group.children.map((child, i) => (
                <div
                  className={`w-full h-[44px] px-[15px] py-[10px] flex gap-[10px] border-[1px] border-[#E5E7EB]  rounded-[4px] select-none items-end cursor-grab ${
                    child.disabled && !isOnboarding
                      ? "grayscale cursor-not-allowed !text-[#9CA3AF] !bg-[#F3F4F6]"
                      : ""
                  }`}
                  onDragStart={(e) => onDragStart(e, child.id, child.targetId)}
                  onDragEnd={onDragEnd}
                  key={i}
                  draggable={!child.disabled}
                  id={child.id}
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
