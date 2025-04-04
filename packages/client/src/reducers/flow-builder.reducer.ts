import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addDays, getDay } from "date-fns";
import { capitalize } from "lodash";
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
  EventBranch,
  EventType,
  LogicRelation,
  MessageNodeData,
  MultisplitBranch,
  NodeData,
  TimeType,
  TimeWindowTypes,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";
import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";
import { PushBuilderData } from "pages/PushBuilder/PushBuilderContent";
import {
  applyNodeChanges,
  Edge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
} from "reactflow";
import { MessageType, ProviderType } from "types/Workflow";
import getClosestNextAndPrevious from "utils/getClosestNextAndPrevious";
import { v4 as uuid } from "uuid";
import { Attribute, AttributeType } from "pages/PeopleSettings/PeopleSettings";
import { dragActionsNotToDoBetweenNodes } from "pages/FlowBuilderv2/FlowPlugins/NodeDraggingProvider";

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

export enum MessageFromJourney {
  ANY = "ANY",
  WITH_TAG = "WITH_TAG",
}

export enum MessageGeneralComparison {
  HAS = "has",
  HAS_NOT = "has not",
}

export enum MessageEmailEventCondition {
  RECEIVED = "received",
  OPENED = "opened",
  CLICKED = "clicked",
}

export enum MessagePushEventCondition {
  RECEIVED = "received",
  OPENED = "opened",
}

export enum MessageSMSEventCondition {
  RECEIVED = "received",
  CLICK_LINK = "click_link",
}

export enum MessageInAPPEventCondition {
  RECEIVED = "received",
  OPENED = "opened",
}

export enum QueryStatementType {
  ATTRIBUTE = "Attribute",
  SEGMENT = "Segment",
  EVENT = "Event",
  EMAIL = "Email",
  PUSH = "Push",
  SMS = "SMS",
  IN_APP = "In-app message",
}

export const messageEventsCorelationWaitUntil: Record<
  | ProviderType.EMAIL_MESSAGE
  | ProviderType.SMS_MESSAGE
  | ProviderType.PUSH_MESSAGE
  | ProviderType.IN_APP_MESSAGE,
  {
    key:
      | MessageEmailEventCondition
      | MessageSMSEventCondition
      | MessagePushEventCondition
      | MessageInAPPEventCondition;
    title: string;
  }[]
> = {
  [ProviderType.EMAIL_MESSAGE]: Object.values(MessageEmailEventCondition).map(
    (el) => ({
      key: el,
      title: "is " + el,
    })
  ),
  [ProviderType.SMS_MESSAGE]: [
    {
      key: MessageSMSEventCondition.RECEIVED,
      title: "is " + MessageSMSEventCondition.RECEIVED,
    },
    {
      key: MessageSMSEventCondition.CLICK_LINK,
      title: "sms link is clicked",
    },
  ],
  [ProviderType.PUSH_MESSAGE]: Object.values(MessagePushEventCondition).map(
    (el) => ({
      key: el,
      title: "is " + el,
    })
  ),
  [ProviderType.IN_APP_MESSAGE]: Object.values(MessageInAPPEventCondition).map(
    (el) => ({
      key: el,
      title: "is " + el,
    })
  ),
};

export const WaitUntilMessageProviderCorelation: any = {
  [ProviderType.EMAIL_MESSAGE]: QueryStatementType.EMAIL.toLowerCase(),
  [ProviderType.SMS_MESSAGE]: QueryStatementType.SMS.toLowerCase(),
  [ProviderType.PUSH_MESSAGE]: QueryStatementType.PUSH.toLowerCase(),
  [ProviderType.IN_APP_MESSAGE]: QueryStatementType.IN_APP.toLowerCase(),
};

export type MessageEventTypes =
  | QueryStatementType.EMAIL
  | QueryStatementType.PUSH
  | QueryStatementType.SMS
  | QueryStatementType.IN_APP;

export interface GeneralSelectedType {
  key: string;
  title: string;
}

export interface MessageEventQuery {
  type: MessageEventTypes;
  from: GeneralSelectedType;
  eventCondition:
    | MessageEmailEventCondition
    | MessagePushEventCondition
    | MessageSMSEventCondition
    | MessageInAPPEventCondition;
  happenCondition: MessageGeneralComparison;
  fromSpecificMessage: GeneralSelectedType;
  tag?: string;
  time?: {
    comparisonType:
      | ComparisonType.BEFORE
      | ComparisonType.AFTER
      | ComparisonType.DURING;
    timeAfter?: string;
    timeBefore?: string;
    dateComparisonType: DateComparisonType;
  };
}

export enum ComparisonType {
  EQUALS = "is equal to",
  NOT_EQUALS = "is not equal to",
  OBJECT_KEY = "key",
  DURING = "during",
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
  DATE_TIME = "DateTime",
  ARRAY = "Array",
  OBJECT = "Object",
}

export function valueTypeToAttributeType(
  valueType: StatementValueType,
  possibleAttributeTypes: AttributeType[]
): AttributeType {
  const attribute = possibleAttributeTypes.find(
    (attr) => attr.name == valueType.toString()
  );
  if (!attribute)
    console.warn(
      `Attribute not found, possible attribute types: ${JSON.stringify(
        possibleAttributeTypes,
        null,
        2
      )}, valueType: ${valueType}`
    );
  else
    console.log(
      `Attribute found, possible attribute types: ${JSON.stringify(
        possibleAttributeTypes,
        null,
        2
      )}, valueType: ${valueType}`
    );
  return attribute!;
}

export const attributeTypeToStatementValueTypeMap: Record<
  string,
  StatementValueType
