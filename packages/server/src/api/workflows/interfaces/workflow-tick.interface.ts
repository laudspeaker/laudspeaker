import { Eventtype } from '../../events/dto/posthog-event.dto';
import { Template } from '../../templates/entities/template.entity';

export interface WorkflowTick {
  workflowId: string;
  jobIds: (string | number)[];
  templates?: Template[];
  status: string;
  failureReason: string;
  allJobData?: any[];
}

export interface PosthogKeysPayload {
  type?: Eventtype;
  event?: Record<string, any>;
}
