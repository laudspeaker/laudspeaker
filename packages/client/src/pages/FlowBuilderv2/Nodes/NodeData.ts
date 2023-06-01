import { MessageType, ProviderType } from "types/Workflow";
import { NodeType } from "../FlowEditor";

export enum BranchType {
  EVENT = "event",
  MAX_TIME = "maxTime",
}

export enum ComparisonType {
  EQUALS = "equals",
}

export enum StatementValueType {
  NUMBER = "number",
}

export enum LogicRelation {
  AND = "and",
  OR = "or",
}

export interface Statement {
  key: string;
  comparisonType: ComparisonType;
  valueType: StatementValueType;
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

export interface TimeDelayBranch extends CommonMaxTimeBranch {
  timeType: TimeType.TIME_DELAY;
  delay: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export interface TimeWindowBranch extends CommonMaxTimeBranch {
  timeType: TimeType.TIME_WINDOW;
  waitFrom: string;
  waitTo: string;
}

export type MaxTimeBranch = TimeDelayBranch | TimeWindowBranch;

export type Branch = EventBranch | MaxTimeBranch;

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
  branches: Branch[];
}

export interface AnotherNodeData extends CommonNodeData {
  type?: Exclude<NodeType, NodeType.MESSAGE | NodeType.WAIT_UNTIL>;
}

export type NodeData = MessageNodeData | WaitUntilNodeData | AnotherNodeData;
//  {
//   template?: { type: MessageType; selected?: { id: number; name: string } };
//   branches?: Branch[];
//   temporary?: boolean;
//   stats?: {
//     sent: number;
//     delivered: number;
//     clickedPercentage: number;
//     wssent: number;
//     openedPercentage: number;
//   };
// }
