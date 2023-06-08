import ReactFlow, {
  applyNodeChanges,
  Controls,
  MarkerType,
  NodeChange,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import { setNodes } from "reducers/flow-builder.reducer";
import {
  EmptyNode,
  JumpToNode,
  MessageNode,
  StartNode,
  TimeDelayNode,
  TimeWindowNode,
  WaitUntilNode,
} from "./Nodes";
import FlowBuilderSidePanel from "./SidePanel/FlowBuilderSidePanel";
import { BranchEdge, PrimaryEdge } from "./Edges";
import { ExitNode } from "./Nodes/ExitNode";
import { UserAttributeNode } from "./Nodes/UserAttributeNode";
import { FC } from "react";

export enum NodeType {
  START = "start",
  EMPTY = "empty",
  MESSAGE = "message",
  JUMP_TO = "jumpTo",
  EXIT = "exit",
  WAIT_UNTIL = "waitUntil",
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
  USER_ATTRIBUTE = "userAttribute",
}

export enum EdgeType {
  PRIMARY = "primary",
  BRANCH = "branch",
}

const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.EMPTY]: EmptyNode,
  [NodeType.MESSAGE]: MessageNode,
  [NodeType.JUMP_TO]: JumpToNode,
  [NodeType.EXIT]: ExitNode,
  [NodeType.WAIT_UNTIL]: WaitUntilNode,
  [NodeType.TIME_DELAY]: TimeDelayNode,
  [NodeType.TIME_WINDOW]: TimeWindowNode,
  [NodeType.USER_ATTRIBUTE]: UserAttributeNode,
};

const edgeTypes = {
  [EdgeType.PRIMARY]: PrimaryEdge,
  [EdgeType.BRANCH]: BranchEdge,
};

interface FlowEditorProps {
  className?: string;
}

const FlowEditor: FC<FlowEditorProps> = ({ className }) => {
  const { nodes, edges, stepperIndex } = useAppSelector(
    (state) => state.flowBuilder
  );

  const dispatch = useAppDispatch();

  const onNodesChange = (changes: NodeChange[]) => {
    changes = changes.filter(
      (change) =>
        change.type === "select" &&
        nodes.find((node) => node.id === change.id)?.type !== NodeType.EMPTY
    );

    dispatch(setNodes(applyNodeChanges(changes, nodes)));
  };

  // const onEdgesChange = (changes: EdgeChange[]) => {
  //   changes = changes.filter((change) => change.type === "select");
  //   dispatch(setEdges(applyEdgeChanges(changes, edges)));
  // };

  return (
    <div
      className={`relative w-full h-full bg-[#F3F4F6] text-[#111827] flex ${
        className ? className : ""
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(ev) => {
          ev.fitView();
          ev.zoomTo(0.8);
        }}
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnScroll
        selectionOnDrag
        nodeOrigin={[0.5, 0.5]}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.Arrow },
        }}
      >
        <Controls
          showInteractive={false}
          position="top-left"
          className="rounded-[2px]"
        />
      </ReactFlow>
      {stepperIndex === 0 && <FlowBuilderSidePanel />}
    </div>
  );
};

export default FlowEditor;
