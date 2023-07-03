import React, { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BaseEdge,
  getBezierPath,
  MarkerType,
  Position,
  useViewport,
  getMarkerEnd,
  useNodes,
} from "reactflow";
import { getSmartEdge } from "@tisoap/react-flow-smart-edge";
import { useAppSelector } from "store/hooks";

interface JumpToDraggableLineProps {
  targetId?: string;
  setTargetId: (targetId?: string) => void;
}

const JumpToDraggableLine: FC<JumpToDraggableLineProps> = ({
  targetId,
  setTargetId,
}) => {
  const nodes = useNodes();

  const sourceRef = useRef<HTMLDivElement>(null);

  const { x: viewX, y: viewY, zoom } = useViewport();

  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  }>();
  const [edgePath, setEdgePath] = useState<string>();

  const flowContainer = document.querySelector(".react-flow");
  const edgesContainer = document.querySelector(".react-flow__edges > g");

  useEffect(() => {
    if (!sourceRef.current || !flowContainer) return;

    const boudingClientRect = flowContainer.getBoundingClientRect();
    const sourceBoundingRect = sourceRef.current.getBoundingClientRect();

    const clientSourceX =
      (sourceBoundingRect.left + sourceBoundingRect.right) / 2;
    const clientSourceY = sourceBoundingRect.bottom;

    const canvasSourceX =
      (clientSourceX - viewX - boudingClientRect.left) / zoom;
    const canvasSourceY =
      (clientSourceY - viewY - boudingClientRect.top) / zoom;

    let targetX = canvasSourceX + 7;
    let targetY = canvasSourceY + 48;

    if (
      isDragging &&
      mousePosition &&
      mousePosition.x !== 0 &&
      mousePosition.y !== 0
    ) {
      targetX = (mousePosition.x - viewX - boudingClientRect.left) / zoom;
      targetY = (mousePosition.y - viewY - boudingClientRect.top) / zoom;
    }

    const sourceX = canvasSourceX;
    const sourceY = canvasSourceY;

    const sourcePosition = Position.Bottom;
    const targetPosition =
      targetY > canvasSourceY
        ? targetX > canvasSourceX
          ? Position.Left
          : Position.Right
        : targetX > canvasSourceX
        ? Position.Right
        : Position.Left;

    const getSmartEdgeResponse = getSmartEdge({
      sourcePosition,
      targetPosition,
      sourceX,
      sourceY,
      targetX,
      targetY,
      nodes,
      options: {
        nodePadding: 100,
      },
    });

    console.log(nodes);

    if (getSmartEdgeResponse) {
      setEdgePath(getSmartEdgeResponse.svgPathString);
      return;
    }

    const [newEdgePath] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      targetPosition,
      sourcePosition,
    });

    setEdgePath(newEdgePath);
  }, [sourceRef.current, isDragging, mousePosition]);

  return (
    <div
      className="absolute left-1/2 top-full -translate-x-1/2"
      draggable
      onClick={(e) => {
        e.stopPropagation();
        console.log("click");
      }}
      onDragStart={(e) => {
        console.log("drag start");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("jumpTo", "true");
        setIsDragging(true);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onDrag={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        e.dataTransfer.setData("jumpTo", "true");
      }}
      onDragEnd={(e) => {
        console.log("drag end", e.clientX, e.clientY);
        setIsDragging(false);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseDownCapture={(e) => e.stopPropagation()}
    >
      <div
        ref={sourceRef}
        className="relative rounded-[100%] w-[10px] h-[10px] bg-[#4338CA] -translate-y-2/3"
      >
        {edgesContainer &&
          createPortal(
            <>
              {edgePath && (
                <g className="react-flow__edge outline-none">
                  <path
                    className="react-flow__edge-path"
                    style={{
                      stroke: "#4338CA",
                    }}
                    d={edgePath}
                  />
                </g>
              )}
            </>,
            edgesContainer
          )}
      </div>
    </div>
  );
};

export default JumpToDraggableLine;
