import React, { FC } from "react";
import { Handle, Node, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import BranchPopover from "../Edges/components/BranchPopover";
import { WaitUntilIcon } from "../Icons";
import { ExperimentNodeData } from "./NodeData";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

export const ExperimentNode: FC<NodeProps<ExperimentNodeData>> = ({
  isConnectable,
  selected,
  data: { branches, disabled, customersCount },
  id,
}) => {
  const { nodes, isOnboardingWaitUntilTooltipVisible, isViewMode } =
    useAppSelector((state) => state.flowBuilder);

  const thisNode = nodes.find(
    (node) => node.id === id
  ) as Node<ExperimentNodeData>;

  return (
    <div
      className={`relative wait-until-node w-[260px] h-[80px] rounded bg-white font-inter ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[-1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />

      <div className="p-[16px]">
        <div className="flex justify-between font-semibold text-base mb-[2px]">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="mr-2"
            >
              <path
                d="M5.63097 1.07147V4.98342C5.63098 5.18571 5.59556 5.38602 5.52675 5.57291C5.45794 5.7598 5.35708 5.92962 5.22994 6.07266L2.74033 8.87346M5.63097 1.07147C5.47823 1.08721 5.32609 1.1057 5.17456 1.12761M5.63097 1.07147C6.54184 0.976178 7.45861 0.976178 8.36948 1.07147M2.74033 8.87346L3.20892 8.74133C4.48263 8.38724 5.82682 8.55546 7.00023 9.21578C8.17364 9.8761 9.51782 10.0443 10.7915 9.69022L11.747 9.42117M2.74033 8.87346L1.40029 10.3817C0.649939 11.2245 1.00412 12.6526 2.04962 12.8532C3.65864 13.1626 5.3127 13.3235 7.00023 13.3235C8.65927 13.3242 10.3154 13.1668 11.9508 12.8532C12.9957 12.6526 13.3499 11.2245 12.6002 10.381L11.747 9.42117M8.36948 1.07147V4.98342C8.36948 5.39214 8.51371 5.78443 8.77052 6.07266L11.747 9.42117M8.36948 1.07147C8.52223 1.08721 8.67437 1.1057 8.8259 1.12761"
                stroke="#6366F1"
                stroke-width="1.125"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Experiment</span>
          </div>
          {/* {isViewMode && (
            <div className="h-fit px-1 py-[2px] flex items-center gap-[4px] bg-[#F3F4F6] rounded-sm">
              <UserIcon />
              <div className="text-[10px] leading-normal">
                {compatNumberFormatter.format(customersCount || 0)}
              </div>
            </div>
          )} */}
        </div>
        <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
          <span className="font-inter font-normal text-[12px] text-[#F43F5E] leading-5">
            Set the experiment
          </span>
        </div>
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
