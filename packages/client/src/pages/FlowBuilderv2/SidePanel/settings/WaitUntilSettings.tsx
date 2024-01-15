import {
  Branch,
  BranchType,
  Condition,
  LogicRelation,
  MessageBranch,
  MessageCondition,
  TimeType,
  WaitUntilBranch,
  WaitUntilNodeData,
  WUAttributeCondition,
  WUAttributeHappenCondition,
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
import Select from "components/Elements/Selectv2";
import { StatementValueType } from "reducers/flow-builder.reducer";

const branchNaming = {
  [BranchType.EVENT]: "Event",
  [BranchType.MAX_TIME]: "Max time",
  [BranchType.MESSAGE]: "Message",
  [BranchType.WU_ATTRIBUTE]: "Attribute",
};

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

  const handleAddMessageBranch = (providerType: ProviderType) => {
    const newBranch: Branch = {
      id: uuid(),
      type: BranchType.MESSAGE,
      conditions: [
        {
          providerType,
          relationToNext: LogicRelation.OR,
          from: undefined,
          fromSpecificMessage: {
            key: "ANY",
            title: "Any message",
          },
          eventCondition: "received",
        } as MessageCondition,
      ],
    };
    setNodeData({ ...nodeData, branches: [...branches, newBranch] });
  };

  const handleWUAttributeBranch = () => {
    const newBranch: Branch = {
      id: uuid(),
      type: BranchType.WU_ATTRIBUTE,
      conditions: [
        {
          providerType: ProviderType.WU_ATTRIBUTE,
          attributeName: "",
          happenCondition: WUAttributeHappenCondition.CHANGED,
          value: "",
          valueType: StatementValueType.STRING,
          relationToNext: LogicRelation.OR,
        } as WUAttributeCondition,
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

  const handleAddCondition = (i: number, providerType: ProviderType) => {
    const branchToChange = branches[i];

    const isMessageEditing = [
      ProviderType.EMAIL_MESSAGE,
      ProviderType.IN_APP_MESSAGE,
      ProviderType.PUSH_MESSAGE,
      ProviderType.SMS_MESSAGE,
    ].includes(providerType);

    if (
      branchToChange.type !== BranchType.EVENT &&
      branchToChange.type !== BranchType.MESSAGE &&
      branchToChange.type !== BranchType.WU_ATTRIBUTE
    )
      return;

    if (!isMessageEditing && providerType !== ProviderType.WU_ATTRIBUTE) {
      branchToChange.conditions.push({
        name: "",
        providerType: ProviderType.CUSTOM,
        statements: [],
        relationToNext:
          branchToChange.conditions[branchToChange.conditions.length - 1]
            ?.relationToNext || LogicRelation.OR,
      });
    } else if (providerType === ProviderType.WU_ATTRIBUTE) {
      branchToChange.conditions.push({
        providerType: ProviderType.WU_ATTRIBUTE,
        attributeName: "",
        happenCondition: WUAttributeHappenCondition.CHANGED,
        value: "",
        valueType: StatementValueType.STRING,
        relationToNext:
          branchToChange.conditions[branchToChange.conditions.length - 1]
            ?.relationToNext || LogicRelation.OR,
      } as WUAttributeCondition);
    } else {
      branchToChange.conditions.push({
        providerType,
        relationToNext:
          branchToChange.conditions[branchToChange.conditions.length - 1]
            ?.relationToNext || LogicRelation.OR,
        from: undefined,
        fromSpecificMessage: {
          key: "ANY",
          title: "Any message",
        },
        eventCondition: "received",
      } as MessageCondition);
    }

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

    if (
      branchToChange.type !== BranchType.EVENT &&
      branchToChange.type !== BranchType.MESSAGE &&
      branchToChange.type !== BranchType.WU_ATTRIBUTE
    )
      return;

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
        // @ts-ignore TODO:FIX
        arr[0]?.name === el?.name
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

    if (
      branchToChange.type !== BranchType.EVENT &&
      branchToChange.type !== BranchType.MESSAGE &&
      branchToChange.type !== BranchType.WU_ATTRIBUTE
    )
      return;

    branchToChange.conditions.splice(j, 1);
    setNodeData({ ...nodeData, branches });
  };

  const handleChangeBranch = (i: number, branch: WaitUntilBranch) => {
    branches[i] = branch;

    setNodeData({ ...nodeData, branches });
  };

  const onAddCondition = (i: number) => (providerType: ProviderType) =>
    handleAddCondition(i, providerType);
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
    <div className="p-5">
      {branches.map((branch, i) => (
        <div key={i} className="mb-[20px] flex flex-col gap-[10px]">
          <div className="font-inter font-semibold text-base text-[#18181B] flex items-center justify-between">
            <div>
              Branch {i + 1} - {branchNaming[branch.type]}
            </div>

            <Button
              type={ButtonType.LINK}
              onClick={isOnboarding ? () => {} : onDeleteBranch(i)}
              className="delete-branch text-[#EB5757] hover:text-[#EB5757] focus:text-[#EB5757]"
            >
              Delete branch
            </Button>
          </div>
          {branch.type === BranchType.EVENT ||
          branch.type === BranchType.MESSAGE ||
          branch.type === BranchType.WU_ATTRIBUTE ? (
            <EventBranchEditor
              onAddCondition={onAddCondition(i)}
              onConditionChange={onConditionChange(i)}
              onDeleteCondition={onDeleteCondition(i)}
              branch={branch}
            />
          ) : branch.type === BranchType.MAX_TIME ? (
            <MaxTimeBranchEditor
              branch={branch}
              onChangeBranch={onChangeBranch(i)}
            />
          ) : (
            <></>
          )}
        </div>
      ))}

      <div className="pb-[20px] flex gap-5">
        <Select
          value={""}
          onChange={(el) => {
            const value = el?.split(";;");
            if (value.length === 2 && value[0] === "message") {
              handleAddMessageBranch(value[1] as ProviderType);
            } else if (value[0] === BranchType.WU_ATTRIBUTE) {
              handleWUAttributeBranch();
            } else {
              if (value[0] === BranchType.EVENT) {
                handleAddEventBranch();
              }
            }
          }}
          className="max-w-[121px] hover:!outline-none focus:outline-none"
          buttonInnerWrapperClassName="!rounded"
          placeholder="Add branch"
          options={[
            {
              key: "UserDataLabel",
              title: "User Data",
              groupLabel: true,
            },
            {
              key: BranchType.WU_ATTRIBUTE,
              title: "Attribute",
            },
            {
              key: BranchType.EVENT,
              title: "Event",
            },
            {
              key: "MessageLabel",
              title: "Message",
              groupLabel: true,
            },
            {
              key: `${BranchType.MESSAGE};;${ProviderType.EMAIL_MESSAGE}`,
              title: "Email",
            },
            {
              key: `${BranchType.MESSAGE};;${ProviderType.PUSH_MESSAGE}`,
              title: "Push",
            },
            {
              key: `${BranchType.MESSAGE};;${ProviderType.SMS_MESSAGE}`,
              title: "SMS",
            },
            {
              key: `${BranchType.MESSAGE};;${ProviderType.IN_APP_MESSAGE}`,
              title: "In-app message",
            },
          ]}
        />
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
