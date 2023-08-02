import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import { CustomModalIcon } from "../Icons";
import { Stats, TrackerNodeData } from "./NodeData";

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const trackerStatsToShow: {
  key: keyof Stats;
  name: string;
  renderLabel: (value: number) => string;
}[] = [
  {
    key: "sent",
    name: "Delivered",
    renderLabel: (value) => compatNumberFormatter.format(value),
  },
  {
    key: "delivered",
    name: "Shown",
    renderLabel: (value) => compatNumberFormatter.format(value),
  },
];

export const TrackerNode: FC<NodeProps<TrackerNodeData>> = ({
  isConnectable,
  data: { stats, needsCheck, tracker },
  selected,
}) => {
  const { isViewMode } = useAppSelector((state) => state.flowBuilder);

  return (
    <div
      className={`${isViewMode ? "w-[300px]" : "w-[260px]"} ${
        isViewMode && stats ? "h-[140px]" : "h-[80px]"
      }  rounded-[4px] bg-white ${
        selected
          ? "border-[2px] border-[#6366F1]"
          : "border-[1px] border-[#E5E7EB]"
      }`}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <div
        className="p-[16px] flex flex-col gap-[2px]"
        onDragOver={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          console.log(e.dataTransfer.getData("jumpTo"));
        }}
      >
        <div className="flex gap-[6px]">
          <div className="text-[#6366F1]">
            <CustomModalIcon />
          </div>
          <div
            className={`font-inter font-semibold text-[16px] leading-[24px]`}
          >
            Tracker
          </div>
        </div>
        <div className="font-inter font-normal text-[14px] leading-[22px] whitespace-nowrap text-ellipsis max-w-full overflow-hidden">
          {needsCheck ? (
            <div className="text-[#F43F5E]">Template changed, please check</div>
          ) : tracker ? (
            <div className="w-fit px-[5px] bg-[#E0E7FF] text-[#4338CA] rounded-[4px]">
              {tracker.trackerId}
            </div>
          ) : (
            "Set a tracker"
          )}
        </div>
      </div>
      {isViewMode && stats && (
        <div className="px-[16px] py-[6px] flex justify-between gap-[10px] border-t-[1px] border-[#E5E7EB]">
          {trackerStatsToShow.map((stat, i) => (
            <div
              key={i}
              className={`h-[46px] w-full flex flex-col gap-[4px] ${
                i !== (trackerStatsToShow?.length || 1) - 1
                  ? "border-r-[1px] border-[#E5E7EB]"
                  : ""
              }`}
            >
              <div className="text-[12px] leading-[20px] text-[#4B5563]">
                {stat.name}
              </div>
              <div className="font-semibold text-[14px] leading-[22px]">
                {stat.renderLabel(stats?.[stat.key] || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
    </div>
  );
};
