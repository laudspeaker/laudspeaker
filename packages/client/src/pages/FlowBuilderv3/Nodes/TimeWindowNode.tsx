import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { TimeWindowIcon } from "../Icons";

export const TimeWindowNode: FC<NodeProps> = ({ isConnectable }) => {
  return (
    <div className="w-[260px] h-[80px] rounded-[4px] bg-white border-[1px] border-[#E5E7EB] font-inter">
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <TimeWindowIcon />
        </div>
      </Handle>
      <div className="p-[16px]">
        <div className="font-semibold text-[16px] leading-[24px] mb-[2px]">
          Time window
        </div>
        <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
          Description
        </div>
      </div>

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 pointer-events-none cursor-default"
      />
    </div>
  );
};
