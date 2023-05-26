import React, { FC, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { handleDrawerAction, removeNode } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { NodeType } from "../FlowEditor";
import { NodeData } from "./NodeData";

export const EmptyNode: FC<NodeProps<NodeData>> = ({
  isConnectable,
  id,
  data: { temporary },
}) => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const isTargetForStart = edges.some(
    (edge) =>
      edge.target === id &&
      nodes.find((node) => node.id === edge.source)?.type === NodeType.START
  );

  return (
    <div
      className={`w-[260px] h-[80px] rounded-[8px] bg-[#F3F4F6] border-[2px] border-dashed border-[#9CA3AF] flex justify-center items-center ${
        isDraggedOver ? "!border-[#6366F1] !bg-[#E0E7FF]" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={() => setIsDraggedOver(true)}
      onDragLeave={() => {
        setIsDraggedOver(false);
        if (temporary) dispatch(removeNode(id));
      }}
      onDrop={(e) => {
        dispatch(
          handleDrawerAction({ id, action: e.dataTransfer.getData("action") })
        );
        setIsDraggedOver(false);
      }}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[1px] !opacity-0 !border-0 pointer-events-none cursor-default"
      />
      {!isDraggedOver && (
        <div>
          {isTargetForStart ? "Drag a component to start" : "Next step"}
        </div>
      )}
      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
    </div>
  );
};
