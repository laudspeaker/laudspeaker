import { EdgeType } from "../FlowEditor";
import { Branch } from "../Nodes/NodeData";

export interface BranchEdgeData {
  type: EdgeType.BRANCH;
  branch: Branch;
}

export interface AnotherEdgeData {
  type: Exclude<EdgeType, EdgeType.BRANCH>;
}

export type EdgeData = BranchEdgeData | AnotherEdgeData;
