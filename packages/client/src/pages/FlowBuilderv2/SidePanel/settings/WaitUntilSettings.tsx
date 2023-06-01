import {
  Branch,
  BranchType,
  Condition,
  LogicRelation,
  TimeType,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { ProviderType } from "types/Workflow";
import EventBranchEditor from "../components/EventBranchEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import { v4 as uuid } from "uuid";
import MaxTimeBranchEditor from "../components/MaxTimeBranchEditor";

const WaitUntilSettings: FC<SidePanelComponentProps<WaitUntilNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const { branches } = nodeData;

  const handleAddEventBranch = () => {
    const newBranch: Branch = {
      id: uuid(),
      type: BranchType.EVENT,
      conditions: [],
    };
    setNodeData({ ...nodeData, branches: [...branches, newBranch] });
  };

  const handleAddMaxTimeBranch = () => {
    const newBranch: Branch = {
      id: uuid(),
      type: BranchType.MAX_TIME,
      timeType: TimeType.TIME_DELAY,
      delay: {
        days: 0,
        hours: 0,
        minutes: 0,
      },
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

  const handleChangeBranch = (i: number, branch: Branch) => {
    branches[i] = branch;

    setNodeData({ ...nodeData, branches });
  };

  const onAddCondition = (i: number) => () => handleAddCondition(i);
  const onDeleteBranch = (i: number) => () => handleDeleteBranch(i);
  const onConditionChange = (i: number) => (j: number, condition: Condition) =>
    handleChangeCondition(i, j, condition);
  const onDeleteCondition = (i: number) => (j: number) =>
    handleDeleteCondition(i, j);
  const onChangeBranch = (i: number) => (branch: Branch) =>
    handleChangeBranch(i, branch);

  return (
    <div>
      {branches.map((branch, i) => (
        <div key={i} className="mb-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[16px] leading-[24px] text-[#18181B]">
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
            <MaxTimeBranchEditor
              branch={branch}
              onDeleteBranch={onDeleteBranch(i)}
              onChangeBranch={onChangeBranch(i)}
            />
          )}
        </div>
      ))}
      <div className="py-[20px] flex gap-[20px]">
        <button
          onClick={handleAddEventBranch}
          className="border-[1px] border-[#E5E7EB] bg-white px-[15px] py-[4px] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px]"
        >
          Add branch
        </button>
        {!branches.some((branch) => branch.type === BranchType.MAX_TIME) && (
          <button
            onClick={handleAddMaxTimeBranch}
            className="border-[1px] border-[#E5E7EB] bg-white px-[15px] py-[4px] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px]"
          >
            Set max. time
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitUntilSettings;