> = {
  String: StatementValueType.STRING,
  Number: StatementValueType.NUMBER,
  Boolean: StatementValueType.BOOLEAN,
  Email: StatementValueType.EMAIL,
  Date: StatementValueType.DATE,
  DateTime: StatementValueType.DATE_TIME,
  Array: StatementValueType.ARRAY,
  Object: StatementValueType.OBJECT,
};

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
    ComparisonType.DURING,
    ComparisonType.EXIST,
    ComparisonType.NOT_EXIST,
  ],
  [StatementValueType.DATE_TIME]: [
    ComparisonType.BEFORE,
    ComparisonType.AFTER,
    ComparisonType.DURING,
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

export enum DateComparisonType {
  ABSOLUTE = "absolute",
  RELATIVE = "relative",
}

export interface AttributeQueryStatement {
  type: QueryStatementType.ATTRIBUTE;
  key: string;
  valueType?: StatementValueType;
  attribute?: Attribute;
  comparisonType: ComparisonType;
  subComparisonType: ObjectKeyComparisonType;
  subComparisonValue: string;
  value: string;
  dateComparisonType: DateComparisonType;
}

export enum PerformedType {
  HasPerformed = "has performed",
  HasNotPerformed = "has not performed",
}

export interface EventQueryAdditionalProperty {
  key: string;
  valueType: StatementValueType;
  comparisonType: ComparisonType;
  subComparisonType: ObjectKeyComparisonType;
  subComparisonValue: string;
  value: string;
}

export interface EventQueryAdditionalProperties {
  comparison: QueryType;
  properties: EventQueryAdditionalProperty[];
}

export interface EventQueryStatement {
  type: QueryStatementType.EVENT;
  eventName: string;
  comparisonType: PerformedType;
  additionalProperties: EventQueryAdditionalProperties;
  value: number;
  time?: {
    comparisonType:
      | ComparisonType.BEFORE
      | ComparisonType.AFTER
      | ComparisonType.DURING;
    timeAfter?: string;
    timeBefore?: string;
    dateComparisonType: DateComparisonType;
  };
}

export interface SegmentQueryStatement {
  type: QueryStatementType.SEGMENT;
  segmentId: string;
}

export type QueryStatement =
  | AttributeQueryStatement
  | SegmentQueryStatement
  | EventQueryStatement
  | MessageEventQuery
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

export enum EntryTiming {
  WhenPublished = "WhenPublished",
  SpecificTime = "SpecificTime",
}

export enum EntryTimingFrequency {
  Once = "Once",
  Daily = "Daily",
  Weekly = "Weekly",
  Monthly = "Monthly",
}

export enum RecurrenceEndsOption {
  Never = "Never",
  After = "After",
  SpecificDate = "SpecificDate",
}

export interface EntryTimingRecurrence {
  repeatEvery: number;
  endsOn: RecurrenceEndsOption;
  endAdditionalValue?: number | string; // string as Date (Ends after number occurnecs or on Specific string Date )
  weeklyOn: number[]; // Day of week number
}

export interface EntryTimingSpecificTime {
  startDate: string;
  frequency: EntryTimingFrequency;
  recurrence: EntryTimingRecurrence;
  userLocalTimeZone: boolean;
}

export enum JourneyEnrollmentType {
  CurrentAndFutureUsers = "CurrentAndFutureUsers",
  OnlyCurrent = "OnlyCurrent",
  OnlyFuture = "OnlyFuture",
}

export interface EntryTimingSettings {
  type: EntryTiming;
  time?: EntryTimingSpecificTime;
}

export interface JourneyEntrySettings {
  entryTiming: EntryTimingSettings;
  enrollmentType: JourneyEnrollmentType;
}

export enum JourneySettingsQuietFallbackBehavior {
  NextAvailableTime = "NextAvailableTime",
  Abort = "Abort",
}

export interface JourneySettingsQuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  fallbackBehavior: JourneySettingsQuietFallbackBehavior;
}

export enum MaxOptions {
  Ten = "10",
  Fifty = "50",
  OneHundred = "100",
  FiveHundred = "500",
  OneThousand = "1000",
  FiveThousand = "5000",
  TenThousand = "10000",
  TwentyFiveThousand = "25000",
  FiftyThousand = "50000",
  OneHundredThousand = "100000",
  TwoHundredFiftyThousand = "250000",
  FiveHundredThousand = "500000",
}

export interface JourneySettingsMaxUserEntries {
  enabled: boolean;
  maxEntries: MaxOptions;
  limitOnEverySchedule: boolean;
}

export interface JourneySettingsMaxMessageSends {
  enabled: boolean;
  maxUsersReceive?: MaxOptions;
  maxSendRate?: MaxOptions;
}

export interface JourneySettingsEnableFrequencyCapping {
  enabled: boolean;
}

export enum JourneySettingsConversionTrackingTimeLimitUnit {
  Days = "Days",
}

export interface JourneySettingsConversionTrackingTimeLimit {
  unit: JourneySettingsConversionTrackingTimeLimitUnit;
  value: number;
}

export interface JourneySettingsConversionTracking {
  enabled: boolean;
  events: string[];
  timeLimit: JourneySettingsConversionTrackingTimeLimit;
}

export interface JourneySettings {
  tags: string[];
  quietHours: JourneySettingsQuietHours;
  maxEntries: JourneySettingsMaxUserEntries;
  maxMessageSends: JourneySettingsMaxMessageSends;
  frequencyCapping: JourneySettingsEnableFrequencyCapping;
  conversionTracking: JourneySettingsConversionTracking;
}

export interface TemplateInlineEditor {
  selectedNode: Node<NodeData, string | undefined>;
  templateId?: string;
  type: MessageType;
  needsCallbackUpdate?: {
    id: number | string;
    name: string;
    data: PushBuilderData;
  };
}

