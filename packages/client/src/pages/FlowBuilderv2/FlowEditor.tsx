import ReactFlow, {
  applyNodeChanges,
  Controls,
  Edge,
  getOutgoers,
  MarkerType,
  Node,
  NodeChange,
  useViewport,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import {
  addInsertNodeBetween,
  handleDrawerAction,
  removeNode,
  setNodes,
  transformEmptyNodeIntoInsertNode,
  transformInsertNodeIntoEmptyNode,
} from "reducers/flow-builder.reducer";
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
import { NodeData } from "./Nodes/NodeData";
import ApiService from "services/api.service";
import { DrawerAction } from "./Drawer/drawer.fixtures";

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
  const drawerActionToNodeTypeMap: Record<DrawerAction, NodeType> = {
    [DrawerAction.CUSTOM_MODAL]: NodeType.MESSAGE,
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
  };

  const { nodes, edges, isDragging, flowId } = useAppSelector(
    (state) => state.flowBuilder
  );

  const dispatch = useAppDispatch();

  const { x: viewX, y: viewY, zoom } = useViewport();

  const onDragOver = (e: DragEvent) => {
    e.stopPropagation();
    if (!isDragging || !flowRef.current || edges.length === 0) return;

    const boudingClientRect = flowRef.current.getBoundingClientRect();

    const canvasMouseX = (e.clientX - viewX - boudingClientRect.left) / zoom;
    const canvasMouseY = (e.clientY - viewY - boudingClientRect.top) / zoom;

    const insertNode = nodes.find((node) => node.type === NodeType.INSERT_NODE);

    if (insertNode && e.dataTransfer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }

    const lengthToInsertNode = insertNode
      ? Math.sqrt(
          (canvasMouseX - insertNode.position.x) *
            (canvasMouseX - insertNode.position.x) +
            (canvasMouseY - insertNode.position.y) *
              (canvasMouseY - insertNode.position.y)
        )
      : Infinity;

    let closestEdge:
      | {
          edge: Edge<EdgeData>;
          lengthToLabel: number;
          nodeA: Node<NodeData>;
          nodeB: Node<NodeData>;
        }
      | undefined;

    for (const edge of edges) {
      if (edge.type !== EdgeType.PRIMARY) continue;

      const nodeA = nodes.find((node) => node.id === edge.source);
      const nodeB = nodes.find((node) => node.id === edge.target);

      if (
        !nodeA?.type ||
        !nodeB?.type ||
        ([NodeType.EMPTY, NodeType.INSERT_NODE] as string[]).includes(
          nodeA.type
        ) ||
        ([NodeType.EMPTY, NodeType.INSERT_NODE] as string[]).includes(
          nodeB.type
        )
      )
        continue;

      const labelX = (nodeA.position.x + nodeB.position.x) / 2;
      const labelY = (nodeA.position.y + nodeB.position.y) / 2;

      const lengthToLabel = Math.sqrt(
        (canvasMouseX - labelX) * (canvasMouseX - labelX) +
          (canvasMouseY - labelY) * (canvasMouseY - labelY)
      );

      if (!closestEdge || lengthToLabel < closestEdge.lengthToLabel)
        closestEdge = { edge, lengthToLabel, nodeA, nodeB };
    }

    let closestEmptyNode: { node: Node<NodeData>; length: number } | undefined;

    for (const node of nodes) {
      if (node.type !== NodeType.EMPTY) continue;

      const length = Math.sqrt(
        (canvasMouseX - node.position.x) * (canvasMouseX - node.position.x) +
          (canvasMouseY - node.position.y) * (canvasMouseY - node.position.y)
      );

      if (!closestEmptyNode || closestEmptyNode.length > length)
        closestEmptyNode = { node, length };
    }

    if (
      closestEmptyNode &&
      (!closestEdge || closestEmptyNode.length < closestEdge.lengthToLabel) &&
      closestEmptyNode.length < lengthToInsertNode
    ) {
      dispatch(transformEmptyNodeIntoInsertNode(closestEmptyNode.node.id));
      return;
    }

    if (!closestEdge || closestEdge.lengthToLabel > lengthToInsertNode) return;

    dispatch(
      addInsertNodeBetween({
        source: closestEdge.nodeA.id,
        target: closestEdge.nodeB.id,
      })
    );
  };

  const onDrop = (e: DragEvent) => {
    const insertNode = nodes.find((node) => node.type === NodeType.INSERT_NODE);
    const action = e.dataTransfer?.getData("action");

    if (
      !insertNode ||
      !action ||
      (action === DrawerAction.EXIT &&
        getOutgoers(insertNode, nodes, edges).length > 0)
    )
      return;

    dispatch(transformInsertNodeIntoEmptyNode(insertNode.id));

    (async () => {
      try {
        const {
          data: { id: stepId },
        } = await ApiService.post({
          url: "/steps",
          options: {
            type: drawerActionToNodeTypeMap[action as DrawerAction],
            journeyID: flowId,
          },
        });

        dispatch(handleDrawerAction({ id: insertNode.id, action, stepId }));
      } catch (err) {
        dispatch(removeNode(insertNode.id));
      }
    })();
  };

  useEffect(() => {
    if (!flowRef.current) return;

    flowRef.current.addEventListener("dragover", onDragOver);
    flowRef.current.addEventListener("drop", onDrop);

    return () => {
      flowRef.current?.removeEventListener("dragover", onDragOver);
      flowRef.current?.removeEventListener("drop", onDrop);
    };
  }, [flowRef.current, isDragging, nodes, edges]);

  return <></>;
};

interface FlowEditorProps {
  isViewMode?: boolean;
  className?: string;
}

const FlowEditor: FC<FlowEditorProps> = ({ className, isViewMode }) => {
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
