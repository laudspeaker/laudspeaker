import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { TimeWindowIcon, UserIcon } from "../Icons";
import { TimeWindowNodeData, TimeWindowTypes } from "./NodeData";
import { useAppSelector } from "store/hooks";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const TimeWindowNode: FC<NodeProps<TimeWindowNodeData>> = ({
  id,
  isConnectable,
  selected,
  data: {
    from,
    to,
    showErrors,
    disabled,
    customersCount,
    windowType,
    fromTime,
    toTime,
    onDays,
  },
}) => {
  const { isViewMode } = useAppSelector((state) => state.flowBuilder);

  return (
    <div
      className={`time-window relative w-[260px] h-[80px] rounded bg-white font-inter ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#6366F1]">
          <TimeWindowIcon />
        </div>
      </Handle>
      <div className="p-[16px] max-h-full">
        <div className="flex justify-between font-semibold text-base mb-[2px]">
          <div>Time window</div>
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
          {from && to && windowType === TimeWindowTypes.SPEC_DATES ? (
            <div className="max-h-[22px] overflow-hidden whitespace-nowrap text-ellipsis">
              From{" "}
              {new Intl.DateTimeFormat("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(from))}{" "}
              to{" "}
              {new Intl.DateTimeFormat("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(to))}
            </div>
          ) : fromTime &&
            toTime &&
            windowType === TimeWindowTypes.SPEC_WEEK_DAYS ? (
            <div className="max-h-[22px] overflow-hidden whitespace-nowrap text-ellipsis">
              From {fromTime} to {toTime}{" "}
              {(onDays || []).filter((el) => el).length} days per week
            </div>
          ) : (
            <span
              className={`font-inter font-normal text-[12px] leading-5 ${
                showErrors ? "text-[#F43F5E]" : ""
              }`}
            >
              Set time
            </span>
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
