import { Eventtype } from '@/api/events/dto/posthog-event.dto';

export interface WorkflowTick {
  workflowId: string;
  jobIds: (string | number)[];
  status: string;
  failureReason: string;
}

export interface PosthogKeysPayload {
  type?: Eventtype;
  event?: any;
}
