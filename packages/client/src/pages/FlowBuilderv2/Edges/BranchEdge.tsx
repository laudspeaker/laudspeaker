import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getIncomers,
  getSmoothStepPath,
} from "reactflow";
import { selectNode } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { NodeType } from "../FlowEditor";
import { BranchType } from "../Nodes/NodeData";
import { BranchEdgeData } from "./EdgeData";

export const BranchEdge: FC<EdgeProps<BranchEdgeData>> = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
  data,
  source,
}) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceNode = nodes.find((node) => node.id === source);

  if (
    !sourceNode ||
    sourceNode.type !== NodeType.WAIT_UNTIL ||
    sourceNode.data.type !== NodeType.WAIT_UNTIL ||
    !data?.branch
  )
    return <></>;

  const { branch } = data;

  const branchIndex = sourceNode.data.branches.indexOf(branch);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(${targetX - 100}px,${labelY + 20}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan "
          onClick={() => sourceNode && dispatch(selectNode(sourceNode.id))}
        >
          <span className="bg-[#F3F4F6] block py-[8px] px-[4px] leading-[22px] text-[14px] text-[#111827] border-b-[1px] border-b-black">
            <span className="font-semibold">Branch {branchIndex + 1}: </span>
            {branch.type === BranchType.EVENT ? (
              branch.conditions.length === 0 ? (
                <span className="text-red-500">Has no conditions</span>
              ) : (
                `Meet ${branch.conditions.length} conditions`
              )
            ) : (
              <></>
            )}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
