import React, { FC, ReactNode, useState } from "react";
import { Node } from "reactflow";
import FlowBuilderButton from "../Elements/FlowBuilderButton";
import { NodeType } from "../FlowEditor";
import FlowBuilderDeleteModal from "../Modals/FlowBuilderDeleteModal";
import { messageFixtures } from "../Nodes/MessageNode";
import NodeData from "../Nodes/NodeData";
import MessageSettings from "./components/MessageSettings";

interface FlowBuilderSidePanelProps {
  selectedNode?: Node<NodeData>;
}

const FlowBuilderSidePanel: FC<FlowBuilderSidePanelProps> = ({
  selectedNode,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const nodeTypeToNameMap: Record<NodeType, string> = {
    [NodeType.EMPTY]: "",
    [NodeType.JUMP_TO]: "Jump to",
    [NodeType.MESSAGE]: "",
    [NodeType.START]: "",
    [NodeType.TIME_DELAY]: "Time delay",
    [NodeType.TIME_WINDOW]: "Time window",
    [NodeType.WAIT_UNTIL]: "Wait until",
  };

  const nodeToSettingsComponentMap: Record<string, ReactNode> = {
    [NodeType.MESSAGE]: <MessageSettings node={selectedNode} />,
  };

  return (
    <div
      className={`h-full bg-white border-[1px] border-[#E5E7EB] flex flex-col justify-between overflow-hidden ${
        selectedNode &&
        ![NodeType.EMPTY, NodeType.START].includes(
          selectedNode.type as NodeType
        )
          ? "w-[360px] min-w-[360px]"
          : " w-0"
      }`}
    >
      <div>
        <div className="p-[20px] border-b-[1px] flex flex-col gap-[5px]">
          <div className="font-inter font-semibold text-[20px] leading-[28px]">
            {selectedNode?.type
              ? selectedNode?.type === NodeType.MESSAGE &&
                selectedNode.data.template
                ? messageFixtures[selectedNode.data.template.type].text
                : nodeTypeToNameMap[selectedNode.type as NodeType]
              : ""}
          </div>
          <div className="font-inter font-normal text-[16px] leading-[24px] text-[#4B5563]">
            Description Description Description Des
          </div>
        </div>
        <div className="p-[20px]">
          {nodeToSettingsComponentMap[selectedNode?.type || ""]}
        </div>
      </div>
      <div className="min-h-[60px] h-[60px] py-[14px] px-[20px] border-t-[1px] flex justify-between items-center">
        <div
          className="font-roboto underline font-normal text-[14px] leading-[22px] select-none cursor-pointer"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete
        </div>
        <div className="flex justify-end items-center gap-[10px]">
          <FlowBuilderButton
            onClick={() => {}}
            className="!rounded-[2px] !text-[#111827] !bg-white !border-[1px] !border-[#E5E7EB]"
          >
            Cancel
          </FlowBuilderButton>
          <FlowBuilderButton className="!rounded-[2px]" onClick={() => {}}>
            Save
          </FlowBuilderButton>
        </div>
      </div>
      {selectedNode && (
        <FlowBuilderDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          selectedNode={selectedNode}
        />
      )}
    </div>
  );
};

export default FlowBuilderSidePanel;
