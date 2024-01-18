import MulisplitSettings from "./settings/MulisplitSettings";
import { Transition } from "@headlessui/react";
import React, { FC, ReactNode, useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import {
  changeNodeData,
  deselectNodes,
  setRequireSaveEmit,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import deepCopy from "utils/deepCopy";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import { NodeType } from "../FlowEditor";
import FlowBuilderDeleteModal from "../Modals/FlowBuilderDeleteModal";
import FlowBuilderSaveTrackerModal from "../Modals/FlowBuilderSaveTrackerModal";
import { messageFixtures } from "../Nodes/MessageNode";
import { MessageNodeData, NodeData } from "../Nodes/NodeData";
import MessageSettings from "./settings/MessageSettings";
import TimeDelaySettings from "./settings/TimeDelaySettings";
import TimeWindowSettings from "./settings/TimeWindowSettings";
import TrackerSettings from "./settings/TrackerSettings";
import UserAttributeSettings from "./settings/UserAttributeSettings";
import WaitUntilSettings from "./settings/WaitUntilSettings";
import JumpToSettings from "./settings/JumpToSettings";
import { isEqual } from "lodash";
import Modal from "components/Elements/Modal";
import { FlowBuilderMessageRenameModal } from "../Modals/FlowBuilderMessageRenameModal";
import { MessageType } from "types/Workflow";
import { Node } from "reactflow";
import ExperimentNodeSettings from "./settings/ExperimentNodeSettings";

export interface SidePanelComponentProps<T extends NodeData = NodeData> {
  nodeData: T;
  setNodeData: (nodeData: T) => void;
  setIsError: (value: boolean) => void;
  showErrors: boolean;
}

interface FlowBuilderSidePanelProps {
  className?: string;
}

const FlowBuilderSidePanel: FC<FlowBuilderSidePanelProps> = ({ className }) => {
  const { nodes, sidePanelErrors } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useAppDispatch();

  const [selectedNode, setSelectedNode] = useState<
    Node<NodeData, string | undefined> | undefined
  >(undefined);

  const [nodeData, setNodeData] = useState<NodeData>(
    deepCopy({ ...selectedNode?.data })
  );
  const [initialNodeData, setInitialNodeData] = useState<NodeData>(
    deepCopy({ ...selectedNode?.data })
  );
  const [needCancelConfirmation, setNeedCancelConfirmation] = useState(false);
  const [messageRenameModalShow, setMessageRenameModalShow] = useState(false);
  const [isTrackerModalSaveOpen, setIsTrackerModalSaveOpen] = useState(false);

  useEffect(() => {
    setNodeData(deepCopy({ ...selectedNode?.data }));
    setInitialNodeData(deepCopy({ ...selectedNode?.data }));
  }, [selectedNode]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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
    [NodeType.PUSH]: (
      <>
        {nodeData.type === NodeType.PUSH && (
          <MessageSettings
            nodeData={nodeData as MessageNodeData<MessageType>}
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
    [NodeType.EXPERIMENT]: (
      <>
        {nodeData.type === NodeType.EXPERIMENT && (
          <div className="p-5">
            <ExperimentNodeSettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
            />
          </div>
        )}
      </>
    ),
    [NodeType.TIME_DELAY]: (
      <>
        {nodeData.type === NodeType.TIME_DELAY && (
          <div className="p-5">
            <TimeDelaySettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
            />
          </div>
        )}
      </>
    ),
    [NodeType.TIME_WINDOW]: (
      <>
        {nodeData.type === NodeType.TIME_WINDOW && (
          <div className="p-5">
            <TimeWindowSettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
            />
          </div>
        )}
      </>
    ),
    [NodeType.USER_ATTRIBUTE]: (
      <>
        {nodeData.type === NodeType.USER_ATTRIBUTE && (
          <div className="p-5">
            <UserAttributeSettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
            />
          </div>
        )}
      </>
    ),
    [NodeType.TRACKER]: (
      <>
        {nodeData.type === NodeType.TRACKER && (
          <div className="p-5">
            <TrackerSettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
            />
          </div>
        )}
      </>
    ),
    [NodeType.JUMP_TO]: (
      <>
        {nodeData.type === NodeType.JUMP_TO && selectedNode && (
          <div className="p-5">
            <JumpToSettings
              nodeData={nodeData}
              setNodeData={setNodeData}
              setIsError={setIsError}
              showErrors={showErrors}
              nodeId={selectedNode.id}
            />
          </div>
        )}
      </>
    ),
    [NodeType.MULTISPLIT]: (
      <>
        {nodeData.type === NodeType.MULTISPLIT && (
          <div className="p-5">
            <MulisplitSettings
              setIsError={setIsError}
              showErrors={showErrors}
              nodeData={nodeData}
              setNodeData={setNodeData}
            />
          </div>
        )}
      </>
    ),
  };

  const onCancel = () => {
    if (!isEqual(nodeData, initialNodeData)) {
      setNeedCancelConfirmation(true);
      return;
    }

    if (selectedNode) {
      dispatch(
        changeNodeData({
          id: selectedNode.id,
          data: { ...initialNodeData, showErrors: true },
        })
      );
    }

    dispatch(deselectNodes());
  };

  const onSave = () => {
    dispatch(setRequireSaveEmit(true));
    setTimeout(async () => {
      dispatch(setRequireSaveEmit(false));
      if (!!Object.keys(sidePanelErrors).length) return;

      if (isError) {
        setShowErrors(true);
        return;
      }

      if (
        nodeData.type === NodeType.TRACKER &&
        nodeData.tracker &&
        selectedNode?.data.type === NodeType.TRACKER &&
        selectedNode.data.tracker &&
        nodeData.tracker.trackerTemplate.id !==
          selectedNode.data.tracker.trackerTemplate.id &&
        nodes.some(
          (node) =>
            node.data.type === NodeType.TRACKER &&
            node.id !== selectedNode.id &&
            node.data.tracker?.trackerId === nodeData.tracker?.trackerId
        )
      ) {
        setIsTrackerModalSaveOpen(true);
        return;
      }

      if (selectedNode)
        dispatch(
          changeNodeData({
            id: selectedNode.id,
            data: { ...nodeData, showErrors: true },
          })
        );

      dispatch(deselectNodes());
    }, 0);
  };

  useEffect(() => {
    // TODO: CHECK TRACKER TEMPLATE NONSTOP REFRESHING
    if (nodeData.type !== NodeType.TRACKER || !selectedNode) return;

    setNodeData({ ...nodeData, needsCheck: false });
  }, [nodeData]);

  useEffect(() => {
    setSelectedNode(nodes.find((node) => node.selected));
  }, [nodes]);

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

      <Modal
        isOpen={needCancelConfirmation}
        onClose={() => {
          setNeedCancelConfirmation(false);
        }}
        closeButtonNeed={false}
        panelClass="!rounded-none !p-[32px] !pb-[24px]"
        childrenClass="-mt-2 !p-0 max-w-[352px]"
      >
        <>
          <div className="flex mb-[24px]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_493_18800)">
                <path
                  d="M11 0C4.92545 0 0 4.92545 0 11C0 17.0746 4.92545 22 11 22C17.0746 22 22 17.0746 22 11C22 4.92545 17.0746 0 11 0ZM11 20.1339C5.9567 20.1339 1.86607 16.0433 1.86607 11C1.86607 5.9567 5.9567 1.86607 11 1.86607C16.0433 1.86607 20.1339 5.9567 20.1339 11C20.1339 16.0433 16.0433 20.1339 11 20.1339Z"
                  fill="#F43F5E"
                />
                <path
                  d="M9.82104 15.3214C9.82104 15.634 9.94522 15.9338 10.1662 16.1548C10.3873 16.3758 10.687 16.5 10.9996 16.5C11.3122 16.5 11.612 16.3758 11.833 16.1548C12.054 15.9338 12.1782 15.634 12.1782 15.3214C12.1782 15.0089 12.054 14.7091 11.833 14.4881C11.612 14.267 11.3122 14.1429 10.9996 14.1429C10.687 14.1429 10.3873 14.267 10.1662 14.4881C9.94522 14.7091 9.82104 15.0089 9.82104 15.3214ZM10.4103 12.5714H11.5889C11.6969 12.5714 11.7853 12.483 11.7853 12.375V5.69643C11.7853 5.58839 11.6969 5.5 11.5889 5.5H10.4103C10.3023 5.5 10.2139 5.58839 10.2139 5.69643V12.375C10.2139 12.483 10.3023 12.5714 10.4103 12.5714Z"
                  fill="#F43F5E"
                />
              </g>
              <defs>
                <clipPath id="clip0_493_18800">
                  <rect width="22" height="22" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="ml-[16px] text-[#111827] font-roboto">
              <div className="font-medium leading-[24px] text-[16px]">
                You have unsaved changes
              </div>
              <div className="leading-[22px] text-[14px] mt-[8px]">
                Please save or discard the changes to continue.
              </div>
            </div>
          </div>
          <div className="flex justify-end flex-nowrap">
            <Button
              id="delete-node"
              type={ButtonType.DANGEROUS}
              onClick={() => {
                if (selectedNode) {
                  dispatch(
                    changeNodeData({
                      id: selectedNode.id,
                      data: { ...initialNodeData, showErrors: true },
                    })
                  );
                }
                setNeedCancelConfirmation(false);
                dispatch(deselectNodes());
              }}
              className="!px-[15px] !py-[4px] !rounded-none !text-[14px] !leading-[22px] font-inter mr-2"
            >
              Discard
            </Button>
            <Button
              id="delete-node"
              type={ButtonType.PRIMARY}
              onClick={() => {
                setNeedCancelConfirmation(false);
                onSave();
              }}
              className="!px-[15px] !py-[4px] !rounded-none !text-[14px] !leading-[22px] font-inter"
            >
              Save changes
            </Button>
          </div>
        </>
      </Modal>

      <Transition
        show={!!isOpen}
        as="div"
        className={`h-[calc(100vh-108px)] min-w-[360px] w-[360px] fixed  right-[-100%] bg-white border-l-[1px] border-[#E5E7EB] flex flex-col justify-between overflow-hidden ${
          className ? className : ""
        }`}
        enter="transition-all duration-300"
        enterFrom="!right-[-100%]"
        enterTo="!right-0"
        leave="!transition-all !duration-500"
        leaveTo="!right-[-100%]"
        leaveFrom="!right-0"
      >
        <div className="h-full relative flex flex-col justify-stretch">
          <div className="p-5 border-b-[1px] flex flex-col gap-[5px]">
            <div className="font-inter flex items-center font-semibold text-[20px] leading-[28px]">
              {selectedNode?.type
                ? (selectedNode.data.type === NodeType.MESSAGE ||
                    selectedNode?.data.type === NodeType.PUSH) &&
                  (selectedNode.data as MessageNodeData).template
                  ? (selectedNode.data as MessageNodeData).customName ||
                    messageFixtures[
                      (selectedNode.data as MessageNodeData).template.type
                    ].text
                  : nodeTypeToNameMap[selectedNode.type as NodeType]
                : ""}
              {(selectedNode?.data.type === NodeType.MESSAGE ||
                selectedNode?.data.type === NodeType.PUSH) && (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="ml-[10px] cursor-pointer"
                    onClick={() => setMessageRenameModalShow(true)}
                  >
                    <g clipPath="url(#clip0_192_30125)">
                      <path
                        d="M3.45872 12.2841C3.49443 12.2841 3.53015 12.2805 3.56586 12.2752L6.56943 11.7484C6.60515 11.7412 6.63908 11.7252 6.66408 11.6984L14.2337 4.12874C14.2503 4.11222 14.2634 4.0926 14.2724 4.071C14.2813 4.0494 14.2859 4.02624 14.2859 4.00285C14.2859 3.97946 14.2813 3.95631 14.2724 3.9347C14.2634 3.9131 14.2503 3.89348 14.2337 3.87696L11.2659 0.907316C11.2319 0.873387 11.1873 0.85553 11.1391 0.85553C11.0909 0.85553 11.0462 0.873387 11.0123 0.907316L3.44265 8.47696C3.41586 8.50374 3.39979 8.53589 3.39265 8.5716L2.86586 11.5752C2.84849 11.6708 2.8547 11.7693 2.88395 11.862C2.91319 11.9547 2.9646 12.0389 3.03372 12.1073C3.15158 12.2216 3.29979 12.2841 3.45872 12.2841ZM4.66229 9.16982L11.1391 2.69482L12.448 4.00374L5.97122 10.4787L4.38372 10.7591L4.66229 9.16982ZM14.5712 13.7841H1.42836C1.11229 13.7841 0.856934 14.0395 0.856934 14.3555V14.9984C0.856934 15.077 0.921219 15.1412 0.999791 15.1412H14.9998C15.0784 15.1412 15.1426 15.077 15.1426 14.9984V14.3555C15.1426 14.0395 14.8873 13.7841 14.5712 13.7841Z"
                        fill="#111827"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_192_30125">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <FlowBuilderMessageRenameModal
                    isOpen={messageRenameModalShow}
                    onClose={() => setMessageRenameModalShow(false)}
                    selectedNode={selectedNode}
                  />
                </>
              )}
              <br />
            </div>
            <div className="font-inter font-normal text-[12px] leading-5 text-[#4B5563]">
              {(() => {
                switch (selectedNode?.data.type) {
                  case NodeType.MESSAGE:
                    return "Users in this step will receive a message with the following template";
                  case NodeType.PUSH:
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
                  case NodeType.MULTISPLIT:
                    return "Description Description Description";
                  default:
                    return "";
                }
              })()}
            </div>
          </div>
          <div className="h-full max-h-full mb-[60px] overflow-y-hidden">
            <Scrollbars>
              {nodeToSettingsComponentMap[selectedNode?.type || ""]}
            </Scrollbars>
          </div>
        </div>
        <div className="absolute bottom-0 w-full min-h-[60px] h-[60px] py-[14px] px-5 border-t-[1px] flex justify-between items-center">
          <Button
            id="delete-node"
            type={ButtonType.LINK}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>

          {selectedNode?.type !== NodeType.EXIT && (
            <div className="flex justify-end items-center gap-[10px]">
              <Button
                id="cancel-saving-node-data"
                type={ButtonType.SECONDARY}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                id="save-node-data"
                type={ButtonType.PRIMARY}
                onClick={onSave}
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
        {nodeData.type === NodeType.TRACKER && (
          <FlowBuilderSaveTrackerModal
            isOpen={isTrackerModalSaveOpen}
            onClose={() => {
              setIsTrackerModalSaveOpen(false);
              onCancel();
            }}
            onYes={() => {
              if (selectedNode)
                dispatch(
                  changeNodeData({
                    id: selectedNode.id,
                    data: { ...nodeData, needsCheck: true, showErrors: true },
                  })
                );

              dispatch(deselectNodes());
            }}
          />
        )}
      </Transition>
    </>
  );
};

export default FlowBuilderSidePanel;
