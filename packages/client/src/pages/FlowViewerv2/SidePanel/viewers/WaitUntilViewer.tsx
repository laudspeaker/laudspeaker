import {
  BranchType,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import EventBranchView from "pages/FlowBuilderv2/SidePanel/components/EventBranchView";
import MaxTimeBranchView from "pages/FlowBuilderv2/SidePanel/components/MaxTimeBranchView";

const WaitUntilViewer: FC<SidePanelComponentProps<WaitUntilNodeData>> = ({
  nodeData,
}) => {
  const { branches } = nodeData;
  return (
    <div className="-mx-5 px-5">
      {branches.map((branch, i) => (
        <div
          key={branch.id}
          className="mb-5 border-t border-gray-200 pt-5 flex flex-col gap-3 px-5"
        >
          <div className="font-inter font-semibold text-base text-gray-900">
            Branch {i + 1} -{" "}
            {branch.type === BranchType.EVENT ? "Event" : "Max time"}
          </div>
          {branch.type === BranchType.EVENT ? (
            <EventBranchView branch={branch} />
          ) : (
            <MaxTimeBranchView branch={branch} />
          )}
        </div>
      ))}
    </div>
  );
};

export default WaitUntilViewer;
