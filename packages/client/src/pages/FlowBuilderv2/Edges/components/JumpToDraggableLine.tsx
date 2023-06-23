import React, { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BaseEdge,
  getBezierPath,
  MarkerType,
  Position,
  useViewport,
  getMarkerEnd,
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
  const { nodes } = useAppSelector((state) => state.flowBuilder);

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

    if (isDragging && mousePosition) {
      targetX = (mousePosition.x - viewX - boudingClientRect.left) / zoom;
      targetY = (mousePosition.y - viewY - boudingClientRect.top) / zoom;
    }

    const [newEdgePath] = getBezierPath({
      sourceX: canvasSourceX,
      sourceY: canvasSourceY,
      targetX,
      targetY,
      targetPosition:
        targetY > canvasSourceY
          ? targetX > canvasSourceX
            ? Position.Left
            : Position.Right
          : targetX > canvasSourceX
          ? Position.Right
          : Position.Left,
      sourcePosition: Position.Bottom,
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
        setIsDragging(true);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onDrag={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onDragEnd={(e) => {
        console.log("drag end");
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
                <g className="react-flow__edge">
                  <BaseEdge
                    path={edgePath}
                    style={{
                      stroke: "#4338CA",
                    }}
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
