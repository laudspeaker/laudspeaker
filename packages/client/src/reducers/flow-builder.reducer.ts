import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawerAction } from "pages/FlowBuilderv2/Drawer/drawer.fixtures";
import { BranchEdgeData, EdgeData } from "pages/FlowBuilderv2/Edges/EdgeData";
import {
  NodeType,
  EdgeType,
  nodeTypesNotConnectableByJumpTo,
} from "pages/FlowBuilderv2/FlowEditor";
import { getLayoutedNodes } from "pages/FlowBuilderv2/layout.helper";
import {
  Branch,
  BranchType,
  LogicRelation,
  NodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";
import {
  applyNodeChanges,
  Edge,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
} from "reactflow";
import { MessageType, ProviderType } from "types/Workflow";
import getClosestNextAndPrevious from "utils/getClosestNextAndPrevious";
import { v4 as uuid } from "uuid";

export enum SegmentsSettingsType {
  ALL_CUSTOMERS = "allCustomers",
  CONDITIONAL = "conditional",
}

export interface AllCustomersSegmentsSettings {
  type: SegmentsSettingsType.ALL_CUSTOMERS;
}

export enum QueryType {
  ALL = "all",
  ANY = "any",
}

export enum QueryStatementType {
  ATTRIBUTE = "Attribute",
  SEGMENT = "Segment",
  EVENT = "Event",
  MessageEvent = "Message Event",
  JourneyAttributes = "Journey Attributes",
}

export enum ComparisonType {
  EQUALS = "is equal to",
  NOT_EQUALS = "is not equal to",
  OBJECT_KEY = "key",
  BETWEEN = "between",
  ARRAY_LENGTH_GREATER = "length is greater than",
  ARRAY_LENGTH_LESS = "length is less than",
  ARRAY_LENGTH_EQUAL = "length is equal to",
  EXIST = "exist",
  NOT_EXIST = "not exist",
  GREATER = "is greater than",
  LESS = "is less than",
  CONTAINS = "contains",
  NOT_CONTAINS = "does not contain",
  AFTER = "after",
  BEFORE = "before",
  BOOL_EQUALS = "is equal to",
  BOOL_NOT_EQUALS = "is not equal to",
}

export enum ObjectKeyComparisonType {
  KEY_EXIST = "exist",
  KEY_NOT_EXIST = "not exist",
  KEY_VALUE_EQUAL_TO = "equal to",
  KEY_VALUE_NOT_EQUAL_TO = "not equal to",
}

export enum StatementValueType {
  STRING = "String",
  NUMBER = "Number",
  BOOLEAN = "Boolean",
  EMAIL = "Email",
  DATE = "Date",
  ARRAY = "Array",
  OBJECT = "Object",
}

export const valueTypeToComparisonTypesMap: Record<
  StatementValueType,
  ComparisonType[]
> = {
  [StatementValueType.STRING]: [
    ComparisonType.EQUALS,
    ComparisonType.NOT_EQUALS,
    ComparisonType.CONTAINS,
    ComparisonType.NOT_CONTAINS,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.NUMBER]: [
    ComparisonType.GREATER,
    ComparisonType.EQUALS,
    ComparisonType.NOT_EQUALS,
    ComparisonType.LESS,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.BOOLEAN]: [
    ComparisonType.BOOL_EQUALS,
    ComparisonType.BOOL_NOT_EQUALS,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.EMAIL]: [
    ComparisonType.EQUALS,
    ComparisonType.NOT_EQUALS,
    ComparisonType.CONTAINS,
    ComparisonType.NOT_CONTAINS,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.DATE]: [
    ComparisonType.BEFORE,
    ComparisonType.AFTER,
    ComparisonType.BETWEEN,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.ARRAY]: [
    ComparisonType.ARRAY_LENGTH_GREATER,
    ComparisonType.ARRAY_LENGTH_LESS,
    ComparisonType.ARRAY_LENGTH_EQUAL,
    ComparisonType.CONTAINS,
    ComparisonType.NOT_CONTAINS,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.OBJECT]: [
    ComparisonType.OBJECT_KEY,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
};

export interface AttributeQueryStatement {
  type: QueryStatementType.ATTRIBUTE;
  key: string;
  valueType: StatementValueType;
  comparisonType: ComparisonType;
  subComparisonType: ObjectKeyComparisonType;
  subComparisonValue: string;
  value: string;
}

export enum PerformedType {
  HasPerformed = "has performed",
  HasNotPerformed = "has not performed",
}

export interface EventQueryStatement {
  type: QueryStatementType.EVENT;
  eventName: string;
  comparisonType: PerformedType;
  value: number;
  time?: {
    comparisonType:
      | ComparisonType.BEFORE
      | ComparisonType.AFTER
      | ComparisonType.BETWEEN;
    timeAfter?: string;
    timeBefore?: string;
  };
}

export interface MessageEventQueryStatement {
  type: QueryStatementType.MessageEvent;
  messageId: string;
  eventId: string;
  performedType: PerformedType;
  value: number;
}

export interface SegmentQueryStatement {
  type: QueryStatementType.SEGMENT;
  segmentId: string;
}

export type QueryStatement =
  | AttributeQueryStatement
  | SegmentQueryStatement
  | EventQueryStatement
  | MessageEventQueryStatement
  | Query;

export interface Query {
  type: QueryType;
  isSubBuilderChild?: boolean;
  statements: QueryStatement[];
}

export interface ConditionalSegmentsSettings {
  type: SegmentsSettingsType.CONDITIONAL;
  query: Query;
}

export type SegmentsSettings =
  | AllCustomersSegmentsSettings
  | ConditionalSegmentsSettings;

export enum JourneyType {
  DYNAMIC = "dynamic",
  STATIC = "static",
}

export enum NodeAction {
  SWAP = "swap",
}

export interface DrawerDragAction {
  type: DrawerAction;
}

export interface SwapDragAction {
  type: NodeAction.SWAP;
  nodeId: string;
}

export interface OnboardingDragAction {
  type: OnboardingAction;
  targetId?: string;
}

export type DragAction =
  | DrawerDragAction
  | SwapDragAction
  | OnboardingDragAction;

export const enum ConnectionStatus {
  Disabled,
  ShowPreview,
  Connecting,
  Reconnection,
  Error,
  Connected,
}

interface DevModeStatePayload {
  status?: ConnectionStatus;
  customerInNode?: string;
  arrowPreSelectNode?: string;
  availableNodeToJump?: string[];
  requireMovementToStart?: string;
}

interface FlowBuilderState {
  flowId: string;
  flowName: string;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  isDragging: boolean;
  dragAction?: DragAction;
  stepperIndex: 0 | 1 | 2;
  segments: SegmentsSettings;
  journeyType: JourneyType;
  isViewMode: boolean;
  flowStatus: JourneyStatus;
  showSegmentsErrors: boolean;
  isOnboarding: boolean;
  isOnboardingWaitUntilTooltipVisible: boolean;
  isOnboardingWaitUntilTimeSettingTooltipVisible: boolean;
  requireSaveEmit: boolean;
  sidePanelErrors: Record<string, any>;
  jumpToTargettingNode?: string;
  isDrawerDisabled: boolean;
  segmentQueryErrors: Record<string, any>;
  devModeState: DevModeStatePayload;
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
const initialEdges: Edge<EdgeData>[] = [
  {
    id: `e${startNodeUUID}-${nextNodeUUID}`,
    type: EdgeType.PRIMARY,
    source: startNodeUUID,
    target: nextNodeUUID,
  },
];

const defaultDevMode: DevModeStatePayload = {
  status: ConnectionStatus.Disabled,
  customerInNode: undefined,
  availableNodeToJump: undefined,
  arrowPreSelectNode: undefined,
  requireMovementToStart: undefined,
};

const initialState: FlowBuilderState = {
  flowId: "",
  flowName: "",
  nodes: getLayoutedNodes(initialNodes.slice(), initialEdges.slice()),
  edges: initialEdges.slice(),
  isDragging: false,
  stepperIndex: 0,
  segments: {
    type: SegmentsSettingsType.ALL_CUSTOMERS,
  },
  journeyType: JourneyType.DYNAMIC,
  isViewMode: false,
  flowStatus: JourneyStatus.DRAFT,
  showSegmentsErrors: false,
  isOnboarding: false,
  isOnboardingWaitUntilTooltipVisible: false,
  requireSaveEmit: false,
  sidePanelErrors: {},
  isOnboardingWaitUntilTimeSettingTooltipVisible: false,
  jumpToTargettingNode: undefined,
  isDrawerDisabled: false,
  devModeState: defaultDevMode,
  segmentQueryErrors: {},
};

const handlePruneNodeTree = (state: FlowBuilderState, nodeId: string) => {
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  const nodeIndex = state.nodes.indexOf(node);

  const children = getOutgoers(node, state.nodes, state.edges);

  state.edges = state.edges.filter(
    (edge) => edge.source !== node.id && edge.target !== node.id
  );
  state.nodes.splice(nodeIndex, 1);

  for (const child of children) {
    handlePruneNodeTree(state, child.id);
  }

  state.nodes = getLayoutedNodes(state.nodes, state.edges);
};

const handleRemoveNode = (state: FlowBuilderState, nodeId: string) => {
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node || node.type === NodeType.START) return;
  const nodeIndex = state.nodes.indexOf(node);

  const incomers = getIncomers(node, state.nodes, state.edges);
  const outgoers = getOutgoers(node, state.nodes, state.edges);

  if (incomers.length !== 1) {
    return;
  }

  if (outgoers.length > 1) {
    node.type = NodeType.EMPTY;
    node.data = {};

    for (const outgoer of outgoers) {
      handlePruneNodeTree(state, outgoer.id);
    }
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

  if (
    nodeIn.type === NodeType.WAIT_UNTIL ||
    nodeIn.type === NodeType.USER_ATTRIBUTE
  ) {
    const branchEdge = state.edges.find(
      (edge) => edge.source === nodeIn.id && edge.target === node.id
    );

    if (!branchEdge) return;

    branchEdge.target = nodeOut.id;
  } else {
    state.edges = state.edges.filter(
      (edge) => edge.source !== node.id && edge.target !== node.id
    );
    state.edges.push({
      id: `e${nodeIn.id}-${nodeOut.id}`,
      type: EdgeType.PRIMARY,
      source: nodeIn.id,
      target: nodeOut.id,
    });
  }

  state.nodes.splice(nodeIndex, 1);

  state.nodes = getLayoutedNodes(state.nodes, state.edges);
};

const handleClearInsertNodes = (state: FlowBuilderState) => {
  for (const node of state.nodes) {
    if (node.type === NodeType.INSERT_NODE) {
      if (getOutgoers(node, state.nodes, state.edges).length === 0) {
        node.type = NodeType.EMPTY;
      } else {
        handleRemoveNode(state, node.id);
      }
    }
  }
};

const handleJumpToTargettingNodeChange = (
  state: FlowBuilderState,
  payload: string | undefined
) => {
  state.jumpToTargettingNode = payload;
  state.isDrawerDisabled = Boolean(payload);
  state.nodes = applyNodeChanges(
    state.nodes.map<NodeChange>((node) => ({
      type: "select",
      id: node.id,
      selected: false,
    })),
    state.nodes
  ).map((node) =>
    payload
      ? {
          ...node,
          data: {
            ...node.data,
            disabled: nodeTypesNotConnectableByJumpTo.includes(node.type),
          },
        }
      : { ...node, data: { ...node.data, disabled: false } }
  );
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
    loadVisualLayout(
      state,
      action: PayloadAction<{
        nodes: Node<NodeData>[];
        edges: Edge<EdgeData>[];
      }>
    ) {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
    },
    addInsertNodeBetween(
      state,
      action: PayloadAction<{ source: string; target: string }>
    ) {
      handleClearInsertNodes(state);

      const { source, target } = action.payload;

      const edgeBetween = state.edges.find(
        (edge) => edge.source === source && edge.target === target
      );
      if (!edgeBetween) return;

      const newNodeUUID = uuid();

      state.nodes.push({
        id: newNodeUUID,
        type: NodeType.INSERT_NODE,
        data: {},
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
    transformEmptyNodeIntoInsertNode(state, action: PayloadAction<string>) {
      const nodeToChange = state.nodes.find(
        (node) => node.id === action.payload
      );

      if (!nodeToChange || nodeToChange.type !== NodeType.EMPTY) return;

      handleClearInsertNodes(state);

      nodeToChange.type = NodeType.INSERT_NODE;

      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    transformInsertNodeIntoEmptyNode(state, action: PayloadAction<string>) {
      const nodeToChange = state.nodes.find(
        (node) => node.id === action.payload
      );

      if (!nodeToChange || nodeToChange.type !== NodeType.INSERT_NODE) return;

      nodeToChange.type = NodeType.EMPTY;

      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    clearInsertNodes(state) {
      handleClearInsertNodes(state);
    },
    changeNodeData(
      state,
      action: PayloadAction<{ id: string; data: NodeData }>
    ) {
      const { id, data } = action.payload;

      const nodeToChange = state.nodes.find((node) => node.id === id);
      if (!nodeToChange) return;

      nodeToChange.data = data;

      if (
        (nodeToChange.type === NodeType.WAIT_UNTIL &&
          nodeToChange.data.type === NodeType.WAIT_UNTIL) ||
        (nodeToChange.type === NodeType.USER_ATTRIBUTE &&
          nodeToChange.data.type === NodeType.USER_ATTRIBUTE)
      ) {
        const existedBranchEdges = state.edges.filter(
          (edge) => edge.source === nodeToChange.id
        );

        // prune disconnected branches
        for (const edge of existedBranchEdges) {
          if (
            !edge.data ||
            edge.type !== EdgeType.BRANCH ||
            edge.data.type !== EdgeType.BRANCH ||
            !(nodeToChange.data.branches as Branch[]).find(
              (branch) =>
                branch.id === (edge as Edge<BranchEdgeData>).data?.branch.id
            )
          ) {
            handlePruneNodeTree(state, edge.target);
          }
        }

        //connect new and update old branches
        for (const branch of nodeToChange.data.branches) {
          const existedChildrenEdge = existedBranchEdges.find(
            (edge) =>
              edge.data?.type === EdgeType.BRANCH &&
              edge.data.branch.id === branch.id
          );

          if (!existedChildrenEdge) {
            const newEmptyNodeUUID = uuid();
            state.nodes.push({
              id: newEmptyNodeUUID,
              type: NodeType.EMPTY,
              data: {},
              position: { x: 0, y: 0 },
            });
            state.edges.push({
              id: `b${branch.id}`,
              type: EdgeType.BRANCH,
              data: {
                type: EdgeType.BRANCH,
                branch,
              },
              source: nodeToChange.id,
              target: newEmptyNodeUUID,
            });
            continue;
          }

          existedChildrenEdge.data = { type: EdgeType.BRANCH, branch };
        }
        if (
          state.devModeState.status === ConnectionStatus.Connected &&
          !state.nodes.find((el) => el.id === state.devModeState.customerInNode)
        ) {
          const start = state.nodes.find((el) => el.type === NodeType.START);
          state.devModeState.requireMovementToStart = start?.id;
        }
        state.nodes = getLayoutedNodes(state.nodes, state.edges);
      }
    },
    removeNode(state, action: PayloadAction<string>) {
      handleRemoveNode(state, action.payload);

      if (state.devModeState.status === ConnectionStatus.Connected) {
        if (
          !state.nodes.find(
            (el) => el.id === state.devModeState.arrowPreSelectNode
          )
        ) {
          state.devModeState.arrowPreSelectNode = undefined;
        }
        if (
          !state.nodes.find((el) => el.id === state.devModeState.customerInNode)
        ) {
          const start = state.nodes.find((el) => el.type === NodeType.START);
          state.devModeState.requireMovementToStart = start?.id;
        }
      }
    },
    pruneNodeTree(state, action: PayloadAction<string>) {
      handlePruneNodeTree(state, action.payload);
    },
    setEdges(state, action: PayloadAction<Edge<EdgeData>[]>) {
      state.edges = action.payload;
      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    handleDevModeState(state, action: PayloadAction<DevModeStatePayload>) {
      if ("customerInNode" in action.payload) {
        const node = state.nodes.find(
          (el) => el.id === action.payload.customerInNode
        );
        if (node) {
          const availableNodes = getClosestNextAndPrevious(
            node,
            state.nodes,
            state.edges
          ).filter((el) => el.type !== NodeType.EMPTY);

          const start = state.nodes.find((el) => el.type === NodeType.START);

          if (node.type === NodeType.EXIT && start) {
            availableNodes.push(start);
          }

          action.payload.availableNodeToJump = availableNodes.map(
            (el) => el.id
          );

          state.devModeState.arrowPreSelectNode = undefined;
        }
      }

      state.devModeState = {
        ...state.devModeState,
        ...action.payload,
      };
    },
    recountAvailableNodes(state) {
      if (
        state.devModeState.status !== ConnectionStatus.Connected ||
        !state.devModeState.customerInNode
      )
        return;

      const node = state.nodes.find(
        (el) => el.id === state.devModeState.customerInNode
      );
      if (!node) return;

      const availableNodes = getClosestNextAndPrevious(
        node,
        state.nodes,
        state.edges
      ).filter((el) => el.type !== NodeType.EMPTY);

      const start = state.nodes.find((el) => el.type === NodeType.START);

      if (node.type === NodeType.EXIT && start) {
        availableNodes.push(start);
      }

      state.devModeState.availableNodeToJump = availableNodes.map(
        (el) => el.id
      );

      state.devModeState.arrowPreSelectNode = undefined;
    },
    resetDevMode(state) {
      state.devModeState = defaultDevMode;
    },
    handleDrawerAction(
      state,
      action: PayloadAction<{ id: string; action: string; stepId?: string }>
    ) {
      const { stepId } = action.payload;

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
            stepId,
          };
          break;
        case DrawerAction.SMS:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.SMS },
            stepId,
          };
          break;
        case DrawerAction.SLACK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.SLACK },
            stepId,
          };
          break;
        case DrawerAction.PUSH:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.PUSH },
            stepId,
          };
          break;
        case DrawerAction.WEBHOOK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.WEBHOOK },
            stepId,
          };
          break;
        case DrawerAction.CUSTOM_MODAL:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.MODAL },
            stepId,
          };
          break;
        case DrawerAction.TRACKER:
          nodeToChange.type = NodeType.TRACKER;
          nodeToChange.data = {
            type: NodeType.TRACKER,
            stepId,
          };
          break;
        case DrawerAction.JUMP_TO:
          nodeToChange.type = NodeType.JUMP_TO;
          nodeToChange.data = {
            type: NodeType.JUMP_TO,
            stepId,
          };
          handleJumpToTargettingNodeChange(state, nodeToChange.id);
          break;
        case DrawerAction.EXIT:
          nodeToChange.type = NodeType.EXIT;
          nodeToChange.data = {
            stepId,
          };
          break;
        case DrawerAction.WAIT_UNTIL:
          nodeToChange.type = NodeType.WAIT_UNTIL;
          nodeToChange.data = {
            type: NodeType.WAIT_UNTIL,
            branches: [
              {
                id: uuid(),
                type: BranchType.EVENT,
                conditions: [
                  {
                    name: "",
                    providerType: ProviderType.CUSTOM,
                    statements: [],
                    relationToNext: LogicRelation.OR,
                  },
                ],
              },
            ],
            stepId,
          };
          break;
        case DrawerAction.TIME_DELAY:
          nodeToChange.type = NodeType.TIME_DELAY;
          nodeToChange.data = {
            type: NodeType.TIME_DELAY,
            delay: {
              days: 0,
              hours: 0,
              minutes: 0,
            },
            stepId,
          };
          break;
        case DrawerAction.TIME_WINDOW:
          nodeToChange.type = NodeType.TIME_WINDOW;
          nodeToChange.data = {
            type: NodeType.TIME_WINDOW,
            from: undefined,
            to: undefined,
            stepId,
          };
          break;
        case DrawerAction.USER_ATTRIBUTE:
          nodeToChange.type = NodeType.USER_ATTRIBUTE;
          nodeToChange.data = {
            type: NodeType.USER_ATTRIBUTE,
            branches: [],
            stepId,
          };
          break;
        default:
          break;
      }

      if (
        !state.edges.some((edge) => edge.source === nodeToChange.id) &&
        !(
          [
            NodeType.JUMP_TO,
            NodeType.WAIT_UNTIL,
            NodeType.USER_ATTRIBUTE,
            NodeType.EXIT,
          ] as string[]
        ).includes(nodeToChange.type || "")
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
    selectNode(state, action: PayloadAction<string>) {
      state.nodes = applyNodeChanges(
        [
          ...state.nodes.map<NodeChange>((node) => ({
            type: "select",
            id: node.id,
            selected: false,
          })),
          { type: "select", id: action.payload, selected: true },
        ],
        state.nodes
      );
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
    setDragAction(state, action: PayloadAction<DragAction | undefined>) {
      state.dragAction = action.payload;
    },
    setStepperIndex(state, action: PayloadAction<0 | 1 | 2>) {
      state.stepperIndex = action.payload;
    },
    setSegmentsSettings(state, action: PayloadAction<SegmentsSettings>) {
      state.segments = action.payload;
    },
    setJourneyType(state, action: PayloadAction<JourneyType>) {
      state.journeyType = action.payload;
    },
    setIsViewMode(state, action: PayloadAction<boolean>) {
      state.isViewMode = action.payload;
    },
    setFlowStatus(state, action: PayloadAction<JourneyStatus>) {
      state.flowStatus = action.payload;
    },
    setShowSegmentsErrors(state, action: PayloadAction<boolean>) {
      state.showSegmentsErrors = action.payload;
    },
    setIsOnboarding(state, action: PayloadAction<boolean>) {
      state.isOnboarding = action.payload;
    },
    setRequireSaveEmit(state, action: PayloadAction<boolean>) {
      state.requireSaveEmit = action.payload;
    },
    addSidePanelError(state, action: PayloadAction<string>) {
      state.sidePanelErrors[action.payload] = true;
    },
    removeSidePanelError(state, action: PayloadAction<string>) {
      delete state.sidePanelErrors[action.payload];
    },
    clearSidePanelError(state) {
      state.sidePanelErrors = {};
    },
    addSegmentQueryError(state, action: PayloadAction<string>) {
      state.segmentQueryErrors[action.payload] = true;
    },
    removeSegmentQueryError(state, action: PayloadAction<string>) {
      delete state.segmentQueryErrors[action.payload];
    },
    clearSegmentPanelErrors(state) {
      state.segmentQueryErrors = {};
    },
    setIsOnboardingWaitUntilTooltipVisible(
      state,
      action: PayloadAction<boolean>
    ) {
      state.isOnboardingWaitUntilTooltipVisible = action.payload;
    },
    setIsOnboardingWaitUntilTimeSettingTooltipVisible(
      state,
      action: PayloadAction<boolean>
    ) {
      state.isOnboardingWaitUntilTimeSettingTooltipVisible = action.payload;
    },
    setJumpToTargettingNode(state, action: PayloadAction<string | undefined>) {
      handleJumpToTargettingNodeChange(state, action.payload);
    },
    setIsDrawerDisabled(state, action: PayloadAction<boolean>) {
      state.isDrawerDisabled = action.payload;
    },
    refreshFlowBuilder(state) {
      state.flowId = "";
      state.flowName = "";
      state.nodes = initialNodes.slice();
      state.edges = initialEdges.slice();
      state.isDragging = false;
      state.dragAction = undefined;
      state.stepperIndex = 0;
      state.segments = { type: SegmentsSettingsType.ALL_CUSTOMERS };
      state.journeyType = JourneyType.DYNAMIC;
      state.isViewMode = false;
      state.flowStatus = JourneyStatus.DRAFT;
      state.showSegmentsErrors = false;
      state.isOnboarding = false;
      state.isOnboardingWaitUntilTooltipVisible = false;
      state.jumpToTargettingNode = undefined;
      state.isDrawerDisabled = false;
    },
  },
});

export const {
  setFlowId,
  setFlowName,
  setNodes,
  loadVisualLayout,
  addInsertNodeBetween,
  transformEmptyNodeIntoInsertNode,
  transformInsertNodeIntoEmptyNode,
  clearInsertNodes,
  changeNodeData,
  removeNode,
  pruneNodeTree,
  setEdges,
  handleDrawerAction,
  selectNode,
  deselectNodes,
  setIsDragging,
  setDragAction,
  setStepperIndex,
  setSegmentsSettings,
  setJourneyType,
  setIsViewMode,
  setFlowStatus,
  setShowSegmentsErrors,
  handleDevModeState,
  resetDevMode,
  setIsOnboarding,
  setIsOnboardingWaitUntilTooltipVisible,
  setIsOnboardingWaitUntilTimeSettingTooltipVisible,
  setJumpToTargettingNode,
  setIsDrawerDisabled,
  refreshFlowBuilder,
  setRequireSaveEmit,
  addSidePanelError,
  removeSidePanelError,
  clearSidePanelError,
  recountAvailableNodes,
  addSegmentQueryError,
  removeSegmentQueryError,
  clearSegmentPanelErrors,
} = flowBuilderSlice.actions;

export { defaultDevMode };

export default flowBuilderSlice.reducer;
