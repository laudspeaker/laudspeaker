import { MessageType } from "types/Workflow";

export default interface NodeData {
  template?: { type: MessageType; selected?: { id: string; name: string } };
  stats?: {
    sent: number;
    delivered: number;
    clickedPercentage: number;
    wssent: number;
    openedPercentage: number;
  };
}
