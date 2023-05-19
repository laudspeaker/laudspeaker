import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { LoopIcon } from "../Icons";
import NodeData from "./NodeData";

export const LoopNode: FC<NodeProps<NodeData>> = ({ isConnectable }) => {
  return (
    <div className="w-[260px] h-[80px] rounded-[4px] border-[1px] border-[#E5E7EB] bg-white">
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <div className="p-[16px] flex flex-col gap-[2px]">
        <div className="flex gap-[6px]">
          <div>
            <LoopIcon />
          </div>
          <div
            className={`font-inter font-semibold text-[16px] leading-[24px]`}
          >
            Loop
          </div>
        </div>
        <div className="font-inter font-normal text-[14px] leading-[22px]">
          Set up the loop step
        </div>
      </div>
    </div>
  );
};
