import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import {
  Handle,
  Position,
  useStore,
  useUpdateNodeInternals,
} from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";
import { getAudienceDetails } from "./FlowHelpers";

import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import TriggerCreater from "components/TriggerCreater";
import ChooseTemplateModal from "./ChooseTemplateModal";
import LinesEllipsis from "react-lines-ellipsis";

const textStyle = "text-[#111827] font-[Inter] font-middle text-[14px]";
const subTitleTextStyle = "text-[#6B7280] font-[Inter] text-[14px]";
const iconStyles = { padding: "0 10px" };

const TextUpdaterNode = ({
  data,
  setSelectedTrigger,
  selectedTrigger,
}: any) => {
  const {
    audienceId,
    dataTriggers,
    hidden,
    onTriggerSelect,
    triggers,
    isExit,
    updateNodes,
    isSelected,
    needsUpdate,
    nodeId,
  } = data;
  const [nodeData, setNodeData] = useState<any>({});
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>();
  const [updateTemplateModalOpen, setUpdateTemplateModalOpen] = useState(false);
  const [descriptionCollaped, setDescriptionCollaped] = useState(true);
  // const [selectedTrigger, setSelectedTrigger] = useState<any>(undefined);

  const onTemplateModalClose = () => {
    setUpdateTemplateModalOpen(false);
    setSelectedMessageType("");
    setSelectedTemplateId(undefined);
  };

  const onTemplateDelete = () => {
    if (data?.messages) {
      data.messages = data.messages.filter(
        (message: any) => message.templateId !== selectedTemplateId
      );
    }

    onTemplateModalClose();
  };

  const handleTemplateModalOpen = () => {
    onTemplateModalClose();
  };

  useEffect(() => {
    if (isExit) setNodeData(data);
    // audienceId is present when we are just dispalying the existing node data
    else if (audienceId) {
      getAudienceDetails(audienceId).then((response: any) => {
        if (response.status === StatusCodes.OK) {
          setNodeData(response.data);
          data.isDynamic = response.data.isDynamic;
        }
      });
    } else {
      setNodeData({
        id: uuid(),
        title: "Please define audience",
        desc: "Please define",
      });
    }
  }, [audienceId, needsUpdate]);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [triggers]);

  const handleTriggerClick = (e: any, triggerId: string) => {
    e.stopPropagation();
    // const dataTrigger = dataTriggers.find(
    //   (trigger: any) => trigger.id === triggerId
    // );
    onTriggerSelect(e, triggerId, triggers);
  };

  const messageIcons: { [key: string]: JSX.Element } = {
    sms: <SMS />,
    push: <Mobile />,
    email: <Email />,
    slack: <SlackMsg />,
  };

  const handleIconClick = (messageType: string, templateId: number) => () => {
    setSelectedMessageType(messageType);
    setUpdateTemplateModalOpen(true);
    setSelectedTemplateId(templateId);
  };

  const generateMsgIcons = () => {
    return data?.messages?.map((message: any) => {
      return (
        <div
          className="p-[0px_10px]"
          onClick={handleIconClick(message.type, message.templateId)}
        >
          {messageIcons[message.type as string]}
        </div>
      );
    });
  };

  const connectionNodeId = useStore((state) => state.connectionNodeId);
  const isTarget = connectionNodeId && connectionNodeId !== nodeData.id;
  return (
    <>
      <div
        className="text-updater-node"
        data-isPrimary={nodeData.isPrimary}
        style={{
          opacity: hidden ? 0 : 1,
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-transparent !h-full !border-0"
          isConnectable={!!isTarget}
        />
        <div
          className={`relative text-updater overflow-hidden bg-white ${
            descriptionCollaped ? "max-h-[88px]" : "min-h-[80px]"
          }  flex justify-between rounded-[8px] p-[16.5px_20px] border-[2px] shadow-md border-transparent ${
            nodeData.width ? `w-[${nodeData.width}]` : "w-[350px]"
          } ${nodeData.isPrimary ? "border-cyan-500" : ""} ${
            isSelected && !nodeData.isPrimary
              ? "!border-gray-300 !shadow-xl"
              : ""
          }`}
        >
          <div>
            <p className={textStyle}>
              {nodeData.preIcon && (
                <img src={nodeData.preIcon} style={{ marginRight: "10px" }} />
              )}
              {nodeData.name}
            </p>
            {descriptionCollaped && nodeData.description ? (
              <LinesEllipsis
                onClick={() => {
                  setDescriptionCollaped(!descriptionCollaped);
                }}
                text={nodeData.description}
                className={
                  subTitleTextStyle + " h-full text-ellipsis cursor-pointer"
                }
                maxLine="2"
                ellipsis="..."
                trimRight
                basedOn="letters"
              />
            ) : (
              <p
                onClick={() => setDescriptionCollaped(!descriptionCollaped)}
                className={
                  subTitleTextStyle + " h-full text-ellipsis cursor-pointer"
                }
              >
                {nodeData.description}
              </p>
            )}
          </div>
          <div className="flex justify-evenly items-center">
            {generateMsgIcons()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: "15px",
            position: "absolute",
            left: 0,
            bottom: 0,
            alignItems: "center",
            width: "100%",
            justifyContent: "space-around",
          }}
        >
          {!isExit &&
            data?.triggers?.map((trigger: any, index: number) => {
              return (
                <Handle
                  type="source"
                  key={index}
                  position={Position.Bottom}
                  id={trigger.id}
                  onClick={(e) => handleTriggerClick(e, trigger.id)}
                  style={{
                    height: "15px",
                    background: "transparent",
                    width: "20px",
                    transform: "unset",
                    bottom: "-4px",
                    top: "auto",
                    left: "auto",
                    right: "auto",
                    position: "relative",
                  }}
                >
                  <img
                    src={thunderbolt}
                    width="20"
                    style={{ pointerEvents: "none" }}
                  />
                </Handle>
              );
            })}
        </div>
      </div>
      {updateTemplateModalOpen && selectedMessageType && selectedTemplateId && (
        <ChooseTemplateModal
          templateModalOpen={updateTemplateModalOpen}
          selectedMessageType={selectedMessageType}
          handleTemplateModalOpen={handleTemplateModalOpen}
          selectedTemplateId={selectedTemplateId}
          isCollapsible={true}
          onClose={onTemplateModalClose}
          onTemplateDelete={onTemplateDelete}
        />
      )}
    </>
  );
};

export default TextUpdaterNode;
