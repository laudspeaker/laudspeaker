import { Divider } from "@mui/material";
import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";

import {
  Email,
  SlackMsg,
  Mobile,
  SMS,
  Webhook,
} from "../../components/Icons/Icons";
import { getAudienceDetails } from "pages/FlowBuilder/FlowHelpers";
import ChooseTemplateModal from "pages/FlowBuilder/ChooseTemplateModal";
import StatModal from "./StatModal";
import { NodeData } from "pages/FlowBuilder/FlowBuilder";
import LinesEllipsis from "react-lines-ellipsis";
import { createPortal } from "react-dom";
import HourglassSplit from "assets/images/HourglassSplit.svg";
import { TriggerType } from "types/Workflow";

const textStyle =
  "text-[#223343] font-[Poppins] font-normal text-[14px] leading-[30px]";
const subTitleTextStyle = "text-[#6B7280] font-[Poppins] text-[14px]";

const ViewNode = ({ data }: { data: NodeData }) => {
  const { audienceId, hidden, onTriggerSelect, triggers, isExit, stats } = data;
  const [nodeData, setNodeData] = useState<{
    id?: string;
    isPrimary?: boolean;
    preIcon?: string;
    name?: string;
    description?: string;
    width?: string;
  }>({});

  const [selectedMessageType, setSelectedMessageType] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>();
  const [updateTemplateModalOpen, setUpdateTemplateModalOpen] = useState(false);
  const [sentStatModalOpen, setSentStatModalOpen] = useState(false);
  const [clickedStatModalOpen, setClickedStatModalOpen] = useState(false);
  const [descriptionCollaped, setDescriptionCollaped] = useState(true);

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

  const flowBuilder = document.getElementById("flow-viewer");

  useEffect(() => {
    if (isExit) setNodeData({});
    // audienceId is present when we are just dispalying the existing node data
    else if (audienceId) {
      getAudienceDetails(audienceId).then((response) => {
        if (response.status === StatusCodes.OK) {
          setNodeData(response.data);
        }
      });
    } else {
      setNodeData({
        id: uuid(),
        name: "Please define audience",
        description: "Please define",
      });
    }
  }, [audienceId]);

  const handleTriggerClick = (
    e: { stopPropagation: () => void },
    triggerId: string
  ) => {
    e.stopPropagation();
    onTriggerSelect(e, triggerId, triggers);
  };

  const messageIcons: { [key: string]: JSX.Element } = {
    sms: <SMS />,
    push: <Mobile />,
    firebase: <Mobile />,
    email: <Email />,
    slack: <SlackMsg />,
    webhook: <Webhook />,
  };

  const generateMsgIcons = () => {
    return data?.messages?.map((message) => {
      return (
        <div
          className="max-w-[30px] max-h-[30px] min-w-[30px] min-h-[30px] flex justify-center items-center cursor-pointer"
          onClick={handleIconClick(message.type, message.templateId)}
        >
          {messageIcons[message.type as string]}
        </div>
      );
    });
  };

  const handleTemplateModalOpen = (dat?: {
    activeTemplate?: number;
    selectedMessageType: string;
  }) => {
    if (!dat) return;

    const { activeTemplate } = dat;
    if (!activeTemplate) {
      onTemplateModalClose();
      return;
    }
    const found = data?.messages?.find(
      (message) => message.templateId === selectedTemplateId
    );

    if (found) {
      found.templateId = activeTemplate;
    }

    onTemplateModalClose();
  };

  const onTemplateDelete = () => {
    if (data?.messages) {
      data.messages = data.messages.filter(
        (message) => message.templateId !== selectedTemplateId
      );
    }

    onTemplateModalClose();
  };

  console.log(stats);

  return (
    <>
      <div
        className="view-node"
        data-isPrimary={nodeData.isPrimary}
        style={{
          opacity: hidden ? 0 : 1,
          cursor: "grab",
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "transparent" }}
          isConnectable={false}
        />
        <div
          className={`view-node bg-white overflow-hidden rounded-[8px] min-h-[80px] ${
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
              {descriptionCollaped && nodeData.description ? (
                <LinesEllipsis
                  onClick={() => {
                    setDescriptionCollaped(!descriptionCollaped);
                  }}
                  text={nodeData.description}
                  className={
                    subTitleTextStyle +
                    " !break-all !whitespace-pre-line h-full text-ellipsis cursor-pointer"
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
                    subTitleTextStyle +
                    " !break-all !whitespace-pre-line h-full text-ellipsis cursor-pointer"
                  }
                >
                  {nodeData.description}
                </p>
              )}
            </div>
          </div>
          {stats &&
            data.messages.length > 0 &&
            data.messages.filter((message) => message.type !== "slack").length >
              0 && (
              <>
                <Divider />
                <div className="flex justify-between font-[Poppins] p-[8px_10px] font-normal leading-[30px] text-[14px]">
                  <div
                    className="w-full p-[0px_10px] cursor-pointer"
                    onClick={() => setSentStatModalOpen(true)}
                  >
                    <div>Sent</div>
                    <div className="font-medium text-[#333333]">
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(stats.sent)}
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
                    <div>Delivered</div>
                    <div className="font-medium text-[#333333]">
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(stats.delivered)}
                    </div>
                  </div>
                  {data.messages.filter((message) => message.type === "email")
                    .length > 0 && (
                    <>
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
                    </>
                  )}
                  {data.messages.filter((message) => message.type === "webhook")
                    .length > 0 && (
                    <>
                      <Divider
                        sx={{
                          height: "auto",
                        }}
                        variant="middle"
                        orientation="vertical"
                      />
                      <div className="w-full p-[0px_10px]">
                        <div>WH Sent</div>
                        <div className="font-medium text-[#333333]">
                          {new Intl.NumberFormat("en", {
                            notation: "compact",
                          }).format(stats.wssent)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
        </div>
        <div className="flex h-[22px] absolute left-0 bottom-0 items-center w-full justify-around">
          {!isExit &&
            data?.triggers?.map((trigger, index) => {
              return (
                <Handle
                  type="source"
                  key={index}
                  position={Position.Bottom}
                  id={trigger.id}
                  contentEditable={false}
                  onClick={(e) => handleTriggerClick(e, trigger.id)}
                  className="!pointer-events-auto !outline-none !h-[22px] !bg-transparent !w-[30px] !transform-none !bottom-[-4px] !top-auto !left-auto !right-auto !relative"
                  isConnectable={false}
                >
                  {trigger.type === TriggerType.EVENT ? (
                    <img
                      src={thunderbolt}
                      width="30"
                      height="22"
                      className=""
                    />
                  ) : (
                    <img
                      src={HourglassSplit}
                      width="30"
                      height="22"
                      className="border-black border-[1px] rounded-lg bg-white scale-90 p-[3px]"
                    />
                  )}
                </Handle>
              );
            })}
        </div>
      </div>
      {flowBuilder &&
        createPortal(
          <>
            {selectedMessageType && selectedTemplateId && (
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
          </>,

          flowBuilder
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
