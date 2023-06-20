import { TimeWindowNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import TimeWindowEditor from "../components/TimeWindowEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";

const TimeWindowSettings: FC<SidePanelComponentProps<TimeWindowNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  return (
    <TimeWindowEditor
      from={nodeData.from}
      to={nodeData.to}
      onChangeFrom={(from) => setNodeData({ ...nodeData, from })}
      onChangeTo={(to) => setNodeData({ ...nodeData, to })}
    />
  );
};

export default TimeWindowSettings;
