
export interface Edge {
  id: string;
  type: string;
  source: string;
  target: string;
  markerEnd: {
    type: string;
    width: number;
    height: number;
    strokeWidth: number;
  };
  sourceHandle: string;
  targetHandle: string | null;
  selected: boolean;
}

export interface Node {
  id: string;
  data: {
    nodeId: string;
    primary: boolean;
    messages: string[];
    audienceId: string;
    isSelected: boolean;
    needsUpdate: boolean;
    flowId: string;
    isTriggerDragging: boolean;
    isMessagesDragging: boolean;
    isConnecting: boolean;
    isNearToCursor: boolean;
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