import React, { DragEvent, FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getBezierPath, Position, useViewport, useNodes } from "reactflow";
import {
  getSmartEdge,
  pathfindingAStarNoDiagonal,
  svgDrawSmoothLinePath,
} from "@tisoap/react-flow-smart-edge";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { v4 as uuid } from "uuid";
import { useAppDispatch } from "store/hooks";
import { selectNode } from "reducers/flow-builder.reducer";

interface JumpToLineProps {
  jumpToNodeId: string;
  targetId?: string;
  setTargetId: (targetId?: string) => void;
}

const JumpToLine: FC<JumpToLineProps> = ({
  jumpToNodeId,
  targetId,
  setTargetId,
}) => {
  const dispatch = useAppDispatch();

  const nodes = useNodes();

  const jumpToNode = nodes.find((node) => node.id === jumpToNodeId);

  const sourceRef = useRef<HTMLDivElement>(null);
  const positionWrapperRef = useRef<HTMLDivElement>(null);

  const { x: viewX, y: viewY, zoom } = useViewport();

  const [edgePath, setEdgePath] = useState<string>();
  const [sourceTop, setSourceTop] = useState<number>();
  const [sourceLeft, setSourceLeft] = useState<number>();
  const [isHovered, setIsHovered] = useState(false);

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

    if (targetId && jumpToNode && jumpToNode.width && jumpToNode.height) {
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

    const dumbPathFunction = getBezierPath;

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
    targetId,
    sourceTop,
    sourceLeft,
    jumpToNode,
    nodes,
  ]);

  const markerUUID = uuid();

  const isActive = Boolean(jumpToNode?.selected) || isHovered;

  const currentColor = isActive ? "#4338CA" : "#111827";

  return (
    <>
      {targetId && (
        <div
          className="absolute -translate-x-1/2"
          style={{
            left: sourceLeft === undefined ? "50%" : sourceLeft,
            top: sourceTop === undefined ? "100%" : sourceTop,
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log("click");
            dispatch(selectNode(jumpToNodeId));
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseDownCapture={(e) => e.stopPropagation()}
        >
          <div
            ref={sourceRef}
            className="relative rounded-[100%] w-[10px] h-[10px] -translate-y-2/3"
            style={{
              background: currentColor,
            }}
          >
            {edgesContainer &&
              createPortal(
                <>
                  {edgePath && (
                    <g className="react-flow__edge outline-none nopan">
                      <defs>
                        <marker
                          id={`arrowhead${markerUUID}`}
                          markerWidth="20"
                          markerHeight="14"
                          refX={targetId ? "3.5" : "0"}
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
                          <path
                            d="M 3.5 3.5 L 0 7 L 3.5 3.5 L 0 0 Z"
                            style={{
                              stroke: currentColor,
                              fill: currentColor,
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
                          strokeWidth: 3,
                          stroke: currentColor,
                          outline: "none",
                          strokeDasharray: "4 4",
                          strokeLinecap: "round",
                          animation: "dash 1s linear infinite",
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
      )}
    </>
  );
};

export default JumpToLine;
