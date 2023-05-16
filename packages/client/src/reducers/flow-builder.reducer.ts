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
  audienceId: string;
  isDynamic?: boolean;
  isSelected?: boolean;
  messages: { type: string; templateId: number }[];
  needsUpdate?: boolean;
  nodeId?: string;
  primary: boolean;
  mock?: boolean;
  triggers: string[];
  hidden?: boolean;
  isExit?: boolean;
  isNew?: boolean;
  stats?: {
    sent: number;
    delivered: number;
    clickedPercentage: number;
    wssent: number;
    openedPercentage: number;
  };
  isConnecting?: boolean;
  isNearToCursor?: boolean;
  isDraggedOver?: boolean;
}

interface FlowBuilderState {
  flowId: string;
  nodes: Node<NodeData>[];
  edges: Edge<undefined>[];
  triggers: Trigger[];
  selectedTriggerId?: string;
  selectedNodeId?: string;
  filterId?: string;
  isTriggerDragging?: boolean;
  isMessagesDragging?: boolean;
}

const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge<undefined>[] = [];
const initialTriggers: Trigger[] = [];

const initialState: FlowBuilderState = {
  flowId: "",
  nodes: initialNodes.slice(),
  edges: initialEdges.slice(),
  triggers: initialTriggers.slice(),
  selectedTriggerId: undefined,
  selectedNodeId: undefined,
  filterId: undefined,
};

const triggerTitleMap: Record<TriggerType, string> = {
  [TriggerType.TIME_DELAY]: "Time Delay",
  [TriggerType.TIME_WINDOW]: "Time Window",
  [TriggerType.EVENT]: "Event Based",
};

const flowBuilderSlice = createSlice({
  name: "flowBuilder",
  initialState,
  reducers: {
    setFlowId(state, action: PayloadAction<string>) {
      state.flowId = action.payload;
    },
    setNodes(state, action: PayloadAction<Node<NodeData>[]>) {
      state.nodes = action.payload;
    },
    addNode(state, action: PayloadAction<Node<NodeData>>) {
      state.nodes.push(action.payload);
    },
    attachTrigger(state, action: PayloadAction<TriggerType>) {
      const selectedNode = state.nodes.find(
        (node) => node.id === state.selectedNodeId
      );
      if (!selectedNode) return;
      const triggerId = uuid();
      const trigger: Trigger = {
        id: triggerId,
        title: triggerTitleMap[action.payload],
        type: action.payload,
        properties: {
          conditions: [],
        },
        ...(action.payload === TriggerType.EVENT
          ? { providerType: ProviderTypes.Custom, providerParams: undefined }
          : {}),
      };
      state.triggers.push(trigger);
      selectedNode.data.triggers.push(triggerId);

      state.selectedTriggerId = trigger.id;
    },
    updateSelectedTrigger(
      state,
      action: PayloadAction<
        Pick<
          Partial<Trigger>,
          "type" | "providerParams" | "providerType" | "properties"
        >
      >
    ) {
      const selectedTrigger = state.triggers.find(
        (trigger) => trigger.id === state.selectedTriggerId
      );

      if (!selectedTrigger) return;

      const { type, providerParams, providerType, properties } = action.payload;

      selectedTrigger.type = type || selectedTrigger.type;
      selectedTrigger.providerParams =
        providerParams || selectedTrigger.providerParams;
      selectedTrigger.providerType =
        providerType || selectedTrigger.providerType;
      selectedTrigger.properties = properties || selectedTrigger.properties;
    },
    deleteSelectedTrigger(state) {
      state.triggers = state.triggers.filter(
        (trigger) => trigger.id !== state.selectedTriggerId
      );

      for (const node of state.nodes) {
        node.data.triggers = node.data.triggers.filter(
          (triggerId) => triggerId !== state.selectedTriggerId
        );
      }

      state.edges = state.edges.filter(
        (edge) => edge.sourceHandle !== state.selectedTriggerId
      );
      state.selectedTriggerId = "";
    },
    changeSelectedTriggerCondition(
      state,
      action: PayloadAction<[number, EventCondition]>
    ) {
      const selectedTrigger = state.triggers.find(
        (trigger) => trigger.id === state.selectedTriggerId
      );

      if (!selectedTrigger?.properties) return;

      selectedTrigger.properties.conditions[action.payload[0]] =
        action.payload[1];
    },
    deleteSelectedTriggerCondition(state, action: PayloadAction<number>) {
      const selectedTrigger = state.triggers.find(
        (trigger) => trigger.id === state.selectedTriggerId
      );

      if (!selectedTrigger?.properties) return;

      selectedTrigger.properties.conditions.splice(action.payload, 1);
    },
    setEdges(state, action: PayloadAction<Edge<undefined>[]>) {
      state.edges = action.payload;
    },
    setTriggers(state, action: PayloadAction<Trigger[]>) {
      state.triggers = action.payload;
    },
    selectTrigger(state, action: PayloadAction<string | undefined>) {
      state.selectedTriggerId = action.payload;
    },
    selectNode(state, action: PayloadAction<string | undefined>) {
      state.selectedNodeId = action.payload;
    },
    setIsTriggerDragging(state, action: PayloadAction<boolean>) {
      state.isTriggerDragging = action.payload;
    },
    setIsMessagesDragging(state, action: PayloadAction<boolean>) {
      state.isMessagesDragging = action.payload;
    },
    setFilterId(state, action: PayloadAction<string | undefined>) {
      state.filterId = action.payload;
    },
    refreshFlowBuilder(state) {
      state.nodes = initialNodes.slice();
      state.edges = initialEdges.slice();
      state.triggers = initialTriggers.slice();
      state.selectedTriggerId = undefined;
      state.selectedNodeId = undefined;
      state.filterId = undefined;
    },
  },
});

export const {
  setFlowId,
  setNodes,
  addNode,
  attachTrigger,
  updateSelectedTrigger,
  deleteSelectedTrigger,
  changeSelectedTriggerCondition,
  deleteSelectedTriggerCondition,
  setEdges,
  setTriggers,
  selectTrigger,
  selectNode,
  refreshFlowBuilder,
  setFilterId,
  setIsMessagesDragging,
  setIsTriggerDragging,
} = flowBuilderSlice.actions;

export default flowBuilderSlice.reducer;
