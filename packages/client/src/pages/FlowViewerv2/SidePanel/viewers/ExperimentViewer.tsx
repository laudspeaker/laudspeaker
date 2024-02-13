import { ExperimentNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";

const ExperimentViewer: FC<SidePanelComponentProps<ExperimentNodeData>> = ({
  nodeData,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5">
      <div className="text-[#18181B] text-[16px] font-semibold leading-[24px]">
        Ratio
      </div>
      {nodeData.branches.map((branch, i) => (
        <div className="flex flex-col gap-[5px] pb-[14px]" key={i}>
          <div className="font-semibold">
            Branch {i + 1}: {branch.ratio * 100}%
          </div>
          <div className="bg-[#E5E7EB] w-full h-[6px] rounded overflow-hidden">
            <div
              className="bg-[#818CF8] h-full"
              style={{
                width: `${branch.ratio * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExperimentViewer;
