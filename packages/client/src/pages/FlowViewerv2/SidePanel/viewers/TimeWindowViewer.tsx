import { TimeWindowNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import { format } from "date-fns";

const TimeWindowViewer: FC<SidePanelComponentProps<TimeWindowNodeData>> = ({
  nodeData,
}) => {
  const from = nodeData.from
    ? format(new Date(nodeData.from), "yyyy/MM/dd kk:mm")
    : "not defined";
  const to = nodeData.to
    ? format(new Date(nodeData.to), "yyyy/MM/dd kk:mm")
    : "not defined";
  return (
    <div className="bg-gray-100 border border-gray-200 rounded gap-5 flex px-2 py-3">
      <div className="flex flex-col">
        <span>From</span>
        <span>To</span>
      </div>
      <div className="flex flex-col font-semibold">
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  );
};

export default TimeWindowViewer;
