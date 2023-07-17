import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";
import { NodeAction } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DrawerAction } from "../Drawer/drawer.fixtures";
import { NodeType } from "../FlowEditor";
import { dragActionsNotToDoBetweenNodes } from "../FlowPlugins/NodeDraggingProvider";

export const PrimaryEdge: FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}) => {
  const { isDragging, nodes, dragAction, isOnboarding } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useAppDispatch();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const targetNode = nodes.find((node) => node.id === target);
  const sourceNode = nodes.find((node) => node.id === source);

  const isTargetEmptyNode = targetNode?.type === NodeType.EMPTY;
  const isSourceEmptyNode = sourceNode?.type === NodeType.EMPTY;
  const isTargetInsertNode = targetNode?.type === NodeType.INSERT_NODE;
  const isSourceInsertNode = sourceNode?.type === NodeType.INSERT_NODE;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {!isTargetEmptyNode &&
        !isSourceEmptyNode &&
        !isTargetInsertNode &&
        !isSourceInsertNode &&
        isDragging &&
        !dragActionsNotToDoBetweenNodes.includes(dragAction?.type) &&
        !isOnboarding && (
          <EdgeLabelRenderer>
            <div
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              }}
              className="absolute pointer-events-auto"
            >
              <button>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="4" y="4" width="8" height="8" fill="white" />
                  <path
                    d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM11 8.375C11 8.44375 10.9438 8.5 10.875 8.5H8.5V10.875C8.5 10.9438 8.44375 11 8.375 11H7.625C7.55625 11 7.5 10.9438 7.5 10.875V8.5H5.125C5.05625 8.5 5 8.44375 5 8.375V7.625C5 7.55625 5.05625 7.5 5.125 7.5H7.5V5.125C7.5 5.05625 7.55625 5 7.625 5H8.375C8.44375 5 8.5 5.05625 8.5 5.125V7.5H10.875C10.9438 7.5 11 7.55625 11 7.625V8.375Z"
                    fill="#6366F1"
                  />
                </svg>
              </button>
            </div>
          </EdgeLabelRenderer>
        )}
    </>
  );
};
