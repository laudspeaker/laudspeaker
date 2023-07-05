import { MarkerType } from "reactflow";

export enum TriggerType {
  EVENT = "eventBased",
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
}

export enum MessageType {
  EMAIL = "email",
  SLACK = "slack",
  SMS = "sms",
  FIREBASE = "firebase",
  PUSH = "firebase",
  WEBHOOK = "webhook",
  MODAL = "modal",
}

export enum EventConditionElementsFilter {
  TEXT = "text",
  TAG_NAME = "tag name",
}

export enum FilterByOption {
  CUSTOMER_KEY = "customer key",
  ELEMENTS = "elements",
}

export interface EventCondition {
  value: any;
  filterBy: FilterByOption;
  attribute?: string;
  condition?: string;
  key?: string;
  type?: string;
  comparisonType?: string;
  relationWithNext?: "and" | "or";
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
  Posthog = "posthog",
  Custom = "custom",
}

export interface Trigger {
  id: string;
  title: string;
  type: TriggerType;
  source?: string;
  dest?: string[];
  providerType?: ProviderType;
  providerParams?: string | "track" | "page";
  properties?: EventProps;
}

export interface Edge {
  id: string;
  type: "smoothstep";
  source: string;
  target: string;
  markerEnd: {
    type: MarkerType;
    width: number;
    height: number;
    strokeWidth: number;
  };
  sourceHandle: string;
  targetHandle: string | null;
}

export interface Node {
  id: string;
  data: {
    nodeId: string;
    primary: boolean;
    messages: { type: string; templateId: number }[];
    triggers: Trigger[];
    dataTriggers?: Trigger[];
    audienceId: string;
  };
  type: string;
  width: number;
  height: number;
  dragging: boolean;
  position: {
    x: number;
    y: number;
  };
  selected: boolean;
  positionAbsolute: {
    x: number;
    y: number;
  };
}

export interface VisualLayout {
  edges: Edge[];
  nodes: Node[];
  triggers: Trigger[];
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
  latestSave: string;
  enrolledCustomers?: number;
}
