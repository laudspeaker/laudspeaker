import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawerAction } from "pages/FlowBuilderv2/Drawer/drawer.fixtures";
import { NodeType, EdgeType } from "pages/FlowBuilderv2/FlowEditor";
import { getLayoutedNodes } from "pages/FlowBuilderv2/layout.helper";
import { BranchType, NodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import {
  applyNodeChanges,
  Edge,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
} from "reactflow";
import { MessageType } from "types/Workflow";
import { v4 as uuid } from "uuid";

interface FlowBuilderState {
  flowId: string;
  flowName: string;
  nodes: Node<NodeData>[];
  edges: Edge<undefined>[];
  selectedNodeId?: string;
  isDragging?: boolean;
}

const startNodeUUID = uuid();
const nextNodeUUID = uuid();

const initialNodes: Node<NodeData>[] = [
  {
    id: startNodeUUID,
    type: NodeType.START,
    data: {},
    position: { x: 0, y: 0 },
  },
  {
    id: nextNodeUUID,
    type: NodeType.EMPTY,
    data: {},
    position: { x: 0, y: 0 },
  },
];
const initialEdges: Edge<undefined>[] = [
  {
    id: `e${startNodeUUID}-${nextNodeUUID}`,
    type: EdgeType.PRIMARY,
    source: startNodeUUID,
    target: nextNodeUUID,
  },
];

const initialState: FlowBuilderState = {
  flowId: "",
  flowName: "",
  nodes: getLayoutedNodes(initialNodes.slice(), initialEdges.slice()),
  edges: initialEdges.slice(),
  selectedNodeId: undefined,
  isDragging: false,
};

const flowBuilderSlice = createSlice({
  name: "flowBuilder",
  initialState,
  reducers: {
    setFlowId(state, action: PayloadAction<string>) {
      state.flowId = action.payload;
    },
    setFlowName(state, action: PayloadAction<string>) {
      state.flowName = action.payload;
    },
    setNodes(state, action: PayloadAction<Node<NodeData>[]>) {
      state.nodes = getLayoutedNodes(action.payload, state.edges);
    },
    addTemporaryEmptyNodeBetween(
      state,
      action: PayloadAction<{ source: string; target: string }>
    ) {
      const { source, target } = action.payload;

      const edgeBetween = state.edges.find(
        (edge) => edge.source === source && edge.target === target
      );
      if (!edgeBetween) return;

      const newNodeUUID = uuid();

      state.nodes.push({
        id: newNodeUUID,
        type: NodeType.EMPTY,
        data: { temporary: true },
        position: { x: 0, y: 0 },
      });

      state.edges.splice(state.edges.indexOf(edgeBetween), 1);

      state.edges.push(
        {
          id: `e${source}-${newNodeUUID}`,
          type: EdgeType.PRIMARY,
          source,
          target: newNodeUUID,
        },
        {
          id: `e${newNodeUUID}-${target}`,
          type: EdgeType.PRIMARY,
          source: newNodeUUID,
          target,
        }
      );

      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    changeNodeData(
      state,
      action: PayloadAction<{ id: string; data: NodeData }>
    ) {
      const { id, data } = action.payload;

      const nodeToChange = state.nodes.find((node) => node.id === id);
      if (!nodeToChange) return;

      nodeToChange.data = data;
    },
    removeNode(state, action: PayloadAction<string>) {
      const node = state.nodes.find((n) => n.id === action.payload);
      if (!node || node.type === NodeType.START) return;
      const nodeIndex = state.nodes.indexOf(node);

      const incomers = getIncomers(node, state.nodes, state.edges);
      const outgoers = getOutgoers(node, state.nodes, state.edges);

      if (incomers.length !== 1) {
        return;
      }

      if (outgoers.length > 1) {
        this.pruneNodeTree(state, { type: "", payload: node.id });
        return;
      }

      const nodeIn = incomers[0];

      let nodeOut = outgoers[0];
      if (!nodeOut) {
        nodeOut = {
          id: uuid(),
          type: NodeType.EMPTY,
          data: {},
          position: { x: 0, y: 0 },
        };
        state.nodes.push(nodeOut);
      }

      state.edges = state.edges.filter(
        (edge) => edge.source !== node.id && edge.target !== node.id
      );
      state.nodes.splice(nodeIndex, 1);

      state.edges.push({
        id: `e${nodeIn.id}-${nodeOut.id}`,
        type: EdgeType.PRIMARY,
        source: nodeIn.id,
        target: nodeOut.id,
      });

      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    pruneNodeTree(state, action: PayloadAction<string>) {
      const node = state.nodes.find((n) => n.id === action.payload);
      if (!node) return;
      const nodeIndex = state.nodes.indexOf(node);

      const children = getOutgoers(node, state.nodes, state.edges);

      state.edges.filter(
        (edge) => edge.source !== node.id && edge.target !== node.id
      );

      state.nodes.splice(nodeIndex, 1);

      for (const child of children) {
        this.pruneNodeTree(state, { type: "", payload: child.id });
      }
    },
    setEdges(state, action: PayloadAction<Edge<undefined>[]>) {
      state.edges = action.payload;
      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    handleDrawerAction(
      state,
      action: PayloadAction<{ id: string; action: string }>
    ) {
      const nodeToChange = state.nodes.find(
        (node) => node.id === action.payload.id
      );

      if (!nodeToChange) return;

      switch (action.payload.action) {
        case DrawerAction.EMAIL:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.EMAIL },
          };
          break;
        case DrawerAction.SMS:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.SMS },
          };
          break;
        case DrawerAction.SLACK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.SLACK },
          };
          break;
        case DrawerAction.PUSH:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.PUSH },
          };
          break;
        case DrawerAction.WEBHOOK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.WEBHOOK },
          };
          break;
        case DrawerAction.CUSTOM_MODAL:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.MODAL },
          };
          break;
        case DrawerAction.JUMP_TO:
          nodeToChange.type = NodeType.JUMP_TO;
          break;
        case DrawerAction.EXIT:
          break;
        case DrawerAction.WAIT_UNTIL:
          nodeToChange.type = NodeType.WAIT_UNTIL;
          nodeToChange.data = {
            type: NodeType.WAIT_UNTIL,
            branches: [],
          };
          break;
        case DrawerAction.TIME_DELAY:
          nodeToChange.type = NodeType.TIME_DELAY;
          break;
        case DrawerAction.TIME_WINDOW:
          nodeToChange.type = NodeType.TIME_WINDOW;
          break;
        default:
          break;
      }

      if (
        !state.edges.some((edge) => edge.source === nodeToChange.id) &&
        nodeToChange.type !== NodeType.JUMP_TO
      ) {
        const newNodeId = uuid();
        state.nodes.push({
          id: newNodeId,
          type: NodeType.EMPTY,
          data: {},
          position: {
            x: 0,
            y: 0,
          },
        });

        state.edges.push({
          id: `${nodeToChange.id}-${newNodeId}`,
          type: EdgeType.PRIMARY,
          source: nodeToChange.id,
          target: newNodeId,
        });
      }

      state.nodes = applyNodeChanges(
        [
          ...state.nodes.map<NodeChange>((node) => ({
            type: "select",
            id: node.id,
            selected: false,
          })),
          { type: "select", id: nodeToChange.id, selected: true },
        ],
        state.nodes
      );

      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    deselectNodes(state) {
      state.nodes = applyNodeChanges(
        state.nodes.map<NodeChange>((node) => ({
          type: "select",
          id: node.id,
          selected: false,
        })),
        state.nodes
      );
    },
    setIsDragging(state, action: PayloadAction<boolean>) {
      state.isDragging = action.payload;
    },
    refreshFlowBuilder(state) {
      state.flowId = "";
      state.flowName = "";
      state.nodes = initialNodes.slice();
      state.edges = initialEdges.slice();
      state.selectedNodeId = undefined;
      state.isDragging = false;
    },
  },
});

export const {
  setFlowId,
  setFlowName,
  setNodes,
  addTemporaryEmptyNodeBetween,
  changeNodeData,
  removeNode,
  pruneNodeTree,
  setEdges,
  handleDrawerAction,
  deselectNodes,
  setIsDragging,
  refreshFlowBuilder,
} = flowBuilderSlice.actions;

export default flowBuilderSlice.reducer;
