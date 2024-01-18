import React, { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Node,
} from "reactflow";
import { useAppSelector } from "store/hooks";
import { NodeType } from "../FlowEditor";
import {
  Branch,
  BranchType,
  MultisplitBranch,
  UserAttributeNodeData,
  WaitUntilNodeData,
} from "../Nodes/NodeData";
import { BranchEdgeData } from "./EdgeData";
import BranchPopover from "./components/BranchPopover";

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
    !(
      sourceNode.type === NodeType.WAIT_UNTIL ||
      sourceNode.type === NodeType.USER_ATTRIBUTE ||
      sourceNode.type === NodeType.MULTISPLIT ||
      sourceNode.type === NodeType.EXPERIMENT
    ) ||
    !(
      sourceNode.data.type === NodeType.WAIT_UNTIL ||
      sourceNode.data.type === NodeType.USER_ATTRIBUTE ||
      sourceNode.data.type === NodeType.MULTISPLIT ||
      sourceNode.data.type === NodeType.EXPERIMENT
    ) ||
    !data?.branch
  )
    return <></>;

  const { branch } = data;

  const branchIndex = (sourceNode.data.branches as Branch[]).findIndex(
    (b) => b.id === branch.id
  );

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {sourceNode.data.branches.length > 1 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translateX(${
                targetX -
                ((branch as MultisplitBranch)?.isOthers
                  ? 36
                  : branch.type === BranchType.EXPERIMENT
                  ? 50
                  : 100)
              }px) translateY(${labelY + 10}px)`,
              pointerEvents: "all",
            }}
          >
            <BranchPopover
              branch={branch}
              node={
                sourceNode as Node<WaitUntilNodeData | UserAttributeNodeData>
              }
            >
              <span className="bg-[#F3F4F6] flex gap-[5px] items-center py-2 px-1 leading-[22px] text-[14px] text-[#111827] border-b-[1px] border-b-black">
                {branch.type === BranchType.MAX_TIME && (
                  <span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 2.1875C4.79063 2.1875 2.1875 4.79063 2.1875 8C2.1875 11.2094 4.79063 13.8125 8 13.8125C11.2094 13.8125 13.8125 11.2094 13.8125 8C13.8125 4.79063 11.2094 2.1875 8 2.1875ZM10.7578 10.1516L10.3109 10.7609C10.3012 10.7742 10.289 10.7854 10.2749 10.7939C10.2608 10.8025 10.2452 10.8081 10.229 10.8106C10.2127 10.8131 10.1961 10.8123 10.1801 10.8083C10.1642 10.8044 10.1492 10.7973 10.1359 10.7875L7.55156 8.90312C7.53546 8.89156 7.52238 8.8763 7.5134 8.85863C7.50443 8.84095 7.49983 8.82138 7.5 8.80156V4.5C7.5 4.43125 7.55625 4.375 7.625 4.375H8.37656C8.44531 4.375 8.50156 4.43125 8.50156 4.5V8.36719L10.7297 9.97812C10.7859 10.0172 10.7984 10.0953 10.7578 10.1516Z"
                        fill="#F3F4F6"
                      />
                      <path
                        d="M8 1C4.13437 1 1 4.13437 1 8C1 11.8656 4.13437 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13437 11.8656 1 8 1ZM8 13.8125C4.79063 13.8125 2.1875 11.2094 2.1875 8C2.1875 4.79063 4.79063 2.1875 8 2.1875C11.2094 2.1875 13.8125 4.79063 13.8125 8C13.8125 11.2094 11.2094 13.8125 8 13.8125Z"
                        fill="#111827"
                      />
                      <path
                        d="M10.7297 9.97811L8.50156 8.36718V4.5C8.50156 4.43125 8.44531 4.375 8.37656 4.375H7.625C7.55625 4.375 7.5 4.43125 7.5 4.5V8.80155C7.5 8.84218 7.51875 8.87968 7.55156 8.90312L10.1359 10.7875C10.1922 10.8281 10.2703 10.8172 10.3109 10.7609L10.7578 10.1516C10.7984 10.0953 10.7859 10.0172 10.7297 9.97811Z"
                        fill="#111827"
                      />
                    </svg>
                  </span>
                )}

                {!(branch as MultisplitBranch)?.isOthers && (
                  <span className="font-semibold">
                    <span>Branch {branchIndex + 1}: </span>
                  </span>
                )}
                {branch.type === BranchType.EVENT ||
                branch.type === BranchType.MESSAGE ? (
                  branch.conditions.length === 0 ? (
                    <span className="text-[#E11D48]">Has no conditions</span>
                  ) : (
                    `Meet ${branch.conditions.length} conditions`
                  )
                ) : branch.type === BranchType.ATTRIBUTE ? (
                  branch.attributeConditions.length === 0 ? (
                    <span className="text-[#E11D48]">Has no conditions</span>
                  ) : (
                    `Meet ${branch.attributeConditions.length} conditions`
                  )
                ) : branch.type === BranchType.MULTISPLIT ? (
                  branch.isOthers ? (
                    "All others"
                  ) : branch.conditions?.query.statements.length === 0 ||
                    branch.conditions === undefined ? (
                    <span className="text-[#E11D48]">Has no conditions</span>
                  ) : (
                    `Meet ${branch.conditions.query.statements.length} conditions`
                  )
                ) : branch.type === BranchType.EXPERIMENT ? (
                  <>{(branch.ratio * 100).toFixed()} %</>
                ) : (
                  <>Wait max time</>
                )}
              </span>
            </BranchPopover>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
