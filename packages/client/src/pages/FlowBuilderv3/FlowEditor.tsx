import React, { useCallback } from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  EdgeChange,
  NodeChange,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import { setEdges, setNodes } from "reducers/flow-builder.reducer";
import {
  EmptyNode,
  LoopNode,
  MessageNode,
  StartNode,
  TimeDelayNode,
  TimeWindowNode,
  WaitUntilNode,
} from "./Nodes";

export enum NodeType {
  START = "start",
  EMPTY = "empty",
  MESSAGE = "message",
  LOOP = "loop",
  WAIT_UNTIL = "waitUntil",
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
}

const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.EMPTY]: EmptyNode,
  [NodeType.MESSAGE]: MessageNode,
  [NodeType.LOOP]: LoopNode,
  [NodeType.WAIT_UNTIL]: WaitUntilNode,
  [NodeType.TIME_DELAY]: TimeDelayNode,
  [NodeType.TIME_WINDOW]: TimeWindowNode,
};

const FlowEditor = () => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const onNodesChange = (changes: NodeChange[]) =>
    dispatch(setNodes(applyNodeChanges(changes, nodes)));
  const onEdgesChange = (changes: EdgeChange[]) =>
    dispatch(setEdges(applyEdgeChanges(changes, edges)));

  return (
    <div className="relative w-full h-full bg-[#F3F4F6] text-[#111827]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        fitView
      >
        <Controls showInteractive={false} position="top-left" />
      </ReactFlow>
    </div>
  );
};

export default FlowEditor;
