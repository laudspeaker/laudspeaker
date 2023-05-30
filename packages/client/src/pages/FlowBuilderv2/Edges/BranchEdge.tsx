import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";

export const BranchEdge: FC<EdgeProps> = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan "
          onClick={() => alert("Open branch")}
        >
          <span className="bg-[#F3F4F6] block py-[8px] px-[4px] leading-[22px] text-[14px] text-[#111827] border-b-[1px] border-b-black">
            <span className="font-semibold">Branch: </span>
            {!data.branch.conditions.length ? (
              <span className="text-red-500">Has no conditions</span>
            ) : (
              `Meet ${data.branch.conditions.length} conditions`
            )}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
