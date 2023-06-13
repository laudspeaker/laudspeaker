import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { NodeData } from "./NodeData";

export const InsertNode: FC<NodeProps<NodeData>> = ({ isConnectable, id }) => {
  return (
    <div
      className={`w-[260px] h-[80px] rounded-[8px] border-[2px] border-dashed flex justify-center items-center !border-[#6366F1] !bg-[#E0E7FF]`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[1px] !opacity-0 !border-0 pointer-events-none cursor-default"
      />

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
    </div>
  );
};
