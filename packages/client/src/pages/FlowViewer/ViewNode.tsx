import { Divider } from "@mui/material";
import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";

import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import { getAudienceDetails } from "pages/FlowBuilder/FlowHelpers";
import TriggerCreater from "components/TriggerCreater";
import ChooseTemplateModal from "pages/FlowBuilder/ChooseTemplateModal";
import StatModal from "./StatModal";

const textStyle =
  "text-[#223343] font-[Poppins] font-normal text-[14px] leading-[30px]";
const subTitleTextStyle = "text-[#6B7280] font-[Poppins] text-[14px]";

const iconStyles = "mr-[20px] flex justify-center items-center";

const ViewNode = ({ data, setSelectedTrigger, selectedTrigger }: any) => {
  const {
    audienceId,
    dataTriggers,
    hidden,
    onTriggerSelect,
    triggers,
    isExit,
    stats,
  } = data;
  const [nodeData, setNodeData] = useState<any>({});

  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>();
  const [updateTemplateModalOpen, setUpdateTemplateModalOpen] = useState(false);
  const [sentStatModalOpen, setSentStatModalOpen] = useState(false);
  const [clickedStatModalOpen, setClickedStatModalOpen] = useState(false);

  const onTemplateModalClose = () => {
    setUpdateTemplateModalOpen(false);
    setSelectedMessageType("");
    setSelectedTemplateId(undefined);
  };

  const handleIconClick = (messageType: string, templateId: number) => () => {
    setSelectedMessageType(messageType);
    setUpdateTemplateModalOpen(true);
    setSelectedTemplateId(templateId);
  };

  // const [selectedTrigger, setSelectedTrigger] = useState<any>(undefined);
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

  const generateMsgIcons = () => {
    return data?.messages?.map((message: any) => {
      return (
        <div
          className="p-[0px_10px] cursor-pointer"
          onClick={handleIconClick(message.type, message.templateId)}
        >
          {messageIcons[message.type as string]}
        </div>
      );
    });
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

  const onTemplateDelete = () => {
    if (data?.messages) {
      data.messages = data.messages.filter(
        (message: any) => message.templateId !== selectedTemplateId
      );
    }

    onTemplateModalClose();
  };

  return (
    <>
      <div
        className="view-node"
        data-isPrimary={nodeData.isPrimary}
        style={{
          opacity: hidden ? 0 : 1,
          cursor: "default",
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "transparent" }}
          isConnectable={false}
        />
        <div
          className={`view-node bg-white rounded-[8px] ${
            nodeData.width ? `w-[${nodeData.width}]` : "w-[350px]"
          }`}
        >
          <div className="flex justify-start items-center p-[8px_20px]">
            <div className="flex justify-evenly items-center">
              {generateMsgIcons()}
            </div>
            <div>
              <p className={textStyle}>
                {nodeData.preIcon && (
                  <img src={nodeData.preIcon} style={{ marginRight: "10px" }} />
                )}
                {nodeData.name}
              </p>
              <p className={subTitleTextStyle}>{nodeData.description}</p>
            </div>
          </div>
          <Divider />
          {stats && (
            <div className="flex justify-between font-[Poppins] p-[8px_10px] font-normal leading-[30px] text-[14px]">
              <div
                className="w-full p-[0px_10px] cursor-pointer"
                onClick={() => setSentStatModalOpen(true)}
              >
                <div>Sent</div>
                <div className="font-medium text-[#333333]">
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    stats.sent
                  )}
                </div>
              </div>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <div className="w-full p-[0px_10px]">
                <div>Opened</div>
                <div className="font-medium text-[#333333]">0%</div>
              </div>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <div
                className="w-full p-[0px_10px] cursor-pointer"
                onClick={() => setClickedStatModalOpen(true)}
              >
                <div>Clicked</div>
                <div className="font-medium text-[#333333]">
                  {stats.clickedPercentage}%
                </div>
              </div>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <div className="w-full p-[0px_10px]">
                <div>Converted</div>
                <div className="font-medium text-[#333333]">0%</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex h-[15px] absolute left-0 bottom-0 items-center w-full justify-around">
          {!isExit &&
            data?.triggers?.map((trigger: any, index: number) => {
              return (
                <Handle
                  type="source"
                  key={index}
                  position={Position.Bottom}
                  id={trigger.id}
                  onClick={(e) => handleTriggerClick(e, trigger.id)}
                  className="!pointer-events-auto !outline-none !h-[15px] !bg-transparent !w-[20px] !transform-none !bottom-[-4px] !top-auto !left-auto !right-auto !relative"
                  isConnectable={false}
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
          <TriggerCreater
            isViewMode={true}
            triggerType={selectedTrigger.type}
          />
        ) : null}
      </div>
      {updateTemplateModalOpen && selectedMessageType && selectedTemplateId && (
        <ChooseTemplateModal
          templateModalOpen={updateTemplateModalOpen}
          selectedMessageType={selectedMessageType}
          handleTemplateModalOpen={handleTemplateModalOpen}
          selectedTemplateId={selectedTemplateId}
          isCollapsible={true}
          isViewMode={true}
          onClose={onTemplateModalClose}
          onTemplateDelete={onTemplateDelete}
        />
      )}
      <StatModal
        isOpen={sentStatModalOpen}
        event="sent"
        audienceId={audienceId}
        onClose={() => setSentStatModalOpen(false)}
      />
      <StatModal
        isOpen={clickedStatModalOpen}
        event="clicked"
        audienceId={audienceId}
        onClose={() => setClickedStatModalOpen(false)}
      />
    </>
  );
};

export default ViewNode;