export interface FlowBuilderState {
  flowId: string;
  flowName: string;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  isDragging: boolean;
  isMoving: boolean;
  dragAction?: DragAction;
  stepperIndex: 0 | 1 | 2 | 3;
  segments: SegmentsSettings;
  journeyType: JourneyType;
  isViewMode: boolean;
  flowStatus: JourneyStatus;
  templateInlineCreation?: TemplateInlineEditor;
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
  journeyEntrySettings: JourneyEntrySettings;
  journeySettings: JourneySettings;
  availableTags: string[];
  isStarting: boolean;
  copiedNodes: Node<NodeData>[];
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

export const defaultJourneyEntrySettings = {
  entryTiming: {
    type: EntryTiming.WhenPublished,
    time: undefined,
  },
  enrollmentType: JourneyEnrollmentType.CurrentAndFutureUsers,
};

export const defaultJourneySettings = {
  tags: [],
  maxEntries: {
    enabled: false,
    limitOnEverySchedule: false,
    maxEntries: MaxOptions.FiveHundredThousand,
  },
  quietHours: {
    enabled: false,
    startTime: "00:00",
    endTime: "08:00",
    fallbackBehavior: JourneySettingsQuietFallbackBehavior.NextAvailableTime,
  },
  maxMessageSends: {
    enabled: false,
    maxSendRate: undefined,
    maxUsersReceive: undefined,
  },
  frequencyCapping: {
    enabled: false,
  },
  conversionTracking: {
    enabled: false,
    events: [],
    timeLimit: {
      unit: JourneySettingsConversionTrackingTimeLimitUnit.Days,
      value: 3,
    },
  },
};

const initialState: FlowBuilderState = {
  flowId: "",
  flowName: "",
  nodes: getLayoutedNodes(initialNodes.slice(), initialEdges.slice()),
  edges: initialEdges.slice(),
  isDragging: false,
  isMoving: false,
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
  availableTags: [],
  journeyEntrySettings: defaultJourneyEntrySettings,
  journeySettings: defaultJourneySettings,
  isStarting: false,
  copiedNodes: [],
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

const handleAttachNodesToBranch = (state: FlowBuilderState, nodeId: string) => {
  // add existing following nodes to the first branch of the nodeId.
  // used to attach a node to an experiment branch when it's inserted between nodes.

  const node = state.nodes.find((n) => n.id === nodeId);

  if (!node) return;

  const nodeIndex = state.nodes.indexOf(node);

  const branchSource =
    "branches" in node.data ? node.data.branches?.[0]?.id : undefined; // get the id of the first branch of the node

  const targetNode = state.nodes[nodeIndex + 1]; //get the node that needs to be attached to the branch

  state.edges = state.edges.map((edge) => {
    //change experiment branch target to the existing node that goes to the branch
    if (branchSource && edge.id?.includes(branchSource) && targetNode.id) {
      return { ...edge, target: targetNode.id };
    }

    return edge;
  });
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
    nodeIn.type === NodeType.MULTISPLIT ||
    nodeIn.type === NodeType.USER_ATTRIBUTE ||
    nodeIn.type === NodeType.EXPERIMENT
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

      console.log(edgeBetween, "edgeBetween");
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
        (nodeToChange.type === NodeType.MULTISPLIT &&
          nodeToChange.data.type === NodeType.MULTISPLIT) ||
        (nodeToChange.type === NodeType.EXPERIMENT &&
          nodeToChange.data.type === NodeType.EXPERIMENT)
      ) {
        const existedBranchEdges = state.edges.filter(
          (edge) => edge.source === nodeToChange.id
        );

        if (
          nodeToChange.type === NodeType.MULTISPLIT &&
          nodeToChange.data.type === NodeType.MULTISPLIT
        ) {
          if (
            !nodeToChange.data.branches.some((el) => el.isOthers) &&
            nodeToChange.data.branches.length > 0
          ) {
            nodeToChange.data.branches.push({
              id: uuid(),
              type: BranchType.MULTISPLIT,
              isOthers: true,
            });
          } else if (nodeToChange.data.branches.some((el) => el.isOthers)) {
            const otherNodeIndex = nodeToChange.data.branches.findIndex(
              (el) => el.isOthers
            );
            if (nodeToChange.data.branches.length - 1 > 0) {
              if (otherNodeIndex !== nodeToChange.data.branches.length - 1) {
                const element = nodeToChange.data.branches.splice(
                  otherNodeIndex,
                  1
                )[0];
                nodeToChange.data.branches.push(element);
              }
            }
          }
        }

        // prune disconnected branches
        for (const edge of existedBranchEdges) {
          if (
            (!edge.data ||
              edge.type !== EdgeType.BRANCH ||
              edge.data.type !== EdgeType.BRANCH ||
              !(nodeToChange.data.branches as Branch[]).find(
                (branch) =>
                  branch.id === (edge as Edge<BranchEdgeData>).data?.branch.id
              )) &&
            nodeToChange.type !== NodeType.EXPERIMENT
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
            const newNode = {
              id: newEmptyNodeUUID,
              type: NodeType.EMPTY,
              data: {},
              position: { x: 0, y: 0 },
            };

            state.nodes.push(newNode);

            const isPastedNode = state.copiedNodes.length;

            const newEdge = {
              id: `b${isPastedNode ? "c" : ""}${branch.id}`,
              type: EdgeType.BRANCH,
              data: {
                type: EdgeType.BRANCH,
                branch,
              },
              source: nodeToChange.id,
              target: newEmptyNodeUUID,
            };

            state.edges.push(newEdge);

            continue;
          }

          existedChildrenEdge.data = { type: EdgeType.BRANCH, branch };
        }

        if (NodeType.EXPERIMENT === nodeToChange.type) {
          handleAttachNodesToBranch(state, nodeToChange.id);
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
      action: PayloadAction<{
        id: string;
        action: DrawerAction;
        stepId?: string;
        copiedId?: string;
        index?: number;
      }>
    ) {
      const { stepId, copiedId } = action.payload;

      const nodeToChangeIndex = state.nodes.findIndex(
        (node) => node.id === action.payload.id
      );

      const newNodeId = uuid();

      const isMultisplit = DrawerAction.MULTISPLIT === action.payload.action;
      const isWaitUntil = DrawerAction.WAIT_UNTIL === action.payload.action;
      const isExperiment = DrawerAction.EXPERIMENT === action.payload.action;
      const isBranchParentNode = isMultisplit || isWaitUntil || isExperiment;

      const isFirstCopiedNode = action.payload.index === 0;

      const isEmptyBranchParent =
        (isMultisplit || isWaitUntil || isExperiment) &&
        (action.payload.index || 0) + 1 === state.copiedNodes.length;

      let branchIndex = 0;
      const pastedNode = state.copiedNodes.find((node) => node.id === copiedId);

      const pastedNodeData = pastedNode?.data as MessageNodeData;
      console.log(pastedNodeData, "pastedNodeData");
      let pastedNodeBranches = pastedNodeData?.branches;
      console.log(pastedNodeBranches, "pastedNodeBranches");

      const pastedNodeFromState = state.nodes.find((node) =>
        state.copiedNodes?.find((copiedNode) =>
          copiedNode?.id ? copiedNode?.id === node.id : false
        )
      );
      console.log(isFirstCopiedNode, "isFirstCopiedNode");

      //handle One branch

      console.log(
        pastedNodeBranches,
        "pastedNodeBranches pastedNodeBranches",
        pastedNodeBranches?.length
      );
      if (
        isBranchParentNode &&
        pastedNodeBranches &&
        pastedNodeBranches?.length
      ) {
        console.log("CHANGING BRANCHES");
        const copiedNodesBranches = pastedNodeFromState?.data?.branches;
        const copiedBranchesEdges = state.edges.filter((edge) =>
          copiedNodesBranches?.find(
            (copiedBranch) => copiedBranch?.id === edge.data?.branch?.id
          )
        );
        const copiedNodesBranchEdge = copiedBranchesEdges?.filter((edge) =>
          state.copiedNodes.find((node) => node.id === edge.target)
        );

        console.log(
          copiedBranchesEdges?.length,
          copiedBranchesEdges?.[0]?.id,
          copiedBranchesEdges?.[1]?.id,
          "copiedBranchesEdges"
        );

        const branches = pastedNodeBranches?.map((branchNode, idx) => {
          if (
            !!copiedNodesBranchEdge?.find(
              (edge) => edge.data?.branch?.id === branchNode.id
            ) ||
            isEmptyBranchParent ||
            isExperiment
          ) {
            const newBranchId = uuid();
            return { ...branchNode, id: `b${newBranchId}` };
          }
          return null;
        });
        console.log(branches, "branchesbranchesbranches");
        pastedNodeBranches = branches?.filter(Boolean);
      }

      const pastedNodeTargetEdge = state.edges.find(
        (edge) => edge.target === copiedId
      );
      const pastedNodeTargetEdgeBranchId =
        pastedNodeTargetEdge?.data?.branch?.id;

      const isBranch = !!pastedNodeFromState?.data?.branches?.find(
        (branch) => branch?.id === pastedNodeTargetEdgeBranchId
      );

      const isBranchNode = !!(
        state.copiedNodes.find(
          (node) =>
            node.type === DrawerAction.MULTISPLIT ||
            node.type === DrawerAction.WAIT_UNTIL ||
            node.type === DrawerAction.EXPERIMENT
        ) &&
        action.payload.index &&
        !isBranchParentNode &&
        isBranch
      );

      if (
        (copiedId && !isFirstCopiedNode && !!nodeToChangeIndex) ||
        isEmptyBranchParent
      ) {
        console.log(
          nodeToChangeIndex,
          "nodeToChangeIndex",
          action.payload.index
        );

        //Paste a node into a correct place
        state.nodes.splice(nodeToChangeIndex + (action.payload.index || 0), 0, {
          id: newNodeId,
          type: NodeType.EMPTY,
          data: {},
          position: {
            x: 0,
            y: 0,
          },
        });
        console.log(newNodeId, "newNodeId!newNodeId");

        // 1. Find index of a branch inside multisplit
        // 2. How to detect it?

        let firstBranchNode = null;

        let nodeId = copiedId;
        let limit = 0; //set limit so the function doesn't block the rest of the code

        while (
          pastedNodeFromState &&
          !firstBranchNode &&
          limit < 10 &&
          !isBranchNode
        ) {
          const previousNodeTargetEdge = state.edges.find(
            (edge) => edge.target === nodeId
          );

          console.log(previousNodeTargetEdge, "previousNodeTargetEdgeWHILE");

          if (previousNodeTargetEdge) {
            nodeId = previousNodeTargetEdge?.source;
            console.log(nodeId, "nodeId WHILE");
            if (previousNodeTargetEdge.data?.branch?.id) {
              firstBranchNode = previousNodeTargetEdge.data?.branch?.id;
            }
          }

          limit++;
        }

        branchIndex = pastedNodeFromState
          ? pastedNodeFromState?.data?.branches?.findIndex(
              (branch) => branch.id === firstBranchNode
            ) || 0
          : 0;

        console.log(branchIndex, "branchIndex WHILE");

        const sourceEdge = state.edges.find((edge) => {
          console.log(edge.source, "edge.source");
          console.log(action.payload.index, "action.payload.index");
          console.log(nodeToChangeIndex, "nodeToChangeIndex");
          return (
            edge.source ===
              state.nodes?.[
                nodeToChangeIndex +
                  (action.payload.index || 1) -
                  1 +
                  (branchIndex ? branchIndex + 1 : 0)
              ]?.id || 0
          );
        });

        console.log(sourceEdge, "sourceEdge");

        // if (sourceEdge && !isBranchNode) {
        if (sourceEdge && !isBranchNode) {
          // if (action.payload.action !== "jumpTo") {
          sourceEdge.target = newNodeId;
        }

        const pastedNodeNotToBeBetweenNodes =
          dragActionsNotToDoBetweenNodes.includes(action.payload.action);

        console.log(
          pastedNodeNotToBeBetweenNodes,
          "pastedNodeNotToBeBetweenNodes"
        );

        if (
          copiedId &&
          !pastedNodeNotToBeBetweenNodes &&
          !isBranchNode &&
          !branchIndex &&
          !isEmptyBranchParent
        ) {
          const newEdgeId = uuid();
          console.log("PUSH1");
          state.edges.push({
            id: `${newEdgeId}`,
            type: EdgeType.PRIMARY,
            source: newNodeId,
            target:
              state.nodes[nodeToChangeIndex + 1 + (action.payload.index || 0)]
                ?.id,
          });
        }
      }

      // console.log(action.payload, emptyNode.id, "emptyNode");
      const nodeToChange = state.nodes.find((node) =>
        copiedId && !isFirstCopiedNode
          ? node.id === newNodeId
          : node.id === action.payload.id
      );
      console.log(nodeToChange, "nodeToChange");
      if (!nodeToChange) return;

      console.log(isBranchNode, "isBranchNode");
      const addBranches = ({
        currentBranch,
        currentBranchParentNode,
        hasNoNextNode,
      }) => {
        if (!currentBranchParentNode) return;
        if (currentBranchParentNode.type === NodeType.EMPTY) {
          currentBranchParentNode.type = action.payload.action;
        }
        const branchEdgeData = {
          type: EdgeType.BRANCH,
          branch: {
            id: currentBranch?.id || "",
            type:
              currentBranchParentNode.type === NodeType.MULTISPLIT
                ? BranchType.MULTISPLIT
                : currentBranchParentNode.type === NodeType.EXPERIMENT
                ? BranchType.EXPERIMENT
                : BranchType.EVENT,
            ...(currentBranch?.conditions
              ? {
                  conditions: currentBranch?.conditions,
                }
              : currentBranch?.ratio
              ? { ratio: currentBranch?.ratio }
              : { isOthers: true }),
          },
        };
        console.log("PUSH3");
        state.edges.push({
          id: `${uuid()}`,
          source: currentBranchParentNode.id,
          target: hasNoNextNode ? uuid() : newNodeId,
          type: EdgeType.BRANCH,
          data: branchEdgeData,
        });
      };

      const addEmptyBranchNodes = ({
        sourceId,
        index = 0,
      }: {
        sourceId?: string;
        index: number;
      }) => {
        console.log(sourceId, "sourceId");
        const targetEdge = state.edges.filter(
          (edge) => edge.source === sourceId
        )?.[index];

        const hasTarget =
          targetEdge?.target &&
          state.nodes.find((node) => node.id === targetEdge.target);

        console.log(targetEdge, "targetEdge", hasTarget?.id);
        if (targetEdge && !hasTarget) {
          const emptyNodeId = uuid();
          state.nodes.push({
            id: emptyNodeId,
            type: NodeType.EMPTY,
            data: {},
            position: {
              x: 0,
              y: 0,
            },
          });
          targetEdge.target = emptyNodeId;
        }
      };

      if (isBranchNode) {
        addEmptyBranchNodes({ sourceId: newNodeId, index: 0 });
      }

      if (pastedNodeFromState && copiedId && isBranchNode) {
        const currentBranchParentNode = state.nodes.findLast((node) => {
          return (
            node.type === DrawerAction.MULTISPLIT ||
            node.type === DrawerAction.WAIT_UNTIL ||
            node.type === DrawerAction.EXPERIMENT
          );
        });
        const currentBranchIndex =
          pastedNodeFromState?.data?.branches?.findIndex(
            (branch) => branch?.id === pastedNodeTargetEdgeBranchId
          );

        if (currentBranchParentNode) {
          const currentBranch =
            currentBranchParentNode?.data?.branches?.[currentBranchIndex];

          if (currentBranch) {
            addBranches({
              currentBranch,
              currentBranchParentNode,
              hasNoNextNode: isEmptyBranchParent,
            });
          }
        }
        //check if there are more nodes in copied
        const isLastPastedNode =
          (action.payload.index || 0) + 1 === state.copiedNodes.length;

        //check if it's the last branch to paste
        const notPastedBranches =
          currentBranchParentNode?.data?.branches?.filter(
            (branch) =>
              !state.edges.find((edge) => edge.data?.branch?.id === branch.id)
          );

        const isAllBranchesPasted =
          currentBranchParentNode?.data?.branches?.filter((branch) =>
            state.edges.find((edge) => edge.data?.branch?.id === branch.id)
          )?.length === currentBranchParentNode?.data?.branches?.length;

        const hasEmptyBranch = !isAllBranchesPasted && isLastPastedNode;
      }

      if (isEmptyBranchParent && pastedNodeBranches && copiedId) {
        pastedNodeBranches.map((currentBranch, index) => {
          const currentParentNode = nodeToChange;
          if (currentParentNode) {
            addBranches({
              currentBranch,
              currentBranchParentNode: currentParentNode,
              hasNoNextNode: true,
            });
            addEmptyBranchNodes({
              sourceId: currentParentNode.id,
              index,
            });
          }
        });
      }

      //check if there are more nodes in copied
      //check if it's the last branch to paste

      const currentBranchParentNode = state.nodes.findLast((node) => {
        console.log(node.type, "TYPE", action.payload.action);
        return node.type === DrawerAction.EXPERIMENT;
      });

      if (currentBranchParentNode) {
        const isLastPastedNode =
          (action.payload.index || 0) + 1 === state.copiedNodes.length;

        const notPastedBranches =
          currentBranchParentNode?.data?.branches?.filter(
            (branch) =>
              !state.edges.find((edge) => edge.data?.branch?.id === branch.id)
          );

        if (
          !!notPastedBranches &&
          isLastPastedNode &&
          currentBranchParentNode
        ) {
          notPastedBranches.map((branch) => {
            addBranches({
              currentBranch: branch,
              currentBranchParentNode,
              hasNoNextNode: true,
            });
            addEmptyBranchNodes({
              sourceId: currentBranchParentNode.id,
              index: currentBranchParentNode?.data?.branches?.length - 1 || 1,
            });
          });
        }
      }

      let newMessageNodeName = "";

      const messageNodes = state.nodes.filter((node) => node.type == "message");
      let postFixValue = messageNodes.length;

      const pastedNodeName = pastedNodeData?.customName;

      newMessageNodeName = !!pastedNodeName
        ? pastedNodeName
        : `${capitalize(action.payload.action)} ${postFixValue + 1}`;

      while (
        messageNodes.find(
          /* eslint-disable */
          (node) =>
            (node?.data as MessageNodeData)?.customName === newMessageNodeName
        )
      ) {
        postFixValue++;
        const cleanPastedNodeName = pastedNodeName?.split(" (")[0];
        let postFixValuePasted =
          parseInt(pastedNodeName?.split(" (")[1]?.replace(")", "") || "") || 0;
        postFixValuePasted++;

        let newPastedMessageNodeName = `${cleanPastedNodeName} (${postFixValuePasted})`;

        while (
          messageNodes.find(
            (node) =>
              (node?.data as MessageNodeData)?.customName ===
              newPastedMessageNodeName
          )
        ) {
          postFixValuePasted++;
          newPastedMessageNodeName = `${cleanPastedNodeName} (${postFixValuePasted})`;
        }

        newMessageNodeName =
          (pastedNodeName && newPastedMessageNodeName) ||
          `${capitalize(action.payload.action)} ${postFixValue}`;
      }

      const pastedNodeTemplate = pastedNodeData?.template?.selected;
      const pastedNodeTemplateSelected = pastedNodeTemplate
        ? { selected: pastedNodeTemplate }
        : {};

      //targetId for jumpTo
      const pastedNodeTargetId = pastedNodeData?.targetId || null;
      const pastedNodeTimeDelay = pastedNodeData?.delay || null;

      switch (action.payload.action) {
        case DrawerAction.EMAIL:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: {
              type: MessageType.EMAIL,
              ...pastedNodeTemplateSelected,
            },
            customName: newMessageNodeName,
            stepId,
          };
          break;
        case DrawerAction.SMS:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: { type: MessageType.SMS, ...pastedNodeTemplateSelected },
            customName: newMessageNodeName,
            stepId,
          };
          break;
        case DrawerAction.SLACK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: {
              type: MessageType.SLACK,
              ...pastedNodeTemplateSelected,
            },
            customName: newMessageNodeName,
            stepId,
          };
          break;
        case DrawerAction.PUSH:
          nodeToChange.type = NodeType.PUSH;
          nodeToChange.data = {
            type: NodeType.PUSH,
            template: { type: MessageType.PUSH, ...pastedNodeTemplateSelected },
            customName: newMessageNodeName,
            stepId,
          };
          break;
        case DrawerAction.WEBHOOK:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: {
              type: MessageType.WEBHOOK,
              ...pastedNodeTemplateSelected,
            },
            stepId,
            customName: newMessageNodeName,
          };
          break;
        case DrawerAction.CUSTOM_MODAL:
          nodeToChange.type = NodeType.MESSAGE;
          nodeToChange.data = {
            type: NodeType.MESSAGE,
            template: {
              type: MessageType.MODAL,
            },
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
            targetId: pastedNodeTargetId,
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
            branches: pastedNodeBranches ? pastedNodeBranches : [],
            stepId,
          };
          break;
        case DrawerAction.TIME_DELAY:
          nodeToChange.type = NodeType.TIME_DELAY;
          nodeToChange.data = {
            type: NodeType.TIME_DELAY,
            delay: pastedNodeTimeDelay || {
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
            from: pastedNodeData?.from || undefined,
            to: pastedNodeData?.to || undefined,
            fromTime: pastedNodeData?.fromTime || "12:00",
            toTime: pastedNodeData?.toTime || "23:59",
            onDays: pastedNodeData?.onDays || [...new Array(7)].map(() => 0),
            windowType: TimeWindowTypes.SPEC_DATES,
            stepId,
          };
          break;
        case DrawerAction.MULTISPLIT:
          nodeToChange.type = NodeType.MULTISPLIT;
          nodeToChange.data = {
            type: NodeType.MULTISPLIT,
            stepId,
            branches: pastedNodeBranches ? pastedNodeBranches : [],
          };
          break;
        case DrawerAction.EXPERIMENT:
          nodeToChange.type = NodeType.EXPERIMENT;
          nodeToChange.data = {
            type: NodeType.EXPERIMENT,
            stepId,
            branches: pastedNodeBranches
              ? pastedNodeBranches
              : [
                  {
                    id: uuid(),
                    type: BranchType.EXPERIMENT,
                    ratio: 0.5,
                  },
                  {
                    id: uuid(),
                    type: BranchType.EXPERIMENT,
                    ratio: 0.5,
                  },
                ],
          };
          break;
        default:
          break;
      }
      console.log(copiedId, action.payload.action === "jumpTo", "jumpTo");
      if (copiedId && action.payload.action === "jumpTo") {
        handleJumpToTargettingNodeChange(state, undefined);
      }

