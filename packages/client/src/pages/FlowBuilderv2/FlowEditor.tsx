import ReactFlow, {
  applyNodeChanges,
  Controls,
  EdgeChange,
  EdgeProps,
  MarkerType,
  NodeChange,
  NodeProps,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import { setNodes } from "reducers/flow-builder.reducer";
import {
  EmptyNode,
  ExitNode,
  InsertNode,
  JumpToNode,
  MessageNode,
  StartNode,
  TimeDelayNode,
  TimeWindowNode,
  TrackerNode,
  UserAttributeNode,
  WaitUntilNode,
} from "./Nodes";
import FlowBuilderSidePanel from "./SidePanel/FlowBuilderSidePanel";
import { BranchEdge, PrimaryEdge } from "./Edges";
import { FC, useRef } from "react";
import NodeDraggingProvider from "./FlowPlugins/NodeDraggingProvider";

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
  INSERT_NODE = "insertNode",
  TRACKER = "tracker",
}

export enum EdgeType {
  PRIMARY = "primary",
  BRANCH = "branch",
}

const nodeTypes: Record<NodeType, FC<NodeProps<any>>> = {
  [NodeType.START]: StartNode,
  [NodeType.EMPTY]: EmptyNode,
  [NodeType.MESSAGE]: MessageNode,
  [NodeType.JUMP_TO]: JumpToNode,
  [NodeType.EXIT]: ExitNode,
  [NodeType.WAIT_UNTIL]: WaitUntilNode,
  [NodeType.TIME_DELAY]: TimeDelayNode,
  [NodeType.TIME_WINDOW]: TimeWindowNode,
  [NodeType.USER_ATTRIBUTE]: UserAttributeNode,
  [NodeType.INSERT_NODE]: InsertNode,
  [NodeType.TRACKER]: TrackerNode,
};

const edgeTypes: Record<EdgeType, FC<EdgeProps<any>>> = {
  [EdgeType.PRIMARY]: PrimaryEdge,
  [EdgeType.BRANCH]: BranchEdge,
};

interface FlowEditorProps {
  isViewMode?: boolean;
  className?: string;
}

const FlowEditor: FC<FlowEditorProps> = ({ className, isViewMode }) => {
  const { nodes, edges, stepperIndex, isOnboarding } = useAppSelector(
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

  const onEdgesChange = (changes: EdgeChange[]) => {
    console.log(changes);

    // dispatch(setEdges(applyEdgeChanges(changes, edges)));
  };

  const flowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative w-full h-full bg-[#F3F4F6] text-[#111827] flex ${
        className ? className : ""
      }`}
    >
      <ReactFlow
        nodes={
          isViewMode
            ? nodes.filter((node) => node.type !== NodeType.EMPTY)
            : nodes
        }
        edges={edges}
        onInit={(ev) => {
          ev.fitView();
          ev.zoomTo(0.8);

          if (isViewMode && stepperIndex !== 2) {
            const { x, y } = ev.getViewport();
            ev.setViewport({ x: x - 200, y, zoom: 0.8 });
          }
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnScroll
        selectionOnDrag
        nodeOrigin={[0.5, 0.5]}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.Arrow,
            color: "#111827",
            strokeWidth: 2,
          },
          style: {
            stroke: "#111827",
          },
        }}
        ref={flowRef}
      >
        <NodeDraggingProvider flowRef={flowRef} />
        <Controls
          showInteractive={false}
          position="top-left"
          className="rounded-[2px]"
        />
      </ReactFlow>
      {!isViewMode && !isOnboarding && stepperIndex === 0 && (
        <FlowBuilderSidePanel />
      )}
    </div>
  );
};

export default FlowEditor;
