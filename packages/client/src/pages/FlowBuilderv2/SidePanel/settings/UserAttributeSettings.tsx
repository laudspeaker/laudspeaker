import {
  AttributeBranch,
  AttributeCondition,
  BranchType,
  LogicRelation,
  UserAttributeNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import { v4 as uuid } from "uuid";
import AttributeBranchEditor from "../components/AttributeBranchEditor";

const UserAttributeSettings: FC<
  SidePanelComponentProps<UserAttributeNodeData>
> = ({ nodeData, setNodeData }) => {
  const { branches } = nodeData;

  const handleAddAttributeBranch = () => {
    const newBranch: AttributeBranch = {
      id: uuid(),
      type: BranchType.ATTRIBUTE,
      attributeConditions: [],
    };
    setNodeData({ ...nodeData, branches: [...branches, newBranch] });
  };

  const handleAddCondition = (i: number) => {
    const branchToChange = branches[i];

    branchToChange.attributeConditions.push({
      statements: [],
      relationToNext: LogicRelation.AND,
    });

    setNodeData({ ...nodeData, branches });
  };

  const handleDeleteBranch = (i: number) => {
    branches.splice(i, 1);
    setNodeData({ ...nodeData, branches });
  };

  const handleChangeCondition = (
    i: number,
    j: number,
    condition: AttributeCondition
  ) => {
    const branchToChange = branches[i];

    branchToChange.attributeConditions[j] = condition;
    setNodeData({ ...nodeData, branches });
  };

  const handleDeleteCondition = (i: number, j: number) => {
    const branchToChange = branches[i];

    branchToChange.attributeConditions.splice(j, 1);
    setNodeData({ ...nodeData, branches });
  };

  const onAddCondition = (i: number) => () => handleAddCondition(i);
  const onDeleteBranch = (i: number) => () => handleDeleteBranch(i);
  const onConditionChange =
    (i: number) => (j: number, condition: AttributeCondition) =>
      handleChangeCondition(i, j, condition);
  const onDeleteCondition = (i: number) => (j: number) =>
    handleDeleteCondition(i, j);

  return (
    <div>
      {branches.map((branch, i) => (
        <div key={i} className="mb-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[16px] leading-[24px] text-[#18181B]">
            Branch {i + 1} - Attribute
          </div>
          <AttributeBranchEditor
            onAddCondition={onAddCondition(i)}
            onDeleteBranch={onDeleteBranch(i)}
            onConditionChange={onConditionChange(i)}
            onDeleteCondition={onDeleteCondition(i)}
            branch={branch}
          />
        </div>
      ))}
      <div className="py-[20px] flex gap-[20px]">
        <button
          onClick={handleAddAttributeBranch}
          className="border-[1px] border-[#E5E7EB] bg-white px-[15px] py-[4px] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px]"
        >
          Add branch
        </button>
      </div>
    </div>
  );
};

export default UserAttributeSettings;
