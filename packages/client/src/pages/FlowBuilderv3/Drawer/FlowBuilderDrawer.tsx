import React, { DragEvent } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { setIsDragging } from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import flowBuilderFixtures, { DrawerAction } from "./drawer.fixtures";

const FlowBuilderDrawer = () => {
  const dispatch = useAppDispatch();

  const onDragStart = (e: DragEvent<HTMLDivElement>, action: DrawerAction) => {
    e.dataTransfer.setData("action", action);
    dispatch(setIsDragging(true));
  };

  const onDragEnd = () => {
    dispatch(setIsDragging(false));
  };

  return (
    <div className="min-w-[232px] w-[232px] border-[1px] border-[#E5E7EB] bg-white h-full">
      <Scrollbars>
        <div className="px-[16px] py-[20px] flex flex-col gap-[20px]">
          {flowBuilderFixtures.map((group) => (
            <div
              className="flex flex-col gap-[10px] w-[200px]"
              key={group.groupName}
            >
              <div className="text-[#111827] text-[16px] font-semibold leading-[24px] font-segoe">
                {group.groupName}
              </div>
              {group.children.map((child) => (
                <div
                  className="w-full h-[44px] px-[15px] py-[10px] flex gap-[10px] border-[1px] border-[#E5E7EB] select-none items-end cursor-grab"
                  onDragStart={(e) => onDragStart(e, child.id)}
                  onDragEnd={onDragEnd}
                  key={child.id}
                  draggable
                >
                  <div>{child.icon}</div>
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
