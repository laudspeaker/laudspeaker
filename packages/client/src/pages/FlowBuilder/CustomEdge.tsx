import React from "react";
import { getSmoothStepPath, EdgeProps } from "reactflow";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const edgePath = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })[0];

  return (
    <>
      <path
        style={style}
        className="react-flow__edge-path-selector"
        d={edgePath}
        markerEnd={markerEnd}
        fillRule="evenodd"
      />
      <path
        id={id}
        style={style}
        className="react-flow__edge-path z-[2]"
        d={edgePath}
        markerEnd={markerEnd}
        fillRule="evenodd"
      />
    </>
  );
}