      if (NodeType.MULTISPLIT === nodeToChange.type && !copiedId) {
        // filter all nodes that are multisplit or will become multisplit and empty
        const branchNodes = state.nodes.filter(
          (node) =>
            node.type === NodeType.EMPTY || node.type === NodeType.MULTISPLIT
        );
        console.log(branchNodes, "branchNodes");
        // find the first edge that is not a multisplit branch and should become multisplit branch
        const edgeToChange = state.edges.find((edge) => {
          const correspondingNode = branchNodes.find((node) => {
            return edge.source === node.id && edge.type !== EdgeType.BRANCH;
          });
          return correspondingNode;
        });
        console.log(edgeToChange?.id, "edgeToChange");
        state.edges = state.edges.map((edge) => {
          if (edge.id === edgeToChange?.id) {
            return {
              ...edge,
              type: EdgeType.BRANCH,
              data: {
                type: EdgeType.BRANCH,
                branch: {
                  id: edge.id,
                  type: BranchType.MULTISPLIT,
                  isOthers: true,
                },
              },
            };
          } else {
            return edge;
          }
        });
      }

      if (NodeType.WAIT_UNTIL === nodeToChange.type && !copiedId) {
        // filter all nodes that are wait until or will become wait until and empty
        const branchNodes = state.nodes.filter(
          (node) =>
            node.type === NodeType.EMPTY || node.type === NodeType.WAIT_UNTIL
        );

        // find the first edge that is not a wait until branch and should become wait until branch
        const edgeToChange = state.edges.find((edge) => {
          const correspondingNode = branchNodes.find((node) => {
            return edge.source === node.id && edge.type !== EdgeType.BRANCH;
          });
          return correspondingNode;
        });

        state.edges = state.edges.map((edge) => {
          if (edge.id === edgeToChange?.id) {
            return {
              ...edge,
              type: EdgeType.BRANCH,
              data: {
                type: EdgeType.BRANCH,
                branch: {
                  id: edge.id,
                  type: BranchType.EVENT,
                  conditions: [
                    {
                      type: EventType.ANALYTICS,
                      name: "",
                      providerType: ProviderType.CUSTOM,
                      relationToNext: LogicRelation.OR,
                      statements: [],
                    },
                  ],
                },
              },
            };
          } else {
            return edge;
          }
        });

        //add a default branch to the node
        state.nodes = state.nodes.map((node) => {
          if (node.id === nodeToChange?.id) {
            return {
              ...node,
              data: {
                ...node.data,
                type: NodeType.WAIT_UNTIL,
                branches: [
                  {
                    id:
                      state.edges.find(
                        (edge) =>
                          edge.id.includes(nodeToChange.id) &&
                          edge.type === EdgeType.BRANCH
                      )?.id || uuid(),
                    type: BranchType.EVENT,
                    conditions: [
                      {
                        type: EventType.ANALYTICS,
                        name: "",
                        providerType: ProviderType.CUSTOM,
                        relationToNext: LogicRelation.OR,
                        statements: [],
                      },
                    ],
                  },
                ],
              },
            };
          } else {
            return node;
          }
        });
      }

