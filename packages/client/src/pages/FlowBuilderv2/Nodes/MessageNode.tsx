import React, { FC, ReactNode } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { useAppSelector } from "store/hooks";
import { MessageType } from "types/Workflow";
import {
  CustomModalIcon,
  EmailIcon,
  PushIcon,
  SlackIcon,
  SMSIcon,
  WebhookIcon,
} from "../Icons";
import { MessageNodeData, Stats } from "./NodeData";

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const messageFixtures: Record<
  MessageType,
  {
    icon: ReactNode;
    text: string;
    statsToShow?: {
      key: keyof Stats;
      name: string;
      renderLabel: (value: number) => string;
    }[];
  }
> = {
  [MessageType.EMAIL]: {
    icon: <EmailIcon />,
    text: "Email",
    statsToShow: [
      {
        key: "sent",
        name: "Sent",
        renderLabel: (value) => compatNumberFormatter.format(value),
      },
      {
        key: "delivered",
        name: "Delivered",
        renderLabel: (value) => compatNumberFormatter.format(value),
      },
      {
        key: "openedPercentage",
        name: "Opened",
        renderLabel: (value) => `${compatNumberFormatter.format(value)}%`,
      },
      {
        key: "clickedPercentage",
        name: "Clicked",
        renderLabel: (value) => `${compatNumberFormatter.format(value)}%`,
      },
    ],
  },
  [MessageType.FIREBASE]: {
    icon: <></>,
    text: "Filebase",
  },
  [MessageType.MODAL]: {
    icon: <CustomModalIcon />,
    text: "Custom Modal",
  },
  [MessageType.PUSH]: {
    icon: <PushIcon />,
    text: "Push",
  },
  [MessageType.SLACK]: {
    icon: <SlackIcon />,
    text: "Slack",
  },
  [MessageType.SMS]: {
    icon: <SMSIcon />,
    text: "SMS",
  },
  [MessageType.WEBHOOK]: {
    icon: <WebhookIcon />,
    text: "Webhook",
  },
};

const unknownMessageFixtures: { icon: ReactNode; text: string } = {
  icon: <></>,
  text: "Unknown message type",
};

export const MessageNode: FC<NodeProps<MessageNodeData>> = ({
  isConnectable,
  data,
  selected,
}) => {
  const { isViewMode } = useAppSelector((state) => state.flowBuilder);

  const { template, stats } = data;

  const nodeFixtures: {
    icon: ReactNode;
    text: string;
    statsToShow?: {
      key: keyof Stats;
      name: string;
      renderLabel: (value: number) => string;
    }[];
  } = template
    ? messageFixtures[template.type] || unknownMessageFixtures
    : unknownMessageFixtures;

  return (
    <div
      className={`w-[260px] ${
        isViewMode && stats && nodeFixtures.statsToShow
          ? "h-[140px]"
          : "h-[80px]"
      }  rounded-[4px] bg-white ${
        selected
          ? "border-[2px] border-[#6366F1]"
          : "border-[1px] border-[#E5E7EB]"
      }`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <div className="p-[16px] flex flex-col gap-[2px]">
        <div className="flex gap-[6px]">
          <div>{nodeFixtures.icon}</div>
          <div
            className={`font-inter font-semibold text-[16px] leading-[24px] ${
              nodeFixtures === unknownMessageFixtures ? "text-red-500" : ""
            }`}
          >
            {nodeFixtures.text}
          </div>
        </div>
        <div className="font-inter font-normal text-[14px] leading-[22px] whitespace-nowrap text-ellipsis max-w-full overflow-hidden">
          {template?.selected ? (
            <>
              <span className="#4B5563">Send </span>
              <span className="font-medium">{template.selected.name}</span>
            </>
          ) : (
            <span className="text-[#4B5563]">Select a template</span>
          )}
        </div>
      </div>
      {isViewMode && stats && nodeFixtures.statsToShow && (
        <div className="px-[16px] py-[7px] flex justify-between gap-[10px] border-t-[1px] border-[#E5E7EB]">
          {nodeFixtures.statsToShow.map((stat, i) => (
            <div
              key={i}
              className={`h-[46px] w-full flex flex-col gap-[4px] ${
                i !== (nodeFixtures.statsToShow?.length || 1) - 1
                  ? "border-r-[1px] border-[#E5E7EB]"
                  : ""
              }`}
            >
              <div className="text-[12px] leading-[20px] text-[#4B5563]">
                {stat.name}
              </div>
              <div className="font-semibold text-[14px] leading-[22px]">
                {stat.renderLabel(stats[stat.key] || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
    </div>
  );
};
