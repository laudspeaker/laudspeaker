import { Edge, Node } from 'reactflow';

export enum EdgeType {
  PRIMARY = 'primary',
  BRANCH = 'branch',
}

export enum TriggerType {
  EVENT = 'eventBased',
  TIME_DELAY = 'timeDelay',
  TIME_WINDOW = 'timeWindow',
}

export enum NodeType {
  START = 'start',
  EMPTY = 'empty',
  MESSAGE = 'message',
  JUMP_TO = 'jumpTo',
  EXIT = 'exit',
  WAIT_UNTIL = 'waitUntil',
  TIME_DELAY = 'timeDelay',
  TIME_WINDOW = 'timeWindow',
  USER_ATTRIBUTE = 'userAttribute',
  MULTISPLIT = 'multisplit',
  INSERT_NODE = 'insertNode',
  TRACKER = 'tracker',
  PUSH = 'push',
  EXPERIMENT = 'experiment',
}

export enum MessageType {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  FIREBASE = 'firebase',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  MODAL = 'modal',
}

export enum EventConditionElementsFilter {
  TEXT = 'text',
  TAG_NAME = 'tag name',
}

export enum FilterByOption {
  CUSTOMER_KEY = 'property',
  ELEMENTS = 'element',
}

export interface EventCondition {
  value: any;
  filterBy: FilterByOption;
  attribute?: string;
  condition?: string;
  key?: string;
  type?: string;
  comparisonType?: string;
  relationWithNext?: 'and' | 'or';
  elementOrder?: number;
  filter?: EventConditionElementsFilter;
  isArray?: boolean;
}

export interface EventProps {
  conditions: EventCondition[];
  eventTime?: string;
  delayTime?: string;
  specificTime?: string;
  fromTime?: string;
  toTime?: string;
}

export enum ProviderType {
  Posthog = 'posthog',
  Custom = 'custom',
  Tracker = 'tracker',
}

export interface Trigger {
  id: string;
  title: string;
  type: TriggerType;
  source?: string;
  dest?: string[];
  providerType?: ProviderType;
  providerParams?: string | 'track' | 'page';
  properties?: EventProps;
}

export interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  isPaused: boolean;
  isStopped: boolean;
  isDeleted: boolean;
  visualLayout: VisualLayout;
  isDynamic: boolean;
  filter?: { id: string };
}

export enum ComparisonType {
  EQUALS = 'equals',
}

export enum StatementValueType {
  STRING = 'String',
  NUMBER = 'Number',
  BOOLEAN = 'Boolean',
  Email = 'Email',
}

export enum BranchType {
  EVENT = 'event',
  MAX_TIME = 'maxTime',
  ATTRIBUTE = 'attribute',
  WU_ATTRIBUTE = 'wu_attribute',
  MESSAGE = 'message',
  MULTISPLIT = 'multisplit',
}

export enum LogicRelation {
  AND = 'and',
  OR = 'or',
}

export interface Statement {
  key: string;
  comparisonType: ComparisonType;
  type: StatementValueType;
  value: string;
}

export interface Condition {
  name: string;
  providerType: ProviderType;
  statements: Statement[];
  relationToNext: LogicRelation;
}

export interface CommonBranch {
  id: string;
}

export interface EventBranch extends CommonBranch {
  type: BranchType.EVENT;
  conditions: Condition[];
}

export enum TimeType {
  TIME_DELAY = 'timeDelay',
  TIME_WINDOW = 'timeWindow',
}

export interface CommonMaxTimeBranch extends CommonBranch {
  type: BranchType.MAX_TIME;
}

export interface DelayData {
  days: number;
  hours: number;
  minutes: number;
}

export interface TimeDelayBranch extends CommonMaxTimeBranch {
  timeType: TimeType.TIME_DELAY;
  delay: DelayData;
}

export interface TimeWindowBranch extends CommonMaxTimeBranch {
  timeType: TimeType.TIME_WINDOW;
  waitFrom: string;
  waitTo: string;
}

export type MaxTimeBranch = TimeDelayBranch | TimeWindowBranch;

export type WaitUntilBranch = EventBranch | MaxTimeBranch;

export interface AttributeStatement {
  key: string;
  comparisonType: ComparisonType;
  value: string;
}

export interface AttributeCondition {
  statements: AttributeStatement[];
  relationToNext: LogicRelation;
}

export interface AttributeBranch extends CommonBranch {
  type: BranchType.ATTRIBUTE;
  attributeConditions: AttributeCondition[];
}

export type Branch = EventBranch | MaxTimeBranch | AttributeBranch;

export interface CommonNodeData {
  stepId?: string;
  temporary?: boolean;
  stats?: {
    sent: number;
    delivered: number;
    clickedPercentage: number;
    wssent: number;
    openedPercentage: number;
  };
}

export interface MessageNodeData extends CommonNodeData {
  type: NodeType.MESSAGE;
  template: { type: MessageType; selected?: { id: number; name: string } };
}

export interface WaitUntilNodeData extends CommonNodeData {
  type: NodeType.WAIT_UNTIL;
  branches: WaitUntilBranch[];
}

export interface TimeDelayNodeData extends CommonNodeData {
  type: NodeType.TIME_DELAY;
  delay: DelayData;
}

export interface TimeWindowNodeData extends CommonNodeData {
  type: NodeType.TIME_WINDOW;
  from: string;
  to: string;
}

export interface UserAttributeNodeData extends CommonNodeData {
  type: NodeType.USER_ATTRIBUTE;
  branches: AttributeBranch[];
}

export interface AnotherNodeData extends CommonNodeData {
  type?: Exclude<
    NodeType,
    | NodeType.MESSAGE
    | NodeType.WAIT_UNTIL
    | NodeType.TIME_DELAY
    | NodeType.TIME_WINDOW
    | NodeType.USER_ATTRIBUTE
  >;
}

export type NodeData =
  | MessageNodeData
  | WaitUntilNodeData
  | TimeDelayNodeData
  | TimeWindowNodeData
  | UserAttributeNodeData
  | AnotherNodeData;

export interface BranchEdgeData {
  type: EdgeType.BRANCH;
  branch: Branch;
}

export interface AnotherEdgeData {
  type: Exclude<EdgeType, EdgeType.BRANCH>;
}

export type EdgeData = BranchEdgeData | AnotherEdgeData;

export interface VisualLayout {
  edges: Edge<EdgeData>[];
  nodes: Node<NodeData>[];
}
