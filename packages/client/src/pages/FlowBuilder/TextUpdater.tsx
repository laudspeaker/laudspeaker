import { StatusCodes } from "./../../constants";
import { MouseEvent, useEffect, useState } from "react";
import {
  Handle,
  Position,
  useEdges,
  useStore,
  useUpdateNodeInternals,
} from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";
import { getAudienceDetails } from "./FlowHelpers";

import ArrowDown from "@heroicons/react/24/solid/ArrowLongDownIcon";
import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import ChooseTemplateModal from "./ChooseTemplateModal";
import LinesEllipsis from "react-lines-ellipsis";
import { NodeData } from "./FlowBuilder";

const textStyle = "text-[#111827] font-[Inter] font-middle text-[14px]";
const subTitleTextStyle = "text-[#6B7280] font-[Inter] text-[14px]";

const TextUpdaterNode = ({ data }: { data: NodeData }) => {
  const {
    audienceId,
    hidden,
    onTriggerSelect,
    triggers,
    isExit,
    isSelected,
    needsUpdate,
    nodeId,
    isNearToCursor,
    isConnecting,
  } = data;
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
  const [descriptionCollaped, setDescriptionCollaped] = useState(true);

  const edges = useEdges();
  const onTemplateModalClose = () => {
    setUpdateTemplateModalOpen(false);
    setSelectedMessageType("");
    setSelectedTemplateId(undefined);
  };

  const onTemplateDelete = () => {
    if (data?.messages) {
      data.messages = data.messages.filter(
        (message) => message.templateId !== selectedTemplateId
      );
    }

    onTemplateModalClose();
  };

  const handleTemplateModalOpen = (val?: {
    activeTemplate: number | undefined;
  }) => {
    if (val?.activeTemplate) {
      const message = data.messages.find(
        (m) =>
          m.templateId === selectedTemplateId && m.type === selectedMessageType
      );

      if (!message) return;

      message.templateId = val.activeTemplate;
    }
    onTemplateModalClose();
  };

  useEffect(() => {
    if (isExit) setNodeData({});
    // audienceId is present when we are just dispalying the existing node data
    else if (audienceId) {
      getAudienceDetails(audienceId).then((response) => {
        if (response.status === StatusCodes.OK) {
          setNodeData(response.data);
          data.isDynamic = response.data.isDynamic;
        }
      });
    } else {
      setNodeData({
        id: uuid(),
        name: "Please define audience",
        description: "Please define",
      });
    }
  }, [audienceId, needsUpdate]);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(nodeId || "");
  }, [triggers]);

  const handleTriggerClick = (
    e: MouseEvent<HTMLDivElement>,
    triggerId: string
  ) => {
    e.stopPropagation();
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
    return data?.messages?.map((message) => {
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
  const isSourceForSome = !!edges.find((edge) => edge.source === nodeId);

  return (
    <>
      <div
        className="text-updater-node relative"
        data-isPrimary={nodeData.isPrimary}
        style={{
          opacity: hidden ? 0 : 1,
        }}
      >
        {isNearToCursor && connectionNodeId !== nodeId && (
          <div className="absolute w-[55%] h-[65%] rounded-md z-[-1] animate-ping border-[2px] border-cyan-600 left-[22.5%] top-[20%]" />
        )}
        <Handle
          type="target"
          position={Position.Top}
          className="triggerIn !bg-transparent !h-full !border-0 !z-[99999] relative"
          isConnectable={!!isTarget}
          data-handle-top
        >
          <div
            className={`!w-[15px] !h-[15px] ${
              edges.find((edge) => edge.target === nodeId)
                ? "!bg-cyan-400"
                : "!bg-transparent !border-0"
            } rounded-full absolute left-1/2 top-0 -translate-x-1/2`}
          ></div>
        </Handle>
        <div
          className={`relative text-updater overflow-hidden bg-white ${
            descriptionCollaped ? "max-h-[88px]" : "min-h-[80px]"
          }  flex justify-between rounded-[8px] p-[16.5px_20px] border-[2px] shadow-md border-transparent ${
            nodeData.width ? `w-[${nodeData.width}]` : "w-[350px]"
          } ${isSelected ? "border-cyan-500 !shadow-xl" : ""}`}
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
            height: "22px",
            position: "absolute",
            left: 0,
            bottom: 0,
            alignItems: "center",
            width: "100%",
            justifyContent: "space-around",
          }}
        >
          {!isExit &&
            data?.triggers?.map((trigger, index) => {
              return (
                <Handle
                  type="source"
                  key={index}
                  position={Position.Top}
                  id={trigger.id}
                  onClick={(e) => handleTriggerClick(e, trigger.id)}
                  className={`triggerOut !relative !left-auto !right-auto !border-[0px] !z-[1000] ${
                    isSourceForSome ? "!h-[22px]" : "!h-[44px]"
                  } !bg-transparent !w-[30px] !transform-none  ${
                    isSourceForSome ? "!top-[11px]" : "!top-[22px]"
                  }
                   `}
                  data-handle-bottom
                >
                  <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[30px] h-[22px]">
                    <img
                      src={thunderbolt}
                      width="30"
                      height="22"
                      className=""
                    />
                    {!isConnecting && !isSourceForSome && (
                      <div className="absolute z-[-1] left-1/2 top-[24px] -translate-x-1/2 w-[20px] h-full">
                        <ArrowDown className="text-[#bdbdc1]" />
                        <div className="circle-to-display-hover absolute transition-all flex justify-center items-center w-full h-full opacity-0 left-0 top-[-2px] ">
                          <div className="border-[1px] border-cyan-600 rounded-full w-[10px] h-[10px]" />
                        </div>
                      </div>
                    )}
                  </div>
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
