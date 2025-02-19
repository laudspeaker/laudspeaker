import ReactFlow, {
  applyNodeChanges,
  ControlButton,
  Controls,
  Edge,
  EdgeChange,
  EdgeProps,
  MarkerType,
  Node,
  NodeChange,
  NodeProps,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
} from "reactflow";
import { useAppDispatch, useAppSelector } from "store/hooks";
import "reactflow/dist/style.css";
import {
  addInsertNodeBetween,
  changeNodeData,
  clearInsertNodes,
  ConnectionStatus,
  deselectNodes,
  handleDevModeState,
  moveNodeToNewPosition,
  NodeAction,
  recountAvailableNodes,
  resetDevMode,
  setDragAction,
  setIsDragging,
  setJumpToTargettingNode,
  setNodes,
  transformEmptyNodeIntoInsertNode,
  setIsMoving,
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
  TrackerNode,
  UserAttributeNode,
  WaitUntilNode,
} from "./Nodes";
import FlowBuilderSidePanel from "./SidePanel/FlowBuilderSidePanel";
import { BranchEdge, PrimaryEdge } from "./Edges";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import NodeDraggingProvider, {
  dragActionsNotToDoBetweenNodes,
} from "./FlowPlugins/NodeDraggingProvider";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { JumpToNodeData, NodeData } from "./Nodes/NodeData";
import { DevModeControlHint } from "./DevModeControlHint";
import useDevKeysHandler from "./useDevKeysHandler";
import { useDevSocket } from "./useDevSocketConnection";
import { MultisplitNode } from "./Nodes/MultisplitNode";
import { ExperimentNode } from "./Nodes/ExperimentNode";
import { DrawerAction } from "./Drawer/drawer.fixtures";
import { EdgeData } from "./Edges/EdgeData";
import MouseTracker from "./MouseTacker";
import { v4 as uuid } from "uuid";

export enum NodeType {
  START = "start",
  EMPTY = "empty",
  MESSAGE = "message",
  JUMP_TO = "jumpTo",
  EXIT = "exit",
  WAIT_UNTIL = "waitUntil",
  TIME_DELAY = "timeDelay",
  PUSH = "push",
  TIME_WINDOW = "timeWindow",
  USER_ATTRIBUTE = "userAttribute",
  INSERT_NODE = "insertNode",
  TRACKER = "tracker",
  MULTISPLIT = "multisplit",
  EXPERIMENT = "experiment",
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
  [NodeType.MULTISPLIT]: MultisplitNode,
  [NodeType.PUSH]: MessageNode,
  [NodeType.EXPERIMENT]: ExperimentNode,
};

const edgeTypes: Record<EdgeType, FC<EdgeProps<any>>> = {
  [EdgeType.PRIMARY]: PrimaryEdge,
  [EdgeType.BRANCH]: BranchEdge,
};

interface FlowEditorProps {
  isViewMode?: boolean;
  className?: string;
  onMove?: () => void;
  onMoveEnd?: () => void;
}

export const nodeTypesNotConnectableByJumpTo: (string | undefined)[] = [
  NodeType.EMPTY,
  NodeType.INSERT_NODE,
  NodeType.JUMP_TO,
  NodeType.START,
];

const MAXIMUM_INSERT_RADIUS = 130;

