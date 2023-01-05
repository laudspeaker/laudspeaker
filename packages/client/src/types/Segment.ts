import { InclusionCriteria } from "pages/Segment/MySegment";

export interface Segment {
  id: string;
  name: string;
  inclusionCriteria: InclusionCriteria;
  isFreezed: boolean;
  resources: any;
}
