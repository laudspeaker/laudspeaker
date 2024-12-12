import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import { MultisplitNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import MultisplitSettings from "pages/FlowBuilderv2/SidePanel/settings/MultisplitSettings";

const MultisplitViewer: FC<SidePanelComponentProps<MultisplitNodeData>> = ({
  nodeData,
}) => {
  return (
    <div className="p-5">
      <MultisplitSettings
        nodeData={nodeData}
        setIsError={() => {}}
        showErrors={false}
        setNodeData={() => {}}
        isViewMode
      />
    </div>
  );
};

export default MultisplitViewer;
