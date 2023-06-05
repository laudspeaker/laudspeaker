import { MessageType, ProviderType } from "types/Workflow";
import { NodeType } from "../FlowEditor";

export enum BranchType {
  EVENT = "event",
  MAX_TIME = "maxTime",
  ATTRIBUTE = "attribute",
}

export enum ComparisonType {
  EQUALS = "equals",
}

export enum StatementValueType {
  STRING = "String",
  NUMBER = "Number",
  BOOLEAN = "Boolean",
  Email = "Email",
}

export enum LogicRelation {
  AND = "and",
  OR = "or",
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
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
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
