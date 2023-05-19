import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawerAction } from "pages/FlowBuilderv3/Drawer/drawer.fixtures";
import { NodeType } from "pages/FlowBuilderv3/FlowEditor";
import NodeData from "pages/FlowBuilderv3/Nodes/NodeData";
import { Edge, Node } from "reactflow";
import {
  EventCondition,
  MessageType,
  ProviderTypes,
  Trigger,
  TriggerType,
} from "types/Workflow";
import { v4 as uuid } from "uuid";

interface FlowBuilderState {
  flowId: string;
  flowName: string;
  nodes: Node<NodeData>[];
  edges: Edge<undefined>[];
  selectedNodeId?: string;
  isDragging?: boolean;
}

const initialNodes: Node<NodeData>[] = [
  {
    id: "1",
    type: NodeType.START,
    data: {},
    position: { x: 250, y: 0 },
  },
  {
    id: "2",
    type: NodeType.WAIT_UNTIL,
    data: {},
    position: { x: 250, y: 105 },
  },
  {
    id: "3",
    type: NodeType.MESSAGE,
    data: {
      template: {
        type: MessageType.EMAIL,
      },
    },
    position: { x: 250, y: 230 },
  },
  {
    id: "4",
    type: NodeType.MESSAGE,
    data: {
      template: {
        type: MessageType.EMAIL,
        selected: { id: "1", name: "Template123" },
      },
    },
    position: { x: 250, y: 355 },
  },
  {
    id: "5",
    type: NodeType.MESSAGE,
    data: {
      template: {
        type: MessageType.WEBHOOK,
      },
    },
    position: { x: 250, y: 480 },
  },
  {
    id: "6",
    type: NodeType.TIME_DELAY,
    data: {},
    position: { x: 250, y: 605 },
  },
  {
    id: "7",
    type: NodeType.TIME_WINDOW,
    data: {},
    position: { x: 250, y: 730 },
  },
  {
    id: "8",
    type: NodeType.LOOP,
    data: {},
    position: { x: 250, y: 855 },
  },
];
const initialEdges: Edge<undefined>[] = [
  { id: "e1-2", type: "step", source: "1", target: "2" },
  { id: "e2-3", type: "step", source: "2", target: "3" },
  { id: "e3-4", type: "step", source: "3", target: "4" },
  { id: "e4-5", type: "step", source: "4", target: "5" },
  { id: "e5-6", type: "step", source: "5", target: "6" },
  { id: "e6-7", type: "step", source: "6", target: "7" },
  { id: "e7-8", type: "step", source: "7", target: "8" },
];

const initialState: FlowBuilderState = {
  flowId: "",
  flowName: "",
  nodes: initialNodes.slice(),
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
      state.nodes = action.payload;
    },
    addNode(state, action: PayloadAction<Node<NodeData>>) {
      state.nodes.push(action.payload);
    },
    setEdges(state, action: PayloadAction<Edge<undefined>[]>) {
      state.edges = action.payload;
    },
    selectNode(state, action: PayloadAction<string | undefined>) {
      state.selectedNodeId = action.payload;
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
          nodeToChange.data.template = { type: MessageType.EMAIL };
          break;
        case DrawerAction.SMS:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data.template = { type: MessageType.SMS };
          break;
        case DrawerAction.SLACK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data.template = { type: MessageType.SLACK };
          break;
        case DrawerAction.PUSH:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data.template = { type: MessageType.PUSH };
          break;
        case DrawerAction.WEBHOOK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data.template = { type: MessageType.WEBHOOK };
          break;
        case DrawerAction.LOOP:
          nodeToChange.type = NodeType.LOOP;
          break;
        case DrawerAction.EXIT:
          break;
        case DrawerAction.WAIT_UNTIL:
          nodeToChange.type = NodeType.WAIT_UNTIL;
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
        nodeToChange.type !== NodeType.LOOP
      ) {
        const newNodeId = uuid();
        state.nodes.push({
          id: newNodeId,
          type: NodeType.EMPTY,
          data: {},
          position: {
            x: nodeToChange.position.x,
            y: nodeToChange.position.y + 125,
          },
        });

        state.edges.push({
          id: `${nodeToChange.id}-${newNodeId}`,
          type: "step",
          source: nodeToChange.id,
          target: newNodeId,
        });
      }
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
  addNode,
  setEdges,
  selectNode,
  handleDrawerAction,
  refreshFlowBuilder,
} = flowBuilderSlice.actions;

export default flowBuilderSlice.reducer;
