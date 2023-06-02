import React, { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { TimeWindowIcon } from "../Icons";
import { TimeWindowNodeData } from "./NodeData";

export const TimeWindowNode: FC<NodeProps<TimeWindowNodeData>> = ({
  isConnectable,
  selected,
  data: { from, to },
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
          <TimeWindowIcon />
        </div>
      </Handle>
      <div className="p-[16px] max-h-full">
        <div className="font-semibold text-[16px] leading-[24px] mb-[2px]">
          Time window
        </div>
        <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
          {from && to ? (
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
          ) : (
            <>Wait ...</>
          )}
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
