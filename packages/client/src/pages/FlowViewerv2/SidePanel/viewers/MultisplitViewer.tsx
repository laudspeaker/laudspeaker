import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import { MultisplitNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import MulisplitSettings from "pages/FlowBuilderv2/SidePanel/settings/MulisplitSettings";

const MultisplitViewer: FC<SidePanelComponentProps<MultisplitNodeData>> = ({
  nodeData,
}) => {
  return (
    <div className="p-5">
      <MulisplitSettings
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
