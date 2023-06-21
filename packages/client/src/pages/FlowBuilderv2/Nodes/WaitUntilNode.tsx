import React, { FC } from "react";
import { Handle, Node, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import BranchPopover from "../Edges/components/BranchPopover";
import { WaitUntilIcon } from "../Icons";
import { EventBranch, WaitUntilNodeData } from "./NodeData";

export const WaitUntilNode: FC<NodeProps<WaitUntilNodeData>> = ({
  isConnectable,
  selected,
  data: { branches },
  id,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

  const thisNode = nodes.find(
    (node) => node.id === id
  ) as Node<WaitUntilNodeData>;

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
          <WaitUntilIcon />
        </div>
      </Handle>

      {branches.length === 1 ? (
        <BranchPopover branch={branches[0]} node={thisNode}>
          <div className="p-[16px]">
            <div className="font-semibold text-[16px] leading-[24px] mb-[2px]">
              Wait until
            </div>
            <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
              {!branches.length ||
              !(branches[0] as EventBranch)?.conditions?.length
                ? "Wait ..."
                : branches.length === 1 &&
                  (branches[0] as EventBranch).conditions.length
                ? `Meet ${
                    (branches[0] as EventBranch).conditions.length
                  } conditions`
                : "Meet below conditions"}
            </div>
          </div>
        </BranchPopover>
      ) : (
        <div className="p-[16px]">
          <div className="font-semibold text-[16px] leading-[24px] mb-[2px]">
            Wait until
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            {!branches.length ||
            !(branches[0] as EventBranch)?.conditions?.length
              ? "Wait ..."
              : branches.length === 1 &&
                (branches[0] as EventBranch).conditions.length
              ? `Meet ${
                  (branches[0] as EventBranch).conditions.length
                } conditions`
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
    </div>
  );
};
