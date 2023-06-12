import { UserAttributeNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import { FC } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import AttributeBranchView from "pages/FlowBuilderv2/SidePanel/components/AttributeBranchView";

const UserAttributeViewer: FC<
  SidePanelComponentProps<UserAttributeNodeData>
> = ({ nodeData }) => {
  const { branches } = nodeData;
  return (
    <div className="-mx-5">
      {branches.map((branch, i) => (
        <div key={branch.id} className="p-5 border-t border-gray-200">
          <div className="font-inter font-semibold text-base text-gray-900 pb-3">
            Branch {i + 1}
          </div>
          <AttributeBranchView branch={branch} />
        </div>
      ))}
    </div>
  );
};

export default UserAttributeViewer;
