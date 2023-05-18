import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Edge, Node } from "reactflow";
import {
  EventCondition,
  ProviderTypes,
  Trigger,
  TriggerType,
} from "types/Workflow";
import { v4 as uuid } from "uuid";

export interface NodeData {
  stats?: {
    sent: number;
    delivered: number;
    clickedPercentage: number;
    wssent: number;
    openedPercentage: number;
  };
}

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
    type: "input",
    data: {},
    position: { x: 250, y: 25 },
  },

  {
    id: "2",
    data: {},
    position: { x: 100, y: 125 },
  },
  {
    id: "3",
    type: "output",
    data: {},
    position: { x: 250, y: 250 },
  },
];
const initialEdges: Edge<undefined>[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3", animated: true },
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
  refreshFlowBuilder,
} = flowBuilderSlice.actions;

export default flowBuilderSlice.reducer;
