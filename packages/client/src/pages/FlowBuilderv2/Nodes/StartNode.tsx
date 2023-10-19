import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { NodeData } from "./NodeData";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

export const StartNode: FC<NodeProps<NodeData>> = ({
  id,
  isConnectable,
  selected,
  data: { disabled },
}) => {
  return (
    <div
      className={`w-[120px] relative h-[60px] bg-white rounded-[4px] flex justify-center items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${
        selected
          ? "border-[2px] border-[#6366F1]"
          : "border-[1px] border-[#E5E7EB]"
      }`}
    >
      <div className="font-medium font-inter text-[16px] leading-[22px]">
        Start
      </div>
      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 pointer-events-none cursor-default"
      />
      <NodeDevModeHighlighter id={id} />
    </div>
  );
};
