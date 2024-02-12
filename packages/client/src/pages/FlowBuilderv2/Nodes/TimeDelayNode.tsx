import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { TimeDelayIcon, UserIcon } from "../Icons";
import { TimeDelayNodeData } from "./NodeData";
import { useAppSelector } from "store/hooks";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const TimeDelayNode: FC<NodeProps<TimeDelayNodeData>> = ({
  id,
  isConnectable,
  selected,
  data: { delay, showErrors, disabled, customersCount },
}) => {
  const { isViewMode } = useAppSelector((state) => state.flowBuilder);

  return (
    <div
      className={`time-delay relative w-[260px] h-[80px] rounded bg-white font-inter ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#6366F1]">
          <TimeDelayIcon />
        </div>
      </Handle>
      <div className="p-[16px]">
        <div className="flex justify-between font-semibold text-base mb-[2px]">
          <div>Time delay</div>
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
          {delay.days === delay.hours &&
          delay.hours === delay.minutes &&
          delay.minutes === 0 ? (
            <span
              className={`font-inter font-normal text-[12px] leading-5 ${
                showErrors ? "text-[#F43F5E]" : ""
              }`}
            >
              Set time
            </span>
          ) : (
            <>
              Wait {delay.days} day{delay.days === 1 ? "" : "s"} {delay.hours}{" "}
              hour
              {delay.hours === 1 ? "" : "s"} {delay.minutes} min
            </>
          )}
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
