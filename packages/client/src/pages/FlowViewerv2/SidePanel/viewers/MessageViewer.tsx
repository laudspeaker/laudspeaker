import { messageFixtures } from "pages/FlowBuilderv2/Nodes/MessageNode";
import { MessageNodeData, Stats } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useState } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";

const MessageViewer: FC<SidePanelComponentProps<MessageNodeData>> = ({
  nodeData,
}) => {
  const [pickedStat, setPickedStat] = useState<keyof Stats>();

  const fixtures = messageFixtures[nodeData.template.type];

  return (
    <div>
      <div className="px-[20px] pb-[20px] border-b-[1px] border-[#E5E7EB]">
        <div className="w-[200px] h-[60px] px-[8px] flex items-center gap-[5px] border-[1px] border-[#4B5563] rounded-[4px]">
          <div>{fixtures.icon}</div>
          <div>{nodeData.template.selected?.name || "Unknown template"}</div>
        </div>
      </div>
      <div className="p-[20px] flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[20px] leading-[28px]">
            Metrics
          </div>
          {fixtures.statsToShow ? (
            <div className="flex justify-between gap-[10px]">
              {fixtures.statsToShow.map((stat, i) => (
                <div
                  key={i}
                  className={`w-full rounded-[4px] px-[10px] py-[4px] flex flex-col gap-[9px] border-[1px] border-[#E5E7EB] select-none cursor-pointer ${
                    stat.key === pickedStat
                      ? "!border-[#6366F1] !bg-[#EEF2FF]"
                      : ""
                  }`}
                  onClick={() =>
                    setPickedStat(
                      pickedStat === stat.key ? undefined : stat.key
                    )
                  }
                >
                  <div className="font-roboto text-[14px] leading-[22px] text-[#6B7280]">
                    {stat.name}
                  </div>
                  <div className="font-roboto text-[24px] leading-[28px]">
                    {stat.renderLabel(nodeData.stats?.[stat.key] || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>Nothing to show here right now...</>
          )}
        </div>
        {pickedStat && (
          <div>
            <div className="flex gap-[46px]">
              <div className="font-semibold">Customer ID</div>
              <div className="font-semibold">Email</div>
            </div>
            <div className="py-[10px]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageViewer;
