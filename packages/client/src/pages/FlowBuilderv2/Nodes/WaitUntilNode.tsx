import React, { FC } from "react";
import { Handle, Node, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import BranchPopover from "../Edges/components/BranchPopover";
import { UserIcon, WaitUntilIcon } from "../Icons";
import { EventBranch, WaitUntilNodeData } from "./NodeData";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const WaitUntilNode: FC<NodeProps<WaitUntilNodeData>> = ({
  isConnectable,
  selected,
  data: { branches, disabled, customersCount },
  id,
}) => {
  const { nodes, isOnboardingWaitUntilTooltipVisible, isViewMode } =
    useAppSelector((state) => state.flowBuilder);

  const thisNode = nodes.find(
    (node) => node.id === id
  ) as Node<WaitUntilNodeData>;

  return (
    <div
      className={`relative wait-until-node w-[260px] h-[80px] rounded bg-white font-inter ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
      data-testid="wait-until-node"
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#6366F1]">
          <WaitUntilIcon />
        </div>
      </Handle>

      {branches.length === 1 ? (
        <BranchPopover branch={branches[0]} node={thisNode}>
          <div className="p-[16px]">
            <div className="flex justify-between font-semibold text-base mb-[2px]">
              <div>Wait until</div>
              {isViewMode && (
                <div className="h-fit px-1 py-[2px] flex items-center gap-[4px] bg-[#F3F4F6] rounded-sm">
                  <UserIcon />
                  <div className="text-[10px] leading-normal">
                    {compatNumberFormatter.format(customersCount || 0)}
                  </div>
                </div>
              )}
            </div>
            <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
              {!branches.length ||
              !(branches[0] as EventBranch)?.conditions?.length ? (
                <span className="font-inter font-normal text-[12px] text-[#F43F5E] leading-5">
                  Set conditions
                </span>
              ) : branches.length === 1 &&
                (branches[0] as EventBranch).conditions.length ? (
                `Meet ${
                  (branches[0] as EventBranch).conditions.length
                } conditions`
              ) : (
                "Meet below conditions"
              )}
            </div>
          </div>
        </BranchPopover>
      ) : (
        <div className="p-[16px]">
          <div className="flex justify-between font-semibold text-base mb-[2px]">
            <div>Wait until</div>
            {isViewMode && (
              <div className="h-fit px-1 py-[2px] flex items-center gap-[4px] bg-[#F3F4F6] rounded-sm">
                <UserIcon />
                <div className="text-[10px] leading-normal">
                  {compatNumberFormatter.format(customersCount || 0)}
                </div>
              </div>
            )}
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            {!branches.length ||
            !(branches[0] as EventBranch)?.conditions?.length ? (
              <span className="font-inter font-normal text-[12px] text-[#F43F5E] leading-5">
                Set conditions
              </span>
            ) : branches.length === 1 &&
              (branches[0] as EventBranch).conditions.length ? (
              `Meet ${
                (branches[0] as EventBranch).conditions.length
              } conditions`
            ) : (
              "Meet below conditions"
            )}
          </div>
        </div>
      )}

      {isOnboardingWaitUntilTooltipVisible && (
        <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-[220px] p-[10px] bg-black text-white font-medium">
          Click to modify the trigger
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
