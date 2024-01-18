import { Transition } from "@headlessui/react";
import { NodeType } from "pages/FlowBuilderv2/FlowEditor";
import FlowBuilderDeleteModal from "pages/FlowBuilderv2/Modals/FlowBuilderDeleteModal";
import { messageFixtures } from "pages/FlowBuilderv2/Nodes/MessageNode";
import { NodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import TimeDelaySettings from "pages/FlowBuilderv2/SidePanel/settings/TimeDelaySettings";
import TimeWindowSettings from "pages/FlowBuilderv2/SidePanel/settings/TimeWindowSettings";
import UserAttributeSettings from "pages/FlowBuilderv2/SidePanel/settings/UserAttributeSettings";
import WaitUntilSettings from "pages/FlowBuilderv2/SidePanel/settings/WaitUntilSettings";
import React, { FC, ReactNode, useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { changeNodeData, deselectNodes } from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import deepCopy from "utils/deepCopy";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import MessageSettings from "./settings/MessageSettings";

export interface SidePanelComponentProps<T extends NodeData = NodeData> {
  nodeData: T;
  setNodeData: (nodeData: T) => void;
  setIsError: (value: boolean) => void;
  showErrors: boolean;
}

interface OnboardingSidePanelProps {
  className?: string;
  isSaveDisabled?: boolean;
  onSaveClick?: () => void;
}

const OnboardingSidePanel: FC<OnboardingSidePanelProps> = ({
  className,
  isSaveDisabled,
  onSaveClick,
}) => {
  const { nodes, isOnboardingWaitUntilTooltipVisible } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useAppDispatch();

  const selectedNode = nodes.find((node) => node.selected);

  const [nodeData, setNodeData] = useState<NodeData>(
    deepCopy({ ...selectedNode?.data })
  );

  useEffect(() => {
    setNodeData(deepCopy({ ...selectedNode?.data }));
  }, [selectedNode]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isError, setIsError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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
    [NodeType.TRACKER]: "Custom component",
    [NodeType.MULTISPLIT]: "Multisplit",
    [NodeType.PUSH]: "Push",
    [NodeType.INSERT_NODE]: "",
    [NodeType.EXPERIMENT]: "Experiment",
  };

  const nodeToSettingsComponentMap: Record<string, ReactNode> = {
    [NodeType.MESSAGE]: (
      <>
        {nodeData.type === NodeType.MESSAGE && (
          <MessageSettings
            nodeData={nodeData}
            setNodeData={setNodeData}
            setIsError={setIsError}
            showErrors={showErrors}
          />
        )}
      </>
    ),
    [NodeType.WAIT_UNTIL]: (
      <>
        {nodeData.type === NodeType.WAIT_UNTIL && (
          <WaitUntilSettings
            nodeData={nodeData}
            setNodeData={setNodeData}
            setIsError={setIsError}
            showErrors={showErrors}
          />
        )}
      </>
    ),
    [NodeType.TIME_DELAY]: (
      <>
        {nodeData.type === NodeType.TIME_DELAY && (
          <TimeDelaySettings
            nodeData={nodeData}
            setNodeData={setNodeData}
            setIsError={setIsError}
            showErrors={showErrors}
          />
        )}
      </>
    ),
    [NodeType.TIME_WINDOW]: (
      <>
        {nodeData.type === NodeType.TIME_WINDOW && (
          <TimeWindowSettings
            nodeData={nodeData}
            setNodeData={setNodeData}
            setIsError={setIsError}
            showErrors={showErrors}
          />
        )}
      </>
    ),
    [NodeType.USER_ATTRIBUTE]: (
      <>
        {nodeData.type === NodeType.USER_ATTRIBUTE && (
          <UserAttributeSettings
            nodeData={nodeData}
            setNodeData={setNodeData}
            setIsError={setIsError}
            showErrors={showErrors}
          />
        )}
      </>
    ),
  };

  const onCancel = () => {
    dispatch(deselectNodes());
  };

  const onSave = () => {
    onSaveClick?.();

    if (selectedNode)
      dispatch(changeNodeData({ id: selectedNode.id, data: nodeData }));

    dispatch(deselectNodes());
  };

  useEffect(() => {
    if (selectedNode)
      dispatch(
        changeNodeData({ id: selectedNode.id, data: deepCopy(nodeData) })
      );
  }, [nodeData]);

  const isOpen =
    selectedNode &&
    ![NodeType.EMPTY, NodeType.START, NodeType.INSERT_NODE].includes(
      selectedNode.type as NodeType
    );

  return (
    <>
      {isOpen && (
        <div className="absolute top-[0px] left-0 bg-[#111827] bg-opacity-20 w-full h-full" />
      )}

      <Transition
        show={!!isOpen}
        as="div"
        className={`h-[calc(100%-40px)] min-w-[360px] w-[360px] absolute top-[20px] right-[-100%] bg-white border-l-[1px] border-[#E5E7EB] flex flex-col justify-between overflow-hidden ${
          className ? className : ""
        }`}
        enter="transition-all duration-300"
        enterFrom="!right-[-100%]"
        enterTo="!right-[20px]"
        leave="!transition-all !duration-500"
        leaveTo="!right-[-100%]"
        leaveFrom="!right-[20px]"
      >
        <div className="h-full relative flex flex-col justify-stretch">
          <div className="p-5 border-b-[1px] flex flex-col gap-[5px]">
            <div className="font-inter font-semibold text-[20px] leading-[28px]">
              {selectedNode?.type
                ? selectedNode.data.type === NodeType.MESSAGE &&
                  selectedNode.data.template
                  ? messageFixtures[selectedNode.data.template.type].text
                  : nodeTypeToNameMap[selectedNode.type as NodeType]
                : ""}
            </div>
            <div className="font-inter font-normal text-[12px] leading-5 text-[#4B5563]">
              {(() => {
                switch (selectedNode?.data.type) {
                  case NodeType.MESSAGE:
                    return "Users in this step will receive a message with the following template";
                  case NodeType.START:
                    return "";
                  case NodeType.JUMP_TO:
                    return "Users who enter this step will jump to another step in this journey";
                  case NodeType.EXIT:
                    return "Users who enter this step will exit the journey";
                  case NodeType.WAIT_UNTIL:
                    return "Users on this trigger will move to another step only after an event, or some amount of time";
                  case NodeType.TIME_DELAY:
                    return "Users on this trigger will move to another step only after a time delay";
                  case NodeType.TIME_WINDOW:
                    return "Users on this trigger will move to another step only during a time window";
                  case NodeType.USER_ATTRIBUTE:
                    return "Users on this trigger will move to another step only if they satisfy some user attribute condition";
                  default:
                    return "";
                }
              })()}
            </div>
          </div>
          <div className="p-5 h-full max-h-full mb-[60px] overflow-y-hidden">
            <Scrollbars>
              {nodeToSettingsComponentMap[selectedNode?.type || ""]}
            </Scrollbars>
            {/* {selectedNode?.type === NodeType.WAIT_UNTIL &&
              isOnboardingWaitUntilTooltipVisible && (
                <div className="absolute w-fit bottom-[50px] left-[10px] p-[10px] bg-black text-white font-medium z-[9]">
                  Add 1 hour to Time Delay trigger
                </div>
              )} */}
          </div>
        </div>
        <div className="absolute bottom-0 w-full min-h-[60px] h-[60px] py-[14px] px-5 border-t-[1px] flex justify-between items-center">
          <Button
            type={ButtonType.LINK}
            onClick={() => setIsDeleteModalOpen(true)}
            disabled
          >
            Delete
          </Button>

          {selectedNode?.type !== NodeType.EXIT && (
            <div className="flex justify-end items-center gap-[10px]">
              <Button type={ButtonType.SECONDARY} onClick={onCancel} disabled>
                Cancel
              </Button>
              <Button
                type={ButtonType.PRIMARY}
                onClick={onSave}
                disabled={isSaveDisabled}
              >
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

export default OnboardingSidePanel;
