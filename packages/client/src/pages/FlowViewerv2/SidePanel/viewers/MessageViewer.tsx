import { messageFixtures } from "pages/FlowBuilderv2/Nodes/MessageNode";
import { MessageNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";

const MessageViewer: FC<SidePanelComponentProps<MessageNodeData>> = ({
  nodeData,
}) => {
  const fixtures = messageFixtures[nodeData.template.type];

  return (
    <div className="w-[200px] h-[60px] px-[8px] flex items-center gap-[5px] border-[1px] border-[#4B5563] rounded-[4px]">
      <div>{fixtures.icon}</div>
      <div>{nodeData.template.selected?.name || "Unknown template"}</div>
    </div>
  );
};

export default MessageViewer;
