import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";

export const StartNode: FC<NodeProps> = ({ isConnectable }) => {
  return (
    <div className="w-[120px] h-[60px] border-[1px] border-[#E5E7EB] bg-white rounded-[4px] flex justify-center items-center">
      <div className="font-medium font-inter text-[16px] leading-[22px]">
        Start
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
