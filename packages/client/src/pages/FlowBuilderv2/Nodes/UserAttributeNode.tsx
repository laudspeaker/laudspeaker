import React, { FC } from "react";
import { Handle, Node, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import BranchPopover from "../Edges/components/BranchPopover";
import { UserAttributeIcon } from "../Icons";
import { UserAttributeNodeData } from "./NodeData";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

export const UserAttributeNode: FC<NodeProps<UserAttributeNodeData>> = ({
  isConnectable,
  selected,
  data: { branches, disabled },
  id,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

  const thisNode = nodes.find(
    (node) => node.id === id
  ) as Node<UserAttributeNodeData>;

  return (
    <div
      className={`relative w-[260px] h-[80px] rounded bg-white font-inter ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#6366F1]">
          <UserAttributeIcon />
        </div>
      </Handle>

      {branches.length === 1 ? (
        <BranchPopover branch={branches[0]} node={thisNode}>
          <div className="p-[16px]">
            <div className="font-semibold text-base mb-[2px]">
              User attribute
            </div>
            <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
              {!branches.length || !branches[0]?.attributeConditions?.length
                ? "Set attribute condition"
                : branches.length === 1 &&
                  branches[0].attributeConditions.length
                ? `Meet ${branches[0].attributeConditions.length} conditions`
                : "Meet below conditions"}
            </div>
          </div>
        </BranchPopover>
      ) : (
        <div className="p-[16px]">
          <div className="font-semibold text-base mb-[2px]">User attribute</div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            {!branches.length || !branches[0]?.attributeConditions?.length
              ? "Set attribute condition"
              : branches.length === 1 && branches[0].attributeConditions.length
              ? `Meet ${branches[0].attributeConditions.length} conditions`
              : "Meet below conditions"}
          </div>
        </div>
      )}

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
