import { TimeDelayNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";

const TimeDelayViewer: FC<SidePanelComponentProps<TimeDelayNodeData>> = ({
  nodeData,
}) => {
  const { days, hours, minutes } = nodeData.delay;

  return (
    <div className="gap-3 flex items-center">
      <span>Wait</span>
      <span className="bg-gray-100 border border-gray-200 rounded px-2 py-3 font-semibold">
        {days === hours && hours === minutes && minutes === 0 ? (
          <>...</>
        ) : (
          <>
            {days}day{days === 1 ? "" : "s"} {hours}hour
            {hours === 1 ? "" : "s"} {minutes}min
          </>
        )}
      </span>
    </div>
  );
};

export default TimeDelayViewer;
