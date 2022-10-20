import { Divider } from "@mui/material";
import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";

import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import { getAudienceDetails } from "pages/FlowBuilder/FlowHelpers";

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

  const generateMsgIcons = () => {
    return data?.messages?.map((message: any) => {
      if (message.type === "sms") {
        return (
          <div className={iconStyles}>
            <SMS />
          </div>
        );
      }
      if (message.type === "push") {
        return (
          <div className={iconStyles}>
            <Mobile />
          </div>
        );
      }
      if (message.type === "email") {
        return (
          <div className={iconStyles}>
            <Email />
          </div>
        );
      }
      if (message.type === "slack") {
        return (
          <div className={iconStyles}>
            <SlackMsg />
          </div>
        );
      }
    });
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
              <div className="w-full p-[0px_10px]">
                <div>Sent</div>
                <div className="font-medium text-[#333333]">
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    stats.sentAmount
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
              <div className="w-full p-[0px_10px]">
                <div>Clicked</div>
                <div className="font-medium text-[#333333]">0%</div>
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
                  isConnectable={false}
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
    </>
  );
};

export default ViewNode;
