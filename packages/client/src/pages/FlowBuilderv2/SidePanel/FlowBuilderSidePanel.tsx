import { Transition } from "@headlessui/react";
import React, { FC, ReactNode, useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { changeNodeData, deselectNodes } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import deepCopy from "utils/deepCopy";
import Button, { ButtonType } from "../Elements/Button";
import { NodeType } from "../FlowEditor";
import FlowBuilderDeleteModal from "../Modals/FlowBuilderDeleteModal";
import { messageFixtures } from "../Nodes/MessageNode";
import { NodeData } from "../Nodes/NodeData";
import MessageSettings from "./settings/MessageSettings";
import TimeDelaySettings from "./settings/TimeDelaySettings";
import TimeWindowSettings from "./settings/TimeWindowSettings";
import UserAttributeSettings from "./settings/UserAttributeSettings";
import WaitUntilSettings from "./settings/WaitUntilSettings";

export interface SidePanelComponentProps<T extends NodeData = NodeData> {
  nodeData: T;
  setNodeData: (nodeData: T) => void;
}

interface FlowBuilderSidePanelProps {
  className?: string;
}

const FlowBuilderSidePanel: FC<FlowBuilderSidePanelProps> = ({ className }) => {
  const { nodes } = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const selectedNode = nodes.find((node) => node.selected);

  const [nodeData, setNodeData] = useState<NodeData>(
    deepCopy({ ...selectedNode?.data })
  );

  useEffect(() => {
    setNodeData(deepCopy({ ...selectedNode?.data }));
  }, [selectedNode]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const nodeTypeToNameMap: Record<NodeType, string> = {
    [NodeType.START]: "",
    [NodeType.EMPTY]: "",
    [NodeType.MESSAGE]: "",
    [NodeType.JUMP_TO]: "Jump to",
    [NodeType.EXIT]: "Exit",
    [NodeType.TIME_DELAY]: "Time delay",
    [NodeType.TIME_WINDOW]: "Time window",
    [NodeType.WAIT_UNTIL]: "Wait until",
    [NodeType.USER_ATTRIBUTE]: "User attribute",
    [NodeType.INSERT_NODE]: "",
  };

  const nodeToSettingsComponentMap: Record<string, ReactNode> = {
    [NodeType.MESSAGE]: (
      <>
        {nodeData.type === NodeType.MESSAGE && (
          <MessageSettings nodeData={nodeData} setNodeData={setNodeData} />
        )}
      </>
    ),
    [NodeType.WAIT_UNTIL]: (
      <>
        {nodeData.type === NodeType.WAIT_UNTIL && (
          <WaitUntilSettings nodeData={nodeData} setNodeData={setNodeData} />
        )}
      </>
    ),
    [NodeType.TIME_DELAY]: (
      <>
        {nodeData.type === NodeType.TIME_DELAY && (
          <TimeDelaySettings nodeData={nodeData} setNodeData={setNodeData} />
        )}
      </>
    ),
    [NodeType.TIME_WINDOW]: (
      <>
        {nodeData.type === NodeType.TIME_WINDOW && (
          <TimeWindowSettings nodeData={nodeData} setNodeData={setNodeData} />
        )}
      </>
    ),
    [NodeType.USER_ATTRIBUTE]: (
      <>
        {nodeData.type === NodeType.USER_ATTRIBUTE && (
          <UserAttributeSettings
            nodeData={nodeData}
            setNodeData={setNodeData}
          />
        )}
      </>
    ),
  };

  const onCancel = () => {
    dispatch(deselectNodes());
  };

  const onSave = () => {
    if (selectedNode)
      dispatch(changeNodeData({ id: selectedNode.id, data: nodeData }));

    dispatch(deselectNodes());
  };

  const isOpen =
    selectedNode &&
    ![NodeType.EMPTY, NodeType.START, NodeType.INSERT_NODE].includes(
      selectedNode.type as NodeType
    );

  return (
    <>
      {isOpen && (
        <div
          className="fixed top-[106px] left-0 bg-[#111827] bg-opacity-20 w-full h-screen"
          onClick={onCancel}
        />
      )}

      <Transition
        show={!!isOpen}
        as="div"
        className={`h-[calc(100vh-108px)] min-w-[360px] w-[360px] fixed  right-[-100%] bg-white border-l-[1px] border-[#E5E7EB] flex flex-col justify-between overflow-hidden ${
          className ? className : ""
        }`}
        enter="transition-all duration-300"
        enterFrom="right-[-100%]"
        enterTo="right-0"
        leave="transition-all duration-500"
        leaveTo="right-[-100%]"
        leaveFrom="right-0"
      >
        <div className="h-full relative flex flex-col justify-stretch">
          <div className="p-[20px] border-b-[1px] flex flex-col gap-[5px]">
            <div className="font-inter font-semibold text-[20px] leading-[28px]">
              {selectedNode?.type
                ? selectedNode.data.type === NodeType.MESSAGE &&
                  selectedNode.data.template
                  ? messageFixtures[selectedNode.data.template.type].text
                  : nodeTypeToNameMap[selectedNode.type as NodeType]
                : ""}
            </div>
            <div className="font-inter font-normal text-[12px] leading-[20px] text-[#4B5563]">
              Description Description Description Des
            </div>
          </div>
          <div className="p-[20px] h-full max-h-full mb-[60px] overflow-y-hidden">
            <Scrollbars>
              {nodeToSettingsComponentMap[selectedNode?.type || ""]}
            </Scrollbars>
          </div>
        </div>
        <div className="absolute bottom-0 w-full min-h-[60px] h-[60px] py-[14px] px-[20px] border-t-[1px] flex justify-between items-center">
          <Button
            type={ButtonType.LINK}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>

          {selectedNode?.type !== NodeType.EXIT && (
            <div className="flex justify-end items-center gap-[10px]">
              <Button type={ButtonType.SECONDARY} onClick={onCancel}>
                Cancel
              </Button>
              <Button type={ButtonType.PRIMARY} onClick={onSave}>
                Save
              </Button>
            </div>
          )}
        </div>
        {selectedNode && (
          <FlowBuilderDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            selectedNode={selectedNode}
          />
        )}
      </Transition>
    </>
  );
};

export default FlowBuilderSidePanel;
