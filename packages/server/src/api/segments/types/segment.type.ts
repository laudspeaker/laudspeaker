export enum ConditionalType {
    and = "and",
    or = "or",
  }
  
  interface Condition {
    attribute: string;
    condition?: string;
    value: string;
  }
  
  export interface InclusionCriteria {
    conditionalType?: ConditionalType;
    conditions: Condition[];
  }