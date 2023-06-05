import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { UserAttributeIcon } from "../Icons";
import { UserAttributeNodeData } from "./NodeData";

export const UserAttributeNode: FC<NodeProps<UserAttributeNodeData>> = ({
  isConnectable,
  selected,
  data: { branches },
}) => {
  return (
    <div
      className={`w-[260px] h-[80px] rounded-[4px] bg-white font-inter ${
        selected
          ? "border-[2px] border-[#6366F1]"
          : "border-[1px] border-[#E5E7EB]"
      }`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <UserAttributeIcon />
        </div>
      </Handle>
      <div className="p-[16px]">
        <div className="font-semibold text-[16px] leading-[24px] mb-[2px]">
          User attribute
        </div>
        <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
          {!branches.length || !branches[0]?.attributeConditions?.length
            ? "Set attribute condition"
            : branches.length === 1 && branches[0].attributeConditions.length
            ? `Meet ${branches[0].attributeConditions.length} conditions`
            : "Meet below conditions"}
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
