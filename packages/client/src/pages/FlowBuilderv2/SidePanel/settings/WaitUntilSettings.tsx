import {
  Branch,
  BranchType,
  Condition,
  LogicRelation,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { ProviderType } from "types/Workflow";
import EventBranchEditor from "../components/BranchEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";

const WaitUntilSettings: FC<SidePanelComponentProps<WaitUntilNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const { branches } = nodeData;

  const handleAddBranch = () => {
    const newBranch: Branch = {
      type: BranchType.EVENT,
      conditions: [],
    };
    setNodeData({ ...nodeData, branches: [...branches, newBranch] });
  };

  const handleAddCondition = (i: number) => {
    const branchToChange = branches[i];
    if (branchToChange.type !== BranchType.EVENT) return;

    branchToChange.conditions.push({
      name: "",
      providerType: ProviderType.Custom,
      relationToNext: LogicRelation.AND,
      statements: [],
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
    condition: Condition
  ) => {
    const branchToChange = branches[i];

    if (branchToChange.type !== BranchType.EVENT) return;

    branchToChange.conditions[j] = condition;
    setNodeData({ ...nodeData, branches });
  };

  const handleDeleteCondition = (i: number, j: number) => {
    const branchToChange = branches[i];

    if (branchToChange.type !== BranchType.EVENT) return;

    branchToChange.conditions.splice(j, 1);
    setNodeData({ ...nodeData, branches });
  };

  const onAddCondition = (i: number) => () => handleAddCondition(i);
  const onDeleteBranch = (i: number) => () => handleDeleteBranch(i);
  const onConditionChange = (i: number) => (j: number, condition: Condition) =>
    handleChangeCondition(i, j, condition);
  const onDeleteCondition = (i: number) => (j: number) =>
    handleDeleteCondition(i, j);

  return (
    <div>
      {branches.map((branch, i) => (
        <div key={i} className="mb-[20px] flex flex-col gap-[10px]">
          <div>
            Branch {i + 1} -{" "}
            {branch.type === BranchType.EVENT ? "Event" : "Max time"}
          </div>
          {branch.type === BranchType.EVENT ? (
            <EventBranchEditor
              onAddCondition={onAddCondition(i)}
              onDeleteBranch={onDeleteBranch(i)}
              onConditionChange={onConditionChange(i)}
              onDeleteCondition={onDeleteCondition(i)}
              branch={branch}
            />
          ) : (
            <></>
          )}
        </div>
      ))}
      <div className="py-[20px] flex gap-[20px]">
        <button onClick={handleAddBranch}>Add branch</button>
        <button>Set max. time</button>
      </div>
    </div>
  );
};

export default WaitUntilSettings;
