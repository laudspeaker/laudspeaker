import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";
import { RefObject, FC, useEffect } from "react";
import { useViewport, Edge, getOutgoers, Node } from "reactflow";
import {
  clearInsertNodes,
  transformEmptyNodeIntoInsertNode,
  addInsertNodeBetween,
  transformInsertNodeIntoEmptyNode,
  handleDrawerAction,
  removeNode,
  NodeAction,
  clearCopyNodes,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector, useAppDispatch } from "store/hooks";
import { DrawerAction } from "../Drawer/drawer.fixtures";
import { EdgeData } from "../Edges/EdgeData";
import { NodeType, EdgeType } from "../FlowEditor";
import { NodeData } from "../Nodes/NodeData";

interface NodeDraggingProviderProps {
  flowRef: RefObject<HTMLDivElement>;
}

const MAXIMUM_INSERT_RADIUS = 130;

export const dragActionsNotToDoBetweenNodes: (
  | DrawerAction
  | NodeAction
  | OnboardingAction
  | undefined
)[] = [DrawerAction.EXIT, DrawerAction.JUMP_TO, DrawerAction.USER_ATTRIBUTE];

export const pastedDragActionsNotToDoBetweenNodes = [
  ...dragActionsNotToDoBetweenNodes,
  DrawerAction.MULTISPLIT,
  DrawerAction.WAIT_UNTIL,
  DrawerAction.EXPERIMENT,
];

const NodeDraggingProvider: FC<NodeDraggingProviderProps> = ({ flowRef }) => {
  const drawerActionToNodeTypeMap: Record<DrawerAction, NodeType> = {
    [DrawerAction.CUSTOM_MODAL]: NodeType.MESSAGE,
    [DrawerAction.TRACKER]: NodeType.TRACKER,
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
    [DrawerAction.MULTISPLIT]: NodeType.MULTISPLIT,
    [DrawerAction.EXPERIMENT]: NodeType.EXPERIMENT,
  };

  const {
    nodes,
    edges,
    isDragging,
    flowId,
    dragAction,
    isOnboarding,
    copiedNodes,
  } = useAppSelector((state) => state.flowBuilder);

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

    let lengthToInsertNode = insertNode
      ? Math.sqrt(
          (canvasMouseX - insertNode.position.x) *
            (canvasMouseX - insertNode.position.x) +
            (canvasMouseY - insertNode.position.y) *
              (canvasMouseY - insertNode.position.y)
        )
      : Infinity;

    if (lengthToInsertNode > MAXIMUM_INSERT_RADIUS) {
      dispatch(clearInsertNodes());
      lengthToInsertNode = Infinity;
    }

    let closestEdge:
      | {
          edge: Edge<EdgeData>;
          lengthToLabel: number;
          nodeA: Node<NodeData>;
          nodeB: Node<NodeData>;
        }
      | undefined;

    const canBeBetweenNodes = copiedNodes
      ? !pastedDragActionsNotToDoBetweenNodes.includes(dragAction?.type)
      : !dragActionsNotToDoBetweenNodes.includes(dragAction?.type);

    if (canBeBetweenNodes && !isOnboarding) {
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
        if (lengthToLabel > 50) continue;

        if (!closestEdge || lengthToLabel < closestEdge.lengthToLabel)
          closestEdge = { edge, lengthToLabel, nodeA, nodeB };
      }
    }

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

  const onDrop = async (e: DragEvent) => {
    const insertNode = nodes.find((node) => node.type === NodeType.INSERT_NODE);

    const copiedIds = e.dataTransfer?.getData("copiedId")?.split(",") || [];
    const actionIds = e.dataTransfer?.getData("actionIds")?.split(",") || [];
    const action = e.dataTransfer?.getData("action");

    if (
      !insertNode ||
      !action ||
      (action === DrawerAction.EXIT &&
        getOutgoers(insertNode, nodes, edges).length > 0)
    )
      return;

    dispatch(transformInsertNodeIntoEmptyNode(insertNode.id));

    if (isOnboarding) {
      if (action === OnboardingAction.NOTHING) return;
      const targetId = e.dataTransfer?.getData("targetId");

      if (targetId && insertNode.id !== targetId) return;

      dispatch(handleDrawerAction({ id: insertNode.id, action }));
      return;
    }

    const addNode = async ({
      copiedId,
      index,
    }: {
      copiedId?: string;
      index?: number;
    }) => {
      const actionParsed = action !== "null" ? action : actionIds[index || 0];
      const type = drawerActionToNodeTypeMap[actionParsed as DrawerAction];

      try {
        const {
          data: { id: stepId },
        } = await ApiService.post({
          url: "/steps",
          options: {
            type,
            journeyID: flowId,
          },
        });

        if (copiedId) {
          dispatch(
            handleDrawerAction({
              id: insertNode.id,
              action: actionParsed,
              stepId,
              copiedId,
              index,
            })
          );
        } else {
          dispatch(handleDrawerAction({ id: insertNode.id, action, stepId }));
        }
      } catch (err) {
        dispatch(removeNode(insertNode.id));
      }
    };

    if (copiedIds) {
      for (let index = 0; index < copiedIds.length; index++) {
        await addNode({ copiedId: copiedIds[index], index });
      }
      return;
    }
    await addNode({});
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

export default NodeDraggingProvider;
