import { Divider, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { StatusCodes } from "./../../constants";
import { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
import thunderbolt from "../../assets/images/thunderbolt.svg";

import { Email, SlackMsg, Mobile, SMS } from "../../components/Icons/Icons";
import TriggerCreater from "components/TriggerCreater";
import { getAudienceDetails } from "pages/FlowBuilder/FlowHelpers";

const textStyle = {
  color: "#223343",
  fontFamily: "Poppins",
  fontStyle: "normal",
  fontWeight: "500",
  fontSize: "14px",
  lineHeight: "30px",
};
const subTitleTextStyle = {
  color: "#6B7280",
  fontFamily: "Poppins",
  fontSize: "14px",
};
const iconStyles = {
  marginRight: "20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

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
          <Box sx={iconStyles}>
            <SMS />
          </Box>
        );
      }
      if (message.type === "push") {
        return (
          <Box sx={iconStyles}>
            <Mobile />
          </Box>
        );
      }
      if (message.type === "email") {
        return (
          <Box sx={iconStyles}>
            <Email />
          </Box>
        );
      }
      if (message.type === "slack") {
        return (
          <Box sx={iconStyles}>
            <SlackMsg />
          </Box>
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
        <Box
          sx={{
            backgroundColor: "#FFF",
            borderRadius: "8px",
            width: nodeData.width || "350px",
          }}
          className="view-node"
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: "8px 20px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              {generateMsgIcons()}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={textStyle}>
                {nodeData.preIcon && (
                  <img src={nodeData.preIcon} style={{ marginRight: "10px" }} />
                )}
                {nodeData.name}
              </Typography>
              <Typography variant="subtitle1" sx={subTitleTextStyle}>
                {nodeData.description}
              </Typography>
            </Box>
          </Box>
          <Divider />
          {stats && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "Poppins",
                padding: "8px 10px",
                fontStyle: "normal",
                lineHeight: "30px",
                fontWeight: "400",
                fontSize: "14px",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  padding: "0 10px",
                }}
              >
                <Box>Sent</Box>
                <Box
                  sx={{
                    fontWeight: "500",
                    color: "#333333",
                  }}
                >
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    stats.sentAmount
                  )}
                </Box>
              </Box>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <Box
                sx={{
                  width: "100%",
                  padding: "0 10px",
                }}
              >
                <Box>Opened</Box>
                <Box
                  sx={{
                    fontWeight: "500",
                    color: "#333333",
                  }}
                >
                  0%
                </Box>
              </Box>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <Box
                sx={{
                  width: "100%",
                  padding: "0 10px",
                }}
              >
                <Box>Clicked</Box>
                <Box
                  sx={{
                    fontWeight: "500",
                    color: "#333333",
                  }}
                >
                  0%
                </Box>
              </Box>
              <Divider
                sx={{
                  height: "auto",
                }}
                variant="middle"
                orientation="vertical"
              />
              <Box
                sx={{
                  width: "100%",
                  padding: "0 10px",
                }}
              >
                <Box>Converted</Box>
                <Box
                  sx={{
                    fontWeight: "500",
                    color: "#333333",
                  }}
                >
                  0%
                </Box>
              </Box>
            </Box>
          )}
        </Box>
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
