export interface WorkflowTick {
  workflowId: string;
  jobIds: (string | number)[];
  status: string;
  failureReason: string;
}
