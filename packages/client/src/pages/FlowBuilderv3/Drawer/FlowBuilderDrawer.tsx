import React, { DragEvent } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import flowBuilderFixtures from "./fixtures/drawer.fixtures";

const FlowBuilderDrawer = () => {
  const onDrag = (e: DragEvent<HTMLDivElement>) => {
    console.log(e);
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
                  className="w-full h-[44px] px-[15px] py-[10px] flex gap-[10px] border-[1px] border-[#E5E7EB] select-none items-end"
                  onDrag={onDrag}
                  key={child.id}
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
