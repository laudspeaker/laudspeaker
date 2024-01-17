import { JumpToNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setJumpToTargettingNode } from "reducers/flow-builder.reducer";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";

const JumpToSettings: FC<
  SidePanelComponentProps<JumpToNodeData> & { nodeId: string }
> = ({ nodeData, nodeId }) => {
  const nodeTypeToNameMap: Record<NodeType, string> = {
    [NodeType.START]: "Start",
    [NodeType.EMPTY]: "Empty",
    [NodeType.MESSAGE]: "Message",
    [NodeType.JUMP_TO]: "Jump to",
    [NodeType.EXIT]: "Exit",
    [NodeType.TIME_DELAY]: "Time delay",
    [NodeType.TIME_WINDOW]: "Time window",
    [NodeType.WAIT_UNTIL]: "Wait until",
    [NodeType.USER_ATTRIBUTE]: "User attribute",
    [NodeType.INSERT_NODE]: "Insert",
    [NodeType.TRACKER]: "Custom component",
    [NodeType.MULTISPLIT]: "Multisplit",
    [NodeType.EXPERIMENT]: "Experiment",
    [NodeType.PUSH]: "Push",
  };

  const { nodes } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const targetNode = nodes.find((node) => node.id === nodeData.targetId);

  return (
    <div className="flex justify-between gap-[10px] font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div>Jump to</div>
      <div className="max-w-[200px] w-full flex flex-col gap-[10px]">
        {targetNode && (
          <div className="px-[12px] py-[4px] border border-[#E5E7EB] bg-[#F3F4F6] font-roboto">
            {nodeTypeToNameMap[targetNode.type as NodeType] || "-"}
          </div>
        )}

        <Button
          type={ButtonType.SECONDARY}
          onClick={() => dispatch(setJumpToTargettingNode(nodeId))}
        >
          {targetNode ? "Reselect" : "Select"}
        </Button>
      </div>
    </div>
  );
};

export default JumpToSettings;
