import React, { FC, useState } from "react";
import { Handle, NodeProps, Position, getOutgoers } from "reactflow";
import { handleDrawerAction } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DrawerAction } from "../Drawer/drawer.fixtures";
import { NodeType } from "../FlowEditor";
import { NodeData } from "./NodeData";

export const EmptyNode: FC<NodeProps<NodeData>> = ({
  isConnectable,
  id,
  data: { disabled },
}) => {
  const drawerActionToNodeTypeMap: Record<DrawerAction, NodeType> = {
    [DrawerAction.CUSTOM_MODAL]: NodeType.MESSAGE,
    [DrawerAction.TRACKER]: NodeType.MESSAGE,
    [DrawerAction.EMAIL]: NodeType.MESSAGE,
    [DrawerAction.EXIT]: NodeType.EXIT,
    [DrawerAction.JUMP_TO]: NodeType.JUMP_TO,
    [DrawerAction.PUSH]: NodeType.MESSAGE,
    [DrawerAction.SLACK]: NodeType.MESSAGE,
    [DrawerAction.SMS]: NodeType.MESSAGE,
    [DrawerAction.TIME_DELAY]: NodeType.TIME_DELAY,
    [DrawerAction.TIME_WINDOW]: NodeType.TIME_WINDOW,
    [DrawerAction.USER_ATTRIBUTE]: NodeType.USER_ATTRIBUTE,
    [DrawerAction.WAIT_UNTIL]: NodeType.WAIT_UNTIL,
    [DrawerAction.WEBHOOK]: NodeType.MESSAGE,
    [DrawerAction.MULTISPLIT]: NodeType.MESSAGE,
    [DrawerAction.EXPERIMENT]: NodeType.EXPERIMENT,
  };

  const { nodes, edges, flowId } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const isTargetForStart = edges.some(
    (edge) =>
      edge.target === id &&
      nodes.find((node) => node.id === edge.source)?.type === NodeType.START
  );

  const thisNode = nodes.find((node) => node.id === id);
  const outgoers = thisNode ? getOutgoers(thisNode, nodes, edges) : [];

  return (
    <div
      className={`empty-node w-[260px] h-[80px] rounded-lg bg-[#F3F4F6] border-2 border-dashed border-[#9CA3AF] flex justify-center items-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${isDraggedOver ? "!border-[#6366F1] !bg-[#E0E7FF]" : ""}${
        outgoers.length === 0 ? " last-empty-node" : ""
      }`}
      onDragOver={(e) => {
        console.log("dragover", e);
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        console.log("dragover", "setting dropEffect to move");
      }}
      onDragEnter={() => setIsDraggedOver(true)}
      onDragLeave={() => setIsDraggedOver(false)}
      onDrop={async (e) => {
        const action = e.dataTransfer?.getData("action");

        const {
          data: { id: stepId },
        } = await ApiService.post({
          url: "/steps",
          options: {
            type: drawerActionToNodeTypeMap[action as DrawerAction],
            journeyID: flowId,
          },
        });

        dispatch(handleDrawerAction({ id, action, stepId }));
        setIsDraggedOver(false);
      }}
      data-testid="empty-node"
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
