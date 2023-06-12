import { Transition } from "@headlessui/react";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import { messageFixtures } from "pages/FlowBuilderv2/Nodes/MessageNode";
import { NodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, ReactNode } from "react";
import { useAppSelector } from "store/hooks";
import MessageViewer from "./viewers/MessageViewer";
import TimeDelayViewer from "./viewers/TimeDelayViewer";
import TimeWindowViewer from "./viewers/TimeWindowViewer";
import UserAttributeViewer from "./viewers/UserAttributeViewer";
import WaitUntilViewer from "./viewers/WaitUntilViewer";

export interface SidePanelComponentProps<T extends NodeData = NodeData> {
  nodeData: T;
}

interface FlowViewerSidePanelProps {
  className?: string;
}

const FlowViewerSidePanel: FC<FlowViewerSidePanelProps> = ({ className }) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);

  const selectedNode = nodes.find((node) => node.selected);

  const nodeData = selectedNode?.data || {};

  const isOpen =
    selectedNode &&
    nodeData &&
    ![NodeType.EMPTY, NodeType.START].includes(selectedNode.type as NodeType);

  const nodeTypeToNameMap: Record<NodeType, string> = {
    [NodeType.START]: "",
    [NodeType.EMPTY]: "",
    [NodeType.MESSAGE]: "",
    [NodeType.JUMP_TO]: "Jump to",
    [NodeType.EXIT]: "",
    [NodeType.TIME_DELAY]: "Time delay",
    [NodeType.TIME_WINDOW]: "Time window",
    [NodeType.WAIT_UNTIL]: "Wait until",
    [NodeType.USER_ATTRIBUTE]: "User attribute",
  };

  const nodeTypeToComponentMap: Record<string, ReactNode> = {
    [NodeType.MESSAGE]: (
      <>
        {nodeData.type === NodeType.MESSAGE && (
          <MessageViewer nodeData={nodeData} />
        )}
      </>
    ),
    [NodeType.WAIT_UNTIL]: (
      <>
        {nodeData.type === NodeType.WAIT_UNTIL && (
          <WaitUntilViewer nodeData={nodeData} />
        )}
      </>
    ),
    [NodeType.TIME_DELAY]: (
      <>
        {nodeData.type === NodeType.TIME_DELAY && (
          <TimeDelayViewer nodeData={nodeData} />
        )}
      </>
    ),
    [NodeType.TIME_WINDOW]: (
      <>
        {nodeData.type === NodeType.TIME_WINDOW && (
          <TimeWindowViewer nodeData={nodeData} />
        )}
      </>
    ),
    [NodeType.USER_ATTRIBUTE]: (
      <>
        {nodeData.type === NodeType.USER_ATTRIBUTE && (
          <UserAttributeViewer nodeData={nodeData} />
        )}
      </>
    ),
  };

  return (
    <Transition
      show={!!isOpen}
      as="div"
      className={`h-[calc(100vh-108px)] min-w-[440px] w-[440px] fixed right-[-100%] bg-white border-l-[1px] border-[#E5E7EB] flex flex-col justify-between overflow-hidden ${
        className ? className : ""
      }`}
      enter="transition-all duration-300"
      enterFrom="right-[-100%]"
      enterTo="right-0"
      leave="transition-all duration-500"
      leaveTo="right-[-100%]"
      leaveFrom="right-0"
    >
      <div className="overflow-auto h-screen">
        <div className="px-[20px] pt-[20px] mb-[10px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[20px] leading-[28px]">
            {selectedNode?.type
              ? selectedNode.data.type === NodeType.MESSAGE &&
                selectedNode.data.template
                ? messageFixtures[selectedNode.data.template.type].text
                : nodeTypeToNameMap[selectedNode.type as NodeType]
              : ""}
          </div>

          <div className="font-inter font-normal text-[14px] leading-[22px] text-[#111827]">
            Description Description Description Des
          </div>
        </div>
        <div className="px-5">
          {nodeTypeToComponentMap[nodeData.type || ""]}
        </div>
      </div>
    </Transition>
  );
};

export default FlowViewerSidePanel;
