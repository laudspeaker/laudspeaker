import { MarkerType } from "react-flow-renderer";

export enum TriggerType {
  EVENT = "eventBased",
  TIME_DELAY = "timeDelay",
  TIME_WINDOW = "timeWindow",
}

export interface EventCondition {
  value: any;
  attribute?: string;
  condition?: string;
  key?: string;
  type?: string;
  comparisonType?: string;
  relationWithNext?: "and" | "or";
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

export enum ProviderTypes {
  Posthog = "posthog",
  Custom = "custom",
}

export interface Trigger {
  id: string;
  title: string;
  type: TriggerType;
  source?: string;
  dest?: string[];
  providerType?: ProviderTypes;
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
    audienceId: string;
    isSelected: boolean;
    needsUpdate: boolean;
    dataTriggers?: Trigger[];
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
}

export interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  isPaused: boolean;
  isStopped: boolean;
  isDeleted: boolean;
  rules: string[];
  visualLayout: VisualLayout;
  isDynamic: boolean;
  segment?: { id: string };
}
