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
  copyNodes,
  clearCopyNodes,
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
import { debounce, throttle } from "lodash";
import { select } from "@material-tailwind/react";
import CopyIcon from "assets/icons/CopyIcon";
import { toast } from "react-toastify";

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
  const [previousIsDragging, setPreviousIsDragging] = useState(false);
  const [changesDrag, setChangesDrag] = useState<NodeChange[]>([]);
  // const [nodes, setNodesState, onNodesChangeState] =
  //   useNodesState(initialNodes);
  const [setEdges] = useEdgesState(edges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const flowRef = useRef<HTMLDivElement>(null);

  const { x: viewX, y: viewY, zoom } = useViewport();

  const onDrag = (x: number, y: number, movingNode: any) => {
    console.log(x, y, "x, y");

    console.log(movingNode, "movingNode");

    if (!isDragging || !flowRef.current || edges.length === 0) return;

    const boudingClientRect = flowRef.current.getBoundingClientRect();

    console.log(boudingClientRect, "boudingClientRect");

    // const canvasMouseX = (x - viewX - boudingClientRect.left) / zoom;

    // console.log(canvasMouseX, "canvasMouseX");

    // const canvasMouseY = (y - viewY - boudingClientRect.top) / zoom;
    // console.log(canvasMouseY, "canvasMouseY");

    const canvasMouseX = x + viewX - boudingClientRect.left / zoom; //- 200
    const canvasMouseY = y - viewY - boudingClientRect.top / zoom; //- 570

    const insertNode = nodes.find((node) => node.id === movingNode.id);
    console.log(insertNode, "insertNode");
    // if (insertNode && e.dataTransfer) {
    //   // e.preventDefault();
    //   // e.dataTransfer.dropEffect = "move";
    // }
    const example1 = 240 / 114; // 2.1052631578947367
    const example2 = 440 / 362; // 1.2154696132596685
    const example3 = 540 / 486; // 1.1111111111111112
    const example4 = 410 / 238; // 1.7226890756302522

    console.log(example1, example2, example3, "examples");
    if (insertNode) {
      console.log(
        x,
        y,
        canvasMouseX,
        canvasMouseY,
        "canvasMouseX, canvasMouseY",
        insertNode.position.x,
        insertNode.position.y
      );
    }

    let distanceToInsertNode = insertNode
      ? Math.sqrt(
          (canvasMouseX - insertNode.position.x) ** 2 +
            (canvasMouseY - insertNode.position.y) ** 2
        ) - 400 // Calculate distance
      : Infinity; // If no insertNode, set distance to Infinity
    console.log(distanceToInsertNode, "distanceToInsertNode");
    // return;
    if (distanceToInsertNode > 130) {
      dispatch(clearInsertNodes());
      distanceToInsertNode = Infinity;
    }

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

      //finds all pairs of closely located nodes
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
      console.log(labelX, "labelX");
      console.log(labelY, "labelY");
      const lengthToLabel =
        Math.sqrt(
          (canvasMouseX - labelX) * (canvasMouseX - labelX) +
            (canvasMouseY - labelY) * (canvasMouseY - labelY)
        ) - 450;

      console.log(
        nodeA.position,
        nodeB.position,
        lengthToLabel,
        closestEdge,
        "lengthToLabel closestEdge"
      );
      // continue;
      if (lengthToLabel < 0 || lengthToLabel > 200) continue;

      if (!closestEdge || lengthToLabel < closestEdge.lengthToLabel)
        closestEdge = { edge, lengthToLabel, nodeA, nodeB };
    }
    console.log(closestEdge, "closestEdge");
    let closestEmptyNode: { node: Node<NodeData>; length: number } | undefined;

    for (const node of nodes) {
      if (node.type !== NodeType.EMPTY) continue;

      const length = Math.sqrt(
        (canvasMouseX - node.position.x) * (canvasMouseX - node.position.x) +
          (canvasMouseY - node.position.y) * (canvasMouseY - node.position.y)
      );

      if (length > MAXIMUM_INSERT_RADIUS) continue;

      if (!closestEmptyNode || closestEmptyNode.length > length)
        closestEmptyNode = { node, length };
    }

    // if (
    //   closestEmptyNode &&
    //   (!closestEdge || closestEmptyNode.length < closestEdge.lengthToLabel) &&
    //   closestEmptyNode.length < distanceToInsertNode
    // ) {
    //   dispatch(transformEmptyNodeIntoInsertNode(closestEmptyNode.node.id));
    //   return;
    // }

    if (!closestEdge || closestEdge.lengthToLabel > distanceToInsertNode)
      return;

    console.log(closestEdge.nodeA.id, closestEdge.nodeB.id, "closestEdge");
    //:TODO
    dispatch(
      addInsertNodeBetween({
        source: closestEdge.nodeA.id,
        target: closestEdge.nodeB.id,
      })
    );

    // const insertNode = nodes.find((node) => node.type === NodeType.INSERT_NODE);
    // if (!insertNode) {
    // dispatch(
    //   addInsertNodeBetween({
    //     source: nodes[1]?.id,
    //     target: nodes[2]?.id,
    //   })
    // );
    // }

    // dispatch(
    //   moveNodeToNewPosition({
    //     nodeId: nodes[3]?.id,
    //   })
    // );
  };
  const debouncedOnDrag = debounce(onDrag, 500);

  const handleOnSelectionDrag = (x: number, y: number) => {
    const boundingClientRect = flowRef?.current?.getBoundingClientRect();
    if (!boundingClientRect) return;
    // console.log(boudingClientRect, "boudingClientRect");

    // const canvasMouseX = (x - viewX - boudingClientRect.left) / zoom;

    // const canvasMouseY = (y - viewY - boudingClientRect.top) / zoom;
    const canvasMouseX = x + viewX - boundingClientRect.left / zoom - 200;
    const canvasMouseY = y - viewY - boundingClientRect.top / zoom - 570;
    setStateChanges({ x: x, y: y });
    console.log(changesDrag, "changesDrag");
    if (changesDrag.length) {
      debouncedOnDrag(x, y, changesDrag[0]);
    }
  };

  const handleStopDrag = () => {
    setIsCustomDragging(false);
    dispatch(setIsDragging(false));
    dispatch(setIsMoving(false));
    setIsSelecting(false);
    setStateChanges({ x: 0, y: 0 });

    const draggedNode = changesDrag.find(
      (change) => change.type === "position"
    );
    if (!draggedNode) return;

    dispatch(
      moveNodeToNewPosition({
        nodeId: (draggedNode as NodeChange & { id: string }).id,
      })
    );
  };

  const onNodesChange = (changes: NodeChange[]) => {
    console.log(changes, "NODES CHANGES");
    // setSelectedNodes(changes);
    // changes.map((change) => {
    //   if (change.type !== "select") return;
    //   if (change.selected) {
    //     setSelectedNodes([...selectedNodes, change]);
    //   } else {
    //     setSelectedNodes(
    //       selectedNodes.filter((node) => {
    //         if ("id" in node) {
    //           return node.id !== change.id;
    //         }
    //         return true;
    //       })
    //     );
    //   }
    // });
    if (isSelecting) {
      const movingNode = changes.find(
        (change) =>
          change.type === "position" && change.dragging && change.position
      );

      if (movingNode) {
        setChangesDrag(changes);
      }

      const draggedNode = changes.find(
        (change) =>
          change.type === "position" && change.dragging && !!movingNode
      );
      if (draggedNode) {
        setIsCustomDragging(true);
        dispatch(setIsMoving(true));
        dispatch(setIsDragging(true));
        dispatch(setDragAction({ type: DrawerAction.EMAIL }));
      }
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
    // if (isSelecting) {
    //   console.log("setNodes3");
    //   dispatch(setNodes(applyNodeChanges(changes, nodes)));
    // }
    if (!isSelecting) {
      console.log("setNodes2");
      dispatch(setNodes(applyNodeChanges(changes, nodes)));
    }
  };

  const handleStopSelecting = (e: any) => {
    setIsSelecting(false);
  };
  // console.log(isSelecting, "isSelecting");
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
    setIsSelecting(false);
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

  const handleCopy = () => {
    // const nodeToCopy = nodes.find((node) => node.id === selectedNodes?.id);
    // console.log(nodeToCopy, "nodeToCopy", selectedNodes);
    if (!selectedNodes) return;
    dispatch(copyNodes({ nodes: selectedNodes }));
    dispatch(deselectNodes());
    setIsSelecting(false);
  };

  const handleClearCopy = () => {
    dispatch(clearCopyNodes());
    dispatch(deselectNodes());
    setIsSelecting(false);
  };

  const handleOnSelectionEnd = () => {
    setIsSelecting(false);

    const hasNodes = !!selectedNodes.filter((node) => node.type !== "empty")
      ?.length;

    if (!hasNodes) {
      dispatch(deselectNodes());
    }

    let multisplitCount = 0;
    let waitUntilCount = 0;
    let experimentCount = 0;

    selectedNodes?.map((node) => {
      if (node.type === DrawerAction.WAIT_UNTIL) {
        waitUntilCount++;
      }
      if (node.type === DrawerAction.MULTISPLIT) {
        multisplitCount++;
      }
      if (node.type === DrawerAction.EXPERIMENT) {
        experimentCount++;
      }
    });

    const isMaxMultisplitNodes = waitUntilCount > 1;
    const isMaxWaitUntilNodes = waitUntilCount > 1;
    const isMaxExperimentNodes = experimentCount > 1;

    const isMax = multisplitCount + waitUntilCount + experimentCount > 1;

    const maxDisplayNodes = [];
    if (isMaxWaitUntilNodes || (isMax && waitUntilCount))
      maxDisplayNodes.push("Wait Until");
    if (isMaxMultisplitNodes || (isMax && multisplitCount))
      maxDisplayNodes.push("Multisplit");
    if (isMaxExperimentNodes || (isMax && experimentCount))
      maxDisplayNodes.push("Experiment");

    const message = `Please select only one ${maxDisplayNodes.join(" or ")}`;

    if (maxDisplayNodes.length) {
      dispatch(deselectNodes());
      toast.warning(message);
    }
  };

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
          onSelectionStart={(e) => setIsSelecting(true)}
          onSelectionDragStop={handleStopDrag}
          onSelectionDrag={(e) => {
            handleOnSelectionDrag(e.clientX, e.clientY);
          }}
          onSelectionEnd={(e) => handleOnSelectionEnd}
          onSelectionChange={(e) => setSelectedNodes(e.nodes)}
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
            setStateChanges={setStateChanges}
            selectedNode={nodes.find((node) => node.id === changesDrag[0]?.id)}
          >
            <></>
          </MouseTracker>
          <NodeDraggingProvider flowRef={flowRef} />
          <Controls
            showInteractive={false}
            position="top-left"
            className="rounded-sm"
          >
            <ControlButton onClick={handleCopy}>
              <CopyIcon width={26} height={27} />
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
