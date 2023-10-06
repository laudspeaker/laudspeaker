import {
  Branch,
  BranchType,
  Condition,
  LogicRelation,
  TimeType,
  WaitUntilBranch,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC } from "react";
import { ProviderType } from "types/Workflow";
import EventBranchEditor from "../components/EventBranchEditor";
import { SidePanelComponentProps } from "../FlowBuilderSidePanel";
import { v4 as uuid } from "uuid";
import MaxTimeBranchEditor from "../components/MaxTimeBranchEditor";
import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import { toast } from "react-toastify";
import deepCopy from "utils/deepCopy";
import { useAppSelector } from "store/hooks";

const WaitUntilSettings: FC<SidePanelComponentProps<WaitUntilNodeData>> = ({
  nodeData,
  setNodeData,
}) => {
  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  const { branches } = nodeData;

  const handleAddEventBranch = () => {
    const newBranch: Branch = {
      id: uuid(),
      type: BranchType.EVENT,
      conditions: [
        {
          name: "",
          providerType: ProviderType.CUSTOM,
          relationToNext: LogicRelation.OR,
          statements: [],
        },
      ],
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
      providerType: ProviderType.CUSTOM,
      statements: [],
      relationToNext:
        branchToChange.conditions[branchToChange.conditions.length - 1]
          ?.relationToNext || LogicRelation.OR,
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
    condition: Condition,
    needRelationCheck: boolean
  ) => {
    const branchToChange = branches[i];

    if (branchToChange.type !== BranchType.EVENT) return;
    const branchToCheck = deepCopy(branchToChange);

    branchToCheck.conditions[j] = {
      ...condition,
      relationToNext: branchToChange.conditions[j].relationToNext,
    };

    const isSameNameAndProvider = branchToCheck.conditions.every(
      (el, _, arr) =>
        arr[0].providerType === el.providerType &&
        arr[0].providerType !== ProviderType.TRACKER &&
        el.providerType !== ProviderType.TRACKER &&
        arr[0].name === el.name
    );

    if (
      (branchToChange.type !== BranchType.EVENT ||
        !branchToChange.conditions.every(
          (cond) => cond.providerType === ProviderType.TRACKER
        )) &&
      branchToChange.conditions[0]?.relationToNext === LogicRelation.AND &&
      !isSameNameAndProvider
    ) {
      branchToChange.conditions = branchToChange.conditions.map((el) => ({
        ...el,
        relationToNext: LogicRelation.OR,
      }));
      toast.warn(
        "Name and event type should be the same, so top level condition was changed to OR.",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        }
      );
    }

    branchToChange.conditions[j] = {
      ...condition,
      relationToNext: branchToChange.conditions[j].relationToNext,
    };

    if (needRelationCheck) {
      if (isSameNameAndProvider) {
        branchToChange.conditions = branchToChange.conditions.map((el) => ({
          ...el,
          relationToNext: condition.relationToNext,
        }));
      } else {
        toast.error(
          "To use AND condition name and type of event should be the same!",
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          }
        );
      }
    }

    setNodeData({ ...nodeData, branches });
  };

  const handleDeleteCondition = (i: number, j: number) => {
    const branchToChange = branches[i];

    if (branchToChange.type !== BranchType.EVENT) return;

    branchToChange.conditions.splice(j, 1);
    setNodeData({ ...nodeData, branches });
  };

  const handleChangeBranch = (i: number, branch: WaitUntilBranch) => {
    branches[i] = branch;

    setNodeData({ ...nodeData, branches });
  };

  const onAddCondition = (i: number) => () => handleAddCondition(i);
  const onDeleteBranch = (i: number) => () => handleDeleteBranch(i);
  const onConditionChange =
    (i: number) =>
    (j: number, condition: Condition, needRelationCheck: boolean) =>
      handleChangeCondition(i, j, condition, needRelationCheck);
  const onDeleteCondition = (i: number) => (j: number) =>
    handleDeleteCondition(i, j);
  const onChangeBranch = (i: number) => (branch: WaitUntilBranch) =>
    handleChangeBranch(i, branch);

  return (
    <div>
      {branches.map((branch, i) => (
        <div key={i} className="mb-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-[16px] leading-[24px] text-[#18181B] flex items-center justify-between">
            <div>
              Branch {i + 1} -{" "}
              {branch.type === BranchType.EVENT ? "Event" : "Max time"}
            </div>

            <Button
              type={ButtonType.LINK}
              onClick={isOnboarding ? () => {} : onDeleteBranch(i)}
              className="delete-branch text-[#EB5757] hover:text-[#EB5757] focus:text-[#EB5757]"
            >
              Delete branch
            </Button>
          </div>
          {branch.type === BranchType.EVENT ? (
            <EventBranchEditor
              onAddCondition={onAddCondition(i)}
              onConditionChange={onConditionChange(i)}
              onDeleteCondition={onDeleteCondition(i)}
              branch={branch}
            />
          ) : (
            <MaxTimeBranchEditor
              branch={branch}
              onChangeBranch={onChangeBranch(i)}
            />
          )}
        </div>
      ))}

      <div className="pb-[20px] flex gap-[20px]">
        <Button
          type={ButtonType.SECONDARY}
          onClick={handleAddEventBranch}
          disabled={isOnboarding || nodeData.branches.length > 14}
          id="add-branch"
        >
          Add branch
        </Button>

        <Button
          type={ButtonType.SECONDARY}
          onClick={handleAddMaxTimeBranch}
          disabled={
            isOnboarding ||
            branches.some((branch) => branch.type === BranchType.MAX_TIME)
          }
          id="set-max-time"
        >
          Set max. time
        </Button>
      </div>
    </div>
  );
};

export default WaitUntilSettings;