      //   // if (othersBranchEdge) {
      //   //   console.log(othersBranchEdge, "isOthersBranchEdge");
      //   //   const othersBranchNode = state.nodes.find(
      //   //     (node) => othersBranchEdge?.target === node.id
      //   //   );
      //   //   console.log(othersBranchNode, "isOthersBranchNode");
      //   //   if (othersBranchNode) {
      //   //     state.nodes = state.nodes.filter(
      //   //       (node) => node.id !== othersBranchNode.id
      //   //     );

      //   //     state.nodes.push(othersBranchNode);

      //   //     state.edges = state.edges.filter(
      //   //       (edge) => edge.id !== othersBranchEdge?.id
      //   //     );
      //   //     state.edges.push(othersBranchEdge);
      //   //   }
      //   // }
      // }

      if (
        !state.edges.some((edge) => edge.source === nodeToChange.id) &&
        !(
          [
            NodeType.JUMP_TO,
            NodeType.WAIT_UNTIL,
            NodeType.USER_ATTRIBUTE,
            NodeType.EXIT,
            NodeType.MULTISPLIT,
            NodeType.EXPERIMENT,
          ] as string[]
        ).includes(nodeToChange.type || "")
      ) {
        console.log("CREATING EMPTY");
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
        console.log("PUSH2");
        state.edges.push({
          id: `${nodeToChange.id}-${newNodeId}`,
          type: EdgeType.PRIMARY,
          source: nodeToChange.id,
          target: newNodeId,
        });
      }

