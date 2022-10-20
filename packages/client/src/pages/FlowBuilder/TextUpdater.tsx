import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";
import { getAudienceDetails } from "./FlowHelpers";

import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import TriggerCreater from "components/TriggerCreater";
import ChooseTemplateModal from "./ChooseTemplateModal";

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
  } = data;
  const [nodeData, setNodeData] = useState<any>({});
  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>();
  const [updateTemplateModalOpen, setUpdateTemplateModalOpen] = useState(false);
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

  const handleTemplateModalOpen = ({ activeTemplate }: any) => {
    if (activeTemplate == null || activeTemplate == "") {
      onTemplateModalClose();
      return;
    }
    const found = data?.messages?.find(
      (message: any) => message.templateId === selectedTemplateId
    );

    if (found) {
      found.templateId = activeTemplate;
    }

    onTemplateModalClose();
  };

  useEffect(() => {
    if (isExit) setNodeData(data);
    // audienceId is present when we are just dispalying the existing node data
    else if (audienceId) {
      getAudienceDetails(audienceId).then((response: any) => {
        if (response.status === StatusCodes.OK) {
          setNodeData(response.data);
        }
      });
    } else {
      setNodeData({
        id: uuid(),
        title: "Please define audience",
        desc: "Please define",
      });
    }
  }, [audienceId]);

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
          style={{ background: "transparent" }}
          isConnectable={true}
        />
        <div
          className={`text-updater bg-white max-h-[80px] flex justify-between rounded-[8px] p-[16.5px_20px] ${
            nodeData.width ? `w-[${nodeData.width}]` : "w-[350px]"
          } !border-[#9BF2E6] ${
            nodeData.isPrimary ? "!border-[2px ]" : "!border-[0px]"
          }`}
        >
          <div>
            <p className={textStyle}>
              {nodeData.preIcon && (
                <img src={nodeData.preIcon} style={{ marginRight: "10px" }} />
              )}
              {nodeData.name}
            </p>
            <p className={subTitleTextStyle}>{nodeData.description}</p>
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
      <div
        style={{
          position: "absolute",
          top: "100px",
          width: "calc(760px)",
        }}
      >
        {selectedTrigger ? (
          <TriggerCreater triggerType={selectedTrigger.type} />
        ) : null}
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
