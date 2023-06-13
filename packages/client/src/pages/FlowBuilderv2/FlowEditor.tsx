import ReactFlow, {
  applyNodeChanges,
  Controls,
  Edge,
  MarkerType,
  NodeChange,
  useViewport,
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
  UserAttributeNode,
  WaitUntilNode,
} from "./Nodes";
import FlowBuilderSidePanel from "./SidePanel/FlowBuilderSidePanel";
import { BranchEdge, PrimaryEdge } from "./Edges";
import { FC, RefObject, useEffect, useRef } from "react";
import { EdgeData } from "./Edges/EdgeData";

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
  [NodeType.INSERT_NODE]: InsertNode,
};

const edgeTypes = {
  [EdgeType.PRIMARY]: PrimaryEdge,
  [EdgeType.BRANCH]: BranchEdge,
};

interface NodeDraggingProviderProps {
  flowRef: RefObject<HTMLDivElement>;
}

const NodeDraggingProvider: FC<NodeDraggingProviderProps> = ({ flowRef }) => {
  const { nodes, edges, isDragging } = useAppSelector(
    (state) => state.flowBuilder
  );

  const { x: viewX, y: viewY, zoom } = useViewport();

  const onDragOver = (e: DragEvent) => {
    if (!isDragging || !flowRef.current || edges.length === 0) return;

    const boudingClientRect = flowRef.current.getBoundingClientRect();

    const canvasMouseX = (e.clientX - viewX - boudingClientRect.left) / zoom;
    const canvasMouseY = (e.clientY - viewY - boudingClientRect.top) / zoom;

    let closestEdge:
      | {
          edge: Edge<EdgeData>;
          lengthToLabel: number;
        }
      | undefined;

    for (const edge of edges) {
      if (edge.type !== EdgeType.PRIMARY) continue;

      const nodeA = nodes.find((node) => node.id === edge.source);
      const nodeB = nodes.find((node) => node.id === edge.target);

      if (!nodeA || !nodeB) continue;

      const labelX = (nodeA.position.x + nodeB.position.x) / 2;
      const labelY = (nodeA.position.y + nodeB.position.y) / 2;

      const lengthToLabel = Math.sqrt(
        (canvasMouseX - labelX) * (canvasMouseX - labelX) +
          (canvasMouseY - labelY) * (canvasMouseY - labelY)
      );

      if (!closestEdge || lengthToLabel < closestEdge.lengthToLabel)
        closestEdge = { edge, lengthToLabel };
    }

    if (!closestEdge) return;

    // TODO: handle closest edge
  };

  useEffect(() => {
    if (!flowRef.current) return;

    flowRef.current.addEventListener("dragover", onDragOver);

    return () => {
      flowRef.current?.removeEventListener("dragover", onDragOver);
    };
  }, [flowRef.current, isDragging, nodes, edges]);

  return <></>;
};

interface FlowEditorProps {
  isViewMode?: boolean;
  className?: string;
}

const FlowEditor: FC<FlowEditorProps> = ({ className, isViewMode }) => {
  const { nodes, edges, stepperIndex, isDragging } = useAppSelector(
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

  const flowRef = useRef<HTMLDivElement>(null);

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
        ref={flowRef}
      >
        <NodeDraggingProvider flowRef={flowRef} />
        <Controls
          showInteractive={false}
          position="top-left"
          className="rounded-[2px]"
        />
      </ReactFlow>
      {!isViewMode && stepperIndex === 0 && <FlowBuilderSidePanel />}
    </div>
  );
};

export default FlowEditor;