      console.log(copiedId, "copiedId OPEN");
      console.log(nodeToChange.type, "nodeToChange.type");

      if (!copiedId) {
        console.log("OPEN");
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
      }

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
    setIsMoving(state, action: PayloadAction<boolean>) {
      state.isMoving = action.payload;
    },
    setDragAction(state, action: PayloadAction<DragAction | undefined>) {
      state.dragAction = action.payload;
    },
    setStepperIndex(state, action: PayloadAction<0 | 1 | 2 | 3>) {
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
    setAvailableTags(state, action: PayloadAction<string[]>) {
      state.availableTags = action.payload;
    },
    setShowSegmentsErrors(state, action: PayloadAction<boolean>) {
      if (!Object.keys(state.segmentQueryErrors).length)
        state.showSegmentsErrors = false;
      else state.showSegmentsErrors = action.payload;
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
    setJourneySettingsTags(state, action: PayloadAction<string[]>) {
      state.journeySettings.tags = Array.from(new Set(action.payload));
    },
    setJourneySettingsMaxEntries(
      state,
      action: PayloadAction<JourneySettingsMaxUserEntries>
    ) {
      state.journeySettings.maxEntries = action.payload;
    },
    setJourneySettingsQuietHours(
      state,
      action: PayloadAction<JourneySettingsQuietHours>
    ) {
      state.journeySettings.quietHours = action.payload;
    },
    setJourneyFrequencyCappingRules(
      state,
      action: PayloadAction<JourneySettingsEnableFrequencyCapping>
    ) {
      state.journeySettings.frequencyCapping = action.payload;
    },

    setMaxMessageSends(
      state,
      action: PayloadAction<JourneySettingsMaxMessageSends>
    ) {
      state.journeySettings.maxMessageSends = action.payload;
    },
    clearSidePanelError(state) {
      state.sidePanelErrors = {};
    },
    setJourneyEntryTimingType(state, action: PayloadAction<EntryTiming>) {
      state.journeyEntrySettings.entryTiming.type = action.payload;
      if (action.payload === EntryTiming.WhenPublished) {
        state.journeyEntrySettings.entryTiming.time = undefined;
      } else {
        state.journeyEntrySettings.entryTiming.time = {
          frequency: EntryTimingFrequency.Once,
          startDate: new Date().toISOString(),
          recurrence: {
            endsOn: RecurrenceEndsOption.Never,
            repeatEvery: 1,
            weeklyOn: [...new Array(7)].map(() => 0),
            endAdditionalValue: undefined,
          },
          userLocalTimeZone: false,
        };
      }
    },
    setJourneyEntryTimingTime(
      state,
      action: PayloadAction<EntryTimingSpecificTime>
    ) {
      let weeklyOn = null;
      let defaultAdditionalValue: number | string | undefined | null = null;
      if (state.journeyEntrySettings.entryTiming?.time) {
        if (
          state.journeyEntrySettings.entryTiming?.time.frequency !==
            action.payload.frequency &&
          action.payload.frequency === EntryTimingFrequency.Weekly
        ) {
          const now = getDay(new Date());
          weeklyOn = [...new Array(7)].map(() => 0);
          weeklyOn[now === 0 ? 6 : now - 1] = 1;
        }
        if (
          state.journeyEntrySettings.entryTiming?.time.recurrence.endsOn !==
          action.payload.recurrence.endsOn
        ) {
          if (action.payload.recurrence.endsOn === RecurrenceEndsOption.After)
            defaultAdditionalValue = 1;
          else if (
            action.payload.recurrence.endsOn ===
            RecurrenceEndsOption.SpecificDate
          )
            defaultAdditionalValue = addDays(new Date(), 5).toISOString();
          else defaultAdditionalValue = undefined;
        }
      }

      state.journeyEntrySettings.entryTiming.time = action.payload;

      if (weeklyOn) {
        state.journeyEntrySettings.entryTiming.time = {
          ...state.journeyEntrySettings.entryTiming?.time,
          recurrence: {
            ...state.journeyEntrySettings.entryTiming?.time.recurrence,
            weeklyOn: weeklyOn,
          },
        };
      }

      if (defaultAdditionalValue !== null) {
        state.journeyEntrySettings.entryTiming.time = {
          ...state.journeyEntrySettings.entryTiming?.time,
          recurrence: {
            ...state.journeyEntrySettings.entryTiming?.time.recurrence,
            endAdditionalValue: defaultAdditionalValue,
          },
        };
      }
    },
    setJourneyEntryEnrollmentType(
      state,
      action: PayloadAction<JourneyEnrollmentType>
    ) {
      state.journeyEntrySettings.enrollmentType = action.payload;
    },
    setJourneyEntrySettings(
      state,
      action: PayloadAction<JourneyEntrySettings | undefined>
    ) {
      if (action.payload === undefined)
        state.journeyEntrySettings = defaultJourneyEntrySettings;
      else state.journeyEntrySettings = action.payload;
    },
    setJourneySettings(
      state,
      action: PayloadAction<JourneySettings | undefined>
    ) {
      if (action.payload === undefined)
        state.journeySettings = defaultJourneySettings;
      else state.journeySettings = action.payload;
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
    setTemplateInlineCreator(
      state,
      action: PayloadAction<TemplateInlineEditor | undefined>
    ) {
      state.templateInlineCreation = action.payload;
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
    setIsStarting(state, action: PayloadAction<boolean>) {
      state.isStarting = action.payload;
    },
    setJourneySettingsConversionTracking(
      state,
      action: PayloadAction<JourneySettingsConversionTracking>
    ) {
      if (action.payload === undefined)
        state.journeySettings.conversionTracking =
          defaultJourneySettings.conversionTracking;
      else state.journeySettings.conversionTracking = action.payload;

      state.journeySettings.conversionTracking.events = Array.from(
        new Set(state.journeySettings.conversionTracking.events)
      );
    },
    moveNodeToNewPosition(state, action: PayloadAction<{ nodeId: string }>) {
      // handleClearInsertNodes(state);

      const { nodeId } = action.payload;

      const insertNode = state.nodes.find((node) => {
        return node.type === NodeType.INSERT_NODE;
      });

      if (!insertNode) return;

      const nodesToMove = state.nodes.filter((node) => node.id === nodeId);

      if (!nodesToMove.length || nodesToMove.length > 1) return;

      const nodeToMove = nodesToMove[0];

      if (!nodeToMove) return;

      const insertNodeIndex = state.nodes.findIndex(
        (node) => node.type === NodeType.INSERT_NODE
      );

      const nodeToMoveIndex = state.nodes.findIndex((node) =>
        node?.id.includes(nodeId)
      );

      state.nodes = state.nodes.filter((node) => node.id !== nodeId);

      state.nodes.splice(insertNodeIndex, 0, nodeToMove);

      // handleClearInsertNodes(state);

      const nodeToMoveIndexWithInsertNode = state.nodes.findIndex((node) =>
        node?.id.includes(nodeId)
      );

      const edgesToRemove: Edge<EdgeData>[] = [];

      state.edges = state.edges.map((edge, _, edges) => {
        const index =
          nodeToMoveIndex >= insertNodeIndex
            ? nodeToMoveIndex + 1
            : nodeToMoveIndex;
        if (!(edge && insertNode && nodeId && nodeToMove)) return edge;
        //find insert node
        //find find edge with insert node target
        //change target to nodeToMove
        if (edge.target === insertNode.id) {
          return { ...edge, target: nodeToMove.id };
        }
        //find insert node
        //find find edge with insert node source
        //change source to nodeToMove
        if (edge.source === insertNode.id) {
          return { ...edge, source: nodeToMove.id };
        }

        // find edge with nodeId source
        // change source to nodeToMove previous element
        if (edge.source === nodeId) {
          const nodeToMovePreviousNode = state.nodes[index - 1];

          if (nodeToMovePreviousNode) {
            const edgeToRemove = edges.find(
              (edge) => edge.source === nodeToMovePreviousNode.id
            );
            if (edgeToRemove) {
              edgesToRemove.push(edgeToRemove);
            }
            return { ...edge, source: nodeToMovePreviousNode.id };
          }
        }

        //find edge with nodeId target
        //change target to nodeToMove next element
        if (edge.target === nodeId) {
          const nodeToMoveNextNode = state.nodes[index + 1];
          if (nodeToMoveNextNode) {
            return { ...edge, target: nodeToMoveNextNode.id };
          }
        }
        return edge;
      });
      const shouldKeepEdge = (
        edge: Edge<EdgeData>,
        nodes: Node<NodeData>[],
        edgesToRemove: Edge<EdgeData>[]
      ): boolean => {
        return (
          nodes.some((node) => node.id === edge.source) &&
          nodes.some((node) => node.id === edge.target) &&
          edgesToRemove.every((edgeToRemove) => edgeToRemove.id !== edge.id)
        );
      };

      state.edges = state.edges.filter((edge) =>
        shouldKeepEdge(edge, state.nodes, edgesToRemove)
      );

      state.nodes = state.nodes.filter(
        (node) => node.type !== NodeType.INSERT_NODE
      );
      // state.edges = getConnectedEdges(state.nodes, state.edges);
      // console.log(state.edges.length, state.edges);
      // handleClearInsertNodes(state);
      state.nodes = getLayoutedNodes(state.nodes, state.edges);
    },
    copyNodes(state, action: PayloadAction<{ nodes: Node<NodeData>[] }>) {
      const newNodes = action.payload.nodes.filter(
        (node) => node.type !== NodeType.EMPTY && node.type !== NodeType.EXIT
      );
      state.copiedNodes = newNodes;
    },
    pasteNodes() {},
    clearCopyNodes(state) {
      state.copiedNodes = [];
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
  setIsMoving,
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
  setJourneyEntryTimingType,
  setJourneyEntryTimingTime,
  setJourneyEntryEnrollmentType,
  setJourneySettingsTags,
  setJourneyEntrySettings,
  setJourneySettings,
  setJourneySettingsMaxEntries,
  setJourneySettingsQuietHours,
  setMaxMessageSends,
  setAvailableTags,
  setTemplateInlineCreator,
  setJourneyFrequencyCappingRules,
  setIsStarting,
  setJourneySettingsConversionTracking,
  moveNodeToNewPosition,
  copyNodes,
  pasteNodes,
  clearCopyNodes,
} = flowBuilderSlice.actions;

export { defaultDevMode };

export default flowBuilderSlice.reducer;
