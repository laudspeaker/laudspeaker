import { TimeDelayNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import TimeDelayEditor from "../components/TimeDelayEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";

const TimeDelaySettings: FC<SidePanelComponentProps<TimeDelayNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  return (
    <TimeDelayEditor
      delay={nodeData.delay}
      onChange={(delay) => setNodeData({ ...nodeData, delay })}
    />
  );
};

export default TimeDelaySettings;
