import React, { DragEvent, FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getBezierPath,
  getSmoothStepPath,
  Position,
  useViewport,
  useNodes,
} from "reactflow";
import {
  getSmartEdge,
  pathfindingAStarNoDiagonal,
  svgDrawSmoothLinePath,
} from "@tisoap/react-flow-smart-edge";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { v4 as uuid } from "uuid";

interface JumpToDraggableLineProps {
  jumpToNodeId: string;
  targetId?: string;
  setTargetId: (targetId?: string) => void;
}

const JumpToDraggableLine: FC<JumpToDraggableLineProps> = ({
  jumpToNodeId,
  targetId,
  setTargetId,
}) => {
  const nodeTypesConnectableToJumpTo: (string | undefined)[] = [
    NodeType.EMPTY,
    NodeType.INSERT_NODE,
    NodeType.JUMP_TO,
    NodeType.START,
  ];

  const nodes = useNodes();

  const jumpToNode = nodes.find((node) => node.id === jumpToNodeId);

  const sourceRef = useRef<HTMLDivElement>(null);
  const positionWrapperRef = useRef<HTMLDivElement>(null);

  const { x: viewX, y: viewY, zoom } = useViewport();

  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  }>();
  const [edgePath, setEdgePath] = useState<string>();
  const [sourceTop, setSourceTop] = useState<number>();
  const [sourceLeft, setSourceLeft] = useState<number>();

  const flowContainer = document.querySelector(".react-flow");
  const edgesContainer = document.querySelector(".react-flow__edges > g");

  useEffect(() => {
    if (!sourceRef.current || !flowContainer) return;

    const boudingClientRect = flowContainer.getBoundingClientRect();
    const sourceBoundingRect = sourceRef.current.getBoundingClientRect();

    const clientSourceX =
      (sourceBoundingRect.left + sourceBoundingRect.right) / 2;
    const clientSourceY =
      (sourceBoundingRect.top + sourceBoundingRect.bottom) / 2;

    const canvasSourceX =
      (clientSourceX - viewX - boudingClientRect.left) / zoom;
    const canvasSourceY =
      (clientSourceY - viewY - boudingClientRect.top) / zoom;

    const sourceX = canvasSourceX;
    const sourceY = canvasSourceY;

    let targetX = canvasSourceX + 7;
    let targetY = canvasSourceY + 48;

    let targetPosition =
      targetY > canvasSourceY
        ? targetX > canvasSourceX
          ? Position.Left
          : Position.Right
        : targetX > canvasSourceX
        ? Position.Right
        : Position.Left;

    if (
      isDragging &&
      mousePosition &&
      mousePosition.x !== 0 &&
      mousePosition.y !== 0
    ) {
      targetX = (mousePosition.x - viewX - boudingClientRect.left) / zoom;
      targetY = (mousePosition.y - viewY - boudingClientRect.top) / zoom;
    }

    if (targetId) {
      const targetNode = nodes.find((node) => node.id === targetId);
      if (!targetNode) {
        setTargetId(undefined);
        return;
      }

      const halfWidth = (targetNode.width || 200) / 2;

      const targetNodeLeftBorder = targetNode.position.x - halfWidth;
      const targetNodeRightBorder = targetNode.position.x + halfWidth;

      const lengthToLeftBorder = Math.abs(targetNodeLeftBorder - canvasSourceX);

      const lengthToRightBorder = Math.abs(
        targetNodeRightBorder - canvasSourceX
      );

      targetX =
        lengthToLeftBorder < lengthToRightBorder
          ? targetNodeLeftBorder
          : targetNodeRightBorder;

      targetPosition =
        lengthToLeftBorder < lengthToRightBorder
          ? Position.Left
          : Position.Right;

      targetY = targetNode.position.y;
    }

    if (
      (isDragging || targetId) &&
      jumpToNode &&
      jumpToNode.width &&
      jumpToNode.height
    ) {
      const xPickFunction =
        targetX < jumpToNode.position.x
          ? Math.max.bind(null, 0)
          : Math.min.bind(null, jumpToNode.width);

      const yPickFunction =
        targetY < jumpToNode.position.y
          ? Math.max.bind(null, jumpToNode.height / 2)
          : Math.min.bind(null, jumpToNode.height);

      const xResult = xPickFunction(
        targetX - jumpToNode.position.x + jumpToNode.width / 2
      );
      const yResult = yPickFunction(
        targetY - jumpToNode.position.y + jumpToNode.height / 2
      );

      if (
        yResult === jumpToNode.height ||
        xResult === 0 ||
        xResult === jumpToNode.width
      )
        setSourceLeft(xResult);

      if (xResult === 0 || xResult === jumpToNode.width) setSourceTop(yResult);
    }

    const sourcePosition =
      sourceLeft === undefined
        ? Position.Bottom
        : sourceLeft <= 0
        ? Position.Left
        : sourceLeft >= 120
        ? Position.Right
        : Position.Bottom;

    const getSmartEdgeResponse = getSmartEdge({
      sourcePosition,
      targetPosition,
      sourceX,
      sourceY,
      targetX,
      targetY,
      nodes: nodes.map((node) => ({
        ...node,
        position: {
          x: node.position.x - (node.width ? node.width / 2 : 0),
          y: node.position.y + (node.height ? node.height / 2 : 0),
        },
        positionAbsolute: {
          x: node.position.x - (node.width ? node.width / 2 : 0),
          y: node.position.y + (node.height ? node.height / 2 : 0),
        },
      })),
      options: {
        drawEdge: targetId ? svgDrawSmoothLinePath : undefined,
        generatePath: targetId ? pathfindingAStarNoDiagonal : undefined,
      },
    });

    if (getSmartEdgeResponse && !targetId) {
      setEdgePath(getSmartEdgeResponse.svgPathString);
      return;
    }

    const dumbPathFunction = targetId ? getSmoothStepPath : getBezierPath;

    const [newEdgePath] = dumbPathFunction({
      sourceX,
      sourceY,
      targetX,
      targetY,
      targetPosition,
      sourcePosition,
    });

    setEdgePath(newEdgePath);
  }, [
    sourceRef.current,
    positionWrapperRef.current,
    isDragging,
    mousePosition,
    targetId,
    sourceTop,
    sourceLeft,
    jumpToNode,
    nodes,
  ]);

  const onDrag = (e: DragEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const onDragEnd = (e: DragEvent) => {
    setSourceLeft(undefined);
    setSourceTop(undefined);
    setIsDragging(false);

    if (!flowContainer) return;

    const boudingClientRect = flowContainer.getBoundingClientRect();

    const canvasX = (e.clientX - viewX - boudingClientRect.left) / zoom;
    const canvasY = (e.clientY - viewY - boudingClientRect.top) / zoom;

    for (const node of nodes) {
      if (
        !node.width ||
        !node.height ||
        nodeTypesConnectableToJumpTo.includes(node.type)
      )
        continue;

      const halfWidth = node.width / 2;
      const halfHeight = node.height / 2;

      const leftBorderX = node.position.x - halfWidth;
      const rightBorderX = node.position.x + halfWidth;

      const topBorderY = node.position.y - halfHeight;
      const bottomBorderY = node.position.y + halfHeight;

      const isInsideNode =
        canvasX > leftBorderX &&
        canvasX < rightBorderX &&
        canvasY > topBorderY &&
        canvasY < bottomBorderY;

      if (!isInsideNode) continue;

      setTargetId(node.id);
      return;
    }
  };

  const markerUUID = uuid();

  return (
    <div
      className="absolute -translate-x-1/2"
      style={{
        left: sourceLeft === undefined ? "50%" : sourceLeft,
        top: sourceTop === undefined ? "100%" : sourceTop,
      }}
      draggable
      onClick={(e) => {
        e.stopPropagation();
        console.log("click");
      }}
      onDragStart={(e) => {
        console.log("drag start");
        e.dataTransfer.effectAllowed = "move";
        setTargetId(undefined);
        setIsDragging(true);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
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
                <g className="react-flow__edge outline-none nopan">
                  <defs>
                    <marker
                      id={`arrowhead${markerUUID}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX={targetId ? "10" : "0"}
                      refY="3.5"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      {/* <line
                        x1="0"
                        y1="0"
                        x2="10"
                        y2="3.5"
                        style={{
                          stroke: "#4338CA",
                          fill: "#4338CA",
                        }}
                      />
                      <line
                        x1="0"
                        y1="7"
                        x2="10"
                        y2="3.5"
                        style={{
                          stroke: "#4338CA",
                          fill: "#4338CA",
                        }}
                      /> */}
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        style={{
                          stroke: "#4338CA",
                          fill: "#4338CA",
                        }}
                      />
                    </marker>
                  </defs>
                  <path
                    onClick={() => {
                      console.log("PATH CLICK");
                    }}
                    className="react-flow__edge-path"
                    style={{
                      strokeWidth: 1,
                      stroke: "#4338CA",
                      outline: "none",
                    }}
                    d={edgePath}
                    markerEnd={`url(#arrowhead${markerUUID})`}
                  />

                  {/* <path
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("PATH INTERACTION CLICK");
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("PATH MOUSE DOWN");
                    }}
                    onMouseDownCapture={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("PATH MOUSE DOWN CAPTURE");
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("DRAG START");
                    }}
                    onDrag={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("PATH INTERACTION DRAG");
                    }}
                    className="react-flow__edge-interaction cursor-move"
                    style={{
                      strokeWidth: 10,
                      stroke: "transparent",
                      fill: "transparent",
                      outline: "none",
                      pointerEvents: "all",
                    }}
                    d={edgePath}
                  /> */}
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
