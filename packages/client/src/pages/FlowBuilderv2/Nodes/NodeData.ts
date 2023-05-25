import { MessageType } from "types/Workflow";

export enum BranchType {
  EVENT = "event",
  MAX_TIME = "maxTime",
}

export enum ComparisonType {
  EQUALS = "equals",
}

export enum LogicRelation {
  AND = "and",
  OR = "or",
}

export interface Statement {
  key: string;
  comparisonType: ComparisonType;
  value: string;
}

export interface Condition {
  statements: Statement[];
  relationToNext: LogicRelation;
}

export interface EventBranch {
  type: BranchType.EVENT;
  conditions: Condition[];
}

export enum TimeType {
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
}

export interface CommonMaxTimeBranch {
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
  waitFrom: Date;
  waitTo: Date;
}

export type MaxTimeBranch = TimeDelayBranch | TimeWindowBranch;

export type Branch = EventBranch | MaxTimeBranch;

export default interface NodeData {
  template?: { type: MessageType; selected?: { id: number; name: string } };
  branches?: Branch[];
  temporary?: boolean;
  stats?: {
    sent: number;
    delivered: number;
    clickedPercentage: number;
    wssent: number;
    openedPercentage: number;
  };
}