const FlowEditor: FC<FlowEditorProps> = ({
  className,
  isViewMode,
  onMove = () => {},
  onMoveEnd = () => {},
}) => {
  const reactFlowInstance = useReactFlow();
  const {
    nodes,
    edges,
    stepperIndex,
    isOnboarding,
    jumpToTargettingNode,
    devModeState,
    isDragging,
    dragAction,
    isMoving,
  } = useAppSelector((state) => state.flowBuilder);
  useDevKeysHandler();
  const socket = useDevSocket();
  const dispatch = useAppDispatch();
  const [isSelectionAvailable, setIsSelectionAvailable] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [isCustomDragging, setIsCustomDragging] = useState(false);
  const [stateChanges, setStateChanges] = useState({ x: 0, y: 0 });
  // const [changes, setChanges] = useState<NodeChange[]>([]);
  // const [nodes, setNodesState, onNodesChangeState] =
  //   useNodesState(initialNodes);
  const [setEdges] = useEdgesState(edges);
  const flowRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   setNodesState(initialNodes);
  // }, [initialNodes]);

  const { x: viewX, y: viewY, zoom } = useViewport();
  const { project } = useReactFlow();

  // const onDragOver = (x: number, y: number, movingNode: any) => {
  //   // console.log("onDragOveronDragOver", x, y, isDragging);
  //   // e.stopPropagation();
  //   // if (!isDragging || !flowRef.current || edges.length === 0) return;

  //   // const boudingClientRect = flowRef.current.getBoundingClientRect();

  //   // const canvasMouseX = (x - viewX - boudingClientRect.left) / zoom;
  //   // const canvasMouseY = (y - viewY - boudingClientRect.top) / zoom;

  //   // const insertNode = nodes.find((node) => node.id === movingNode.id);
  //   // console.log(insertNode, "insertNode");
  //   // if (insertNode && e.dataTransfer) {
  //   //   e.preventDefault();
  //   //   e.dataTransfer.dropEffect = "move";
  //   // }

  //   // let lengthToInsertNode = insertNode
  //   //   ? Math.sqrt(
  //   //       (canvasMouseX - insertNode.position.x) *
  //   //         (canvasMouseX - insertNode.position.x) +
  //   //         (canvasMouseY - insertNode.position.y) *
  //   //           (canvasMouseY - insertNode.position.y)
  //   //     ) - 750
  //   //   : Infinity;

  //   // if (lengthToInsertNode > MAXIMUM_INSERT_RADIUS) {
  //   //   dispatch(clearInsertNodes());
  //   //   lengthToInsertNode = Infinity;
  //   // }

  //   let closestEdge:
  //     | {
  //         edge: Edge<EdgeData>;
  //         lengthToLabel: number;
  //         nodeA: Node<NodeData>;
  //         nodeB: Node<NodeData>;
  //       }
  //     | undefined;

  //   if (
  //     !dragActionsNotToDoBetweenNodes.includes(dragAction?.type) &&
  //     !isOnboarding
  //   ) {
  //     for (const edge of edges) {
  //       console.log(edge.type, "edge.type");
  //       if (edge.type !== EdgeType.PRIMARY) continue;

  //       const nodeA = nodes.find((node) => node.id === edge.source);
  //       const nodeB = nodes.find((node) => node.id === edge.target);
  //       console.log(nodeA, "nodeA", nodeB);
  //       if (
  //         !nodeA?.type ||
  //         !nodeB?.type ||
  //         ([NodeType.EMPTY, NodeType.INSERT_NODE] as string[]).includes(
  //           nodeA.type
  //         ) ||
  //         ([NodeType.EMPTY, NodeType.INSERT_NODE] as string[]).includes(
  //           nodeB.type
  //         )
  //       )
  //         continue;

  //       if (!nodeA || !nodeB) continue;

  //       const labelX = (nodeA.position.x + nodeB.position.x) / 2;
  //       const labelY = (nodeA.position.y + nodeB.position.y) / 2;

  //       const lengthToLabel = Math.sqrt(
  //         (canvasMouseX - labelX) * (canvasMouseX - labelX) +
  //           (canvasMouseY - labelY) * (canvasMouseY - labelY)
  //       );
  //       console.log(lengthToLabel, "lengthToLabel");
  //       // if (lengthToLabel > 50) continue;

  //       console.log(closestEdge, "closestEdge");

  //       if (!closestEdge || lengthToLabel < closestEdge.lengthToLabel)
  //         closestEdge = { edge, lengthToLabel, nodeA, nodeB };
  //     }
  //   }

  //   let closestEmptyNode: { node: Node<NodeData>; length: number } | undefined;

  //   for (const node of nodes) {
  //     console.log(node.type, "node.type");
  //     if (node.type !== NodeType.EMPTY) continue;

  //     const length = Math.sqrt(
  //       (canvasMouseX - node.position.x) * (canvasMouseX - node.position.x) +
  //         (canvasMouseY - node.position.y) * (canvasMouseY - node.position.y)
  //     );

  //     if (length > MAXIMUM_INSERT_RADIUS) continue;

  //     if (!closestEmptyNode || closestEmptyNode.length > length)
  //       closestEmptyNode = { node, length };
  //   }
  //   console.log(
  //     closestEmptyNode,
  //     closestEdge,
  //     lengthToInsertNode,
  //     "closestEmptyNode"
  //   );
  //   if (
  //     closestEmptyNode &&
  //     (!closestEdge ||
  //       closestEmptyNode.length < closestEdge.lengthToLabel - 750)
  //     // &&
  //     // closestEmptyNode.length < lengthToInsertNode
  //   ) {
  //     dispatch(transformEmptyNodeIntoInsertNode(closestEmptyNode.node.id));
  //     return;
  //   }
  //   if (!closestEdge) return;

  //   console.log(
  //     closestEdge.lengthToLabel > lengthToInsertNode,
  //     "closestEdge.lengthToLabel > lengthToInsertNode"
  //   );
  //   if (!closestEdge) return;
  //   console.log("Dispatching insert node");
  //   dispatch(
  //     addInsertNodeBetween({
  //       source: closestEdge.nodeA.id,
  //       target: closestEdge.nodeB.id,
  //     })
  //   );
  // };

  const onDragFinish = (x: number, y: number, movingNode: any) => {
    // if (!isCustomDragging) return;
    const position = project({
      x,
      y,
    });
    console.log(
      nodes[1],
      "nodes[1]",
      nodes.length,
      nodes[2],
      nodes[3],
      movingNode
    );
    const insertNode = nodes.find((node) => node.type === NodeType.INSERT_NODE);
    // if (!insertNode) {
    dispatch(
      addInsertNodeBetween({
        source: nodes[1]?.id,
        target: nodes[2]?.id,
        //  source: closestEdge.nodeA.id,
        //  target: closestEdge.nodeB.id,
      })
    );
    // }

    dispatch(
      moveNodeToNewPosition({
        nodeId: nodes[3]?.id,
      })
    );
  };

  const onNodesChange = (changes: NodeChange[]) => {
    console.log("onNodesChange", changes);
    if (changes[0]?.type === "position" && changes[0]?.position) {
      setStateChanges(changes[0]?.position);
    }
    const handleDragAndDrop = (ch: NodeChange[]) => {
      //implement a function to drag and drop the element and change its position while dragging
      // by following the mouse position and taking 'position' in an array element and applying it to the node

      const updatedNodes = nodes.map((node) => {
        const change = ch.find((c) => "id" in c && c.id === node.id);
        if (change && change.type === "position" && change.dragging) {
          if (change.position) {
            return {
              ...node,
              position: change.position,
            };
          }
        }
        return node;
      });

      // dispatch(setNodes(applyNodeChanges(changes, updatedNodes)));
    };

    if (
      changes.find((change) => change.type === "position" && change.dragging)
    ) {
      setIsCustomDragging(true);
      dispatch(setIsMoving(true));
      dispatch(setIsDragging(true));
      dispatch(setDragAction({ type: DrawerAction.EMAIL }));
      changes.map((change) => {
        if (change.type === "position" && change.dragging && change.position) {
          onDragFinish(change.position?.x, change.position?.y, changes[0]);
        }
      });

      // handleDragAndDrop(changes);
    } else {
      setIsCustomDragging(false);
      dispatch(setIsDragging(false));
      dispatch(setIsMoving(false));
    }

    if (devModeState.status === ConnectionStatus.Connected) {
      changes = changes.filter((change) => change.type !== "select");
    } else {
      changes = changes.filter(
        (change) =>
          change.type === "select" &&
          nodes.find((node) => node.id === change.id)?.type !== NodeType.EMPTY
      );
    }

    // if (isSelecting) return;
    // dispatch(setNodes(applyNodeChanges(changes, nodes)));
  };

  const handleStopSelecting = (e: any) => {
    // console.log(e, "e");
    setIsSelecting(false);
    // onNodesChange(changes);
  };

  const handleDevModeDBClick = (node: Node<any, string | undefined>) => {
    if (
      devModeState.status !== ConnectionStatus.Connected ||
      node.type === NodeType.START ||
      node.type === NodeType.EMPTY
    )
      return;

    dispatch(
      setNodes(
        applyNodeChanges(
          [
            {
              id: node.id,
              selected: true,
              type: "select",
            },
          ],
          nodes
        )
      )
    );
  };

  const handleDevModeClick = (node: Node<any, string | undefined>) => {
    if (devModeState.status !== ConnectionStatus.Connected) return;

    if (!devModeState.availableNodeToJump?.includes(node.id)) return;

    socket?.emit("moveToNode", node.id);
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    console.log(changes, "CHANGES");
    // dispatch(setEdges(applyEdgeChanges(changes, edges)));
  };

  const selectedNode = nodes.find((node) => node?.selected);

  useEffect(() => {
    if (!jumpToTargettingNode || !selectedNode) return;

    if (
      selectedNode.id === jumpToTargettingNode ||
      nodeTypesNotConnectableByJumpTo.includes(selectedNode.type)
    ) {
      dispatch(deselectNodes());
      return;
    }

    dispatch(
      changeNodeData({
        id: jumpToTargettingNode,
        data: {
          type: NodeType.JUMP_TO,
          targetId: selectedNode.id,
          stepId: nodes.find((node) => node.id === jumpToTargettingNode)?.data
            .stepId,
        } as JumpToNodeData,
      })
    );
    dispatch(setJumpToTargettingNode(undefined));
  }, [selectedNode, jumpToTargettingNode]);

  useEffect(() => {
    dispatch(recountAvailableNodes());
  }, [nodes]);

  useEffect(() => {
    dispatch(resetDevMode());

    return () => {
      dispatch(resetDevMode());
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full bg-[#F3F4F6] text-[#111827] flex flex-col ${
        className ? className : ""
      }`}
    >
      {jumpToTargettingNode && (
        <div className="w-full px-[16px] py-[10px] bg-[#6366F1] rounded-sm flex justify-center items-center gap-5 text-white font-inter text-[16px] font-semibold leading-[24px]">
          <div>Navigate the journey and select the target step</div>
          <Button
            type={ButtonType.SECONDARY}
            onClick={() => dispatch(setJumpToTargettingNode(undefined))}
          >
            Cancel
          </Button>
        </div>
      )}
      <div className="w-full h-full flex">
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
          onNodeClick={(_, node) => handleDevModeClick(node)}
          onNodeDoubleClick={(_, node) => handleDevModeDBClick(node)}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesFocusable={false}
          onMove={onMove}
          onMoveEnd={onMoveEnd}
          zoomOnDoubleClick={devModeState.status !== ConnectionStatus.Connected}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnScroll
          panOnDrag={[1, 2]}
          selectionOnDrag={isSelectionAvailable}
          selectionMode={SelectionMode.Partial}
          onSelectionStart={() => setIsSelecting(true)}
          onSelectionEnd={handleStopSelecting}
          elevateEdgesOnSelect
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
          <MouseTracker
            isVisible={isMoving}
            coordinates={stateChanges}
            flowRef={flowRef}
          >
            This is a moving node
          </MouseTracker>
          <NodeDraggingProvider flowRef={flowRef} />
          <Controls
            showInteractive={false}
            position="top-left"
            className="rounded-sm"
          >
            <ControlButton
              onClick={() => setIsSelectionAvailable(!isSelectionAvailable)}
            >
              <div>{isSelectionAvailable ? "Select" : "Move"}</div>
            </ControlButton>
            {devModeState.status !== ConnectionStatus.Disabled && (
              <DevModeControlHint />
            )}
          </Controls>
        </ReactFlow>
        {!isViewMode && !isOnboarding && stepperIndex === 0 && (
          <FlowBuilderSidePanel />
        )}
      </div>
    </div>
  );
};

export default FlowEditor;
