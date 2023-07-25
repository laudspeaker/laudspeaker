import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { CustomModalIcon } from "../Icons";
import { TrackerNodeData } from "./NodeData";

export const TrackerNode: FC<NodeProps<TrackerNodeData>> = ({
  isConnectable,
  data,
  selected,
}) => {
  return (
    <div
      className={`w-[260px] h-[80px] rounded-[4px] bg-white ${
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
          {data.needsCheck ? (
            <div className="text-[#F43F5E]">Template changed, please check</div>
          ) : data.tracker ? (
            <div className="w-fit px-[5px] bg-[#E0E7FF] text-[#4338CA] rounded-[4px]">
              {data.tracker.trackerId}
            </div>
          ) : (
            "Set a tracker"
          )}
        </div>
      </div>

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
    </div>
  );
};
