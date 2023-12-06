import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import Select from "components/Elements/Selectv2";
import {
  BranchType,
  Condition,
  ElementKey,
  EventBranch,
  LogicRelation,
  MessageBranch,
  StatementType,
  WUAttributeBranch,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { ProviderType } from "types/Workflow";
import deepCopy from "utils/deepCopy";
import ConditionEditor from "./ConditionEditor";
import ConditionViewer from "./ConditionViewer";

interface EventBranchEditorProps {
  branch: EventBranch | MessageBranch | WUAttributeBranch;
  onAddCondition: (providerType: ProviderType) => void;
  onConditionChange: (
    j: number,
    condition: Condition,
    needRelationCheck: boolean
  ) => void;
  onDeleteCondition: (j: number) => void;
}

const EventBranchEditor: FC<EventBranchEditorProps> = ({
  branch,
  onAddCondition,
  onConditionChange,
  onDeleteCondition,
}) => {
  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  const [conditionIndexToChange, setConditionIndexToChange] =
    useState<number>();
  const [initialConditionData, setInitialConditionData] = useState<
    Condition | undefined
  >();
  const [lastFrameAddedCondition, setLastFrameAddedCondtion] = useState(false);

  useEffect(() => {
    if (lastFrameAddedCondition) {
      setConditionIndexToChange(branch.conditions.length - 1);
      setLastFrameAddedCondtion(false);
      return;
    }

    for (let i = branch.conditions.length - 1; i >= 0; i--) {
      const condition = branch.conditions[i];
      if (
        condition.providerType === ProviderType.CUSTOM &&
        condition.statements.length === 0
      ) {
        setConditionIndexToChange(i);
        return;
      }
    }
  }, [branch.conditions.length]);

  useEffect(() => {
    if (conditionIndexToChange !== undefined) {
      setInitialConditionData(
        deepCopy(branch.conditions[conditionIndexToChange])
      );
    } else {
      setInitialConditionData(undefined);
    }
  }, [conditionIndexToChange]);

  return (
    <div className="flex flex-col gap-[10px] relative border-b pb-5">
      {branch.conditions.map((condition, i) => (
        <React.Fragment key={i}>
          {conditionIndexToChange === i ? (
            <ConditionEditor
              condition={condition}
              onCancel={() => {
                if (initialConditionData) {
                  onConditionChange(i, initialConditionData, false);
                }
                setConditionIndexToChange(undefined);
              }}
              onSave={(changedCondition) => {
                onConditionChange(i, changedCondition, false);
                setConditionIndexToChange(undefined);
              }}
            />
          ) : (
            <ConditionViewer
              condition={condition}
              onEdit={() => setConditionIndexToChange(i)}
              onDelete={() => onDeleteCondition(i)}
            />
          )}
          {i !== branch.conditions.length - 1 && (
            <select
              value={condition.relationToNext}
              onChange={(e) =>
                onConditionChange(
                  i,
                  {
                    ...condition,
                    relationToNext: e.target.value as LogicRelation,
                  },
                  true
                )
              }
              className="border border-[#E5E7EB] max-w-[80px] px-[15px] py-[4px] rounded font-roboto font-normal text-[14px] leading-[22px]"
            >
              <option value={LogicRelation.OR}>Or</option>
              <option value={LogicRelation.AND}>And</option>
            </select>
          )}
        </React.Fragment>
      ))}

      <div className="flex gap-[10px]">
        {(conditionIndexToChange === undefined ||
          !branch.conditions[conditionIndexToChange]) && (
          <>
            <Select
              value={""}
              onChange={(el) => {
                if (isOnboarding) return;

                setLastFrameAddedCondtion(true);
                if (el === BranchType.EVENT) {
                  onAddCondition(ProviderType.CUSTOM);
                } else {
                  onAddCondition(el as ProviderType);
                }
              }}
              className="max-w-[90px]"
              placeholder="Add condition"
              customBTN={
                <Button type={ButtonType.LINK} onClick={() => null}>
                  Add condition
                </Button>
              }
              options={[
                {
                  key: "UserDataLabel",
                  title: "User Data",
                  groupLabel: true,
                },
                {
                  key: ProviderType.WU_ATTRIBUTE,
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
                  key: `${ProviderType.EMAIL_MESSAGE}`,
                  title: "Email",
                },
                {
                  key: `${ProviderType.PUSH_MESSAGE}`,
                  title: "Push",
                },
                {
                  key: `${ProviderType.SMS_MESSAGE}`,
                  title: "SMS",
                },
                {
                  key: `${ProviderType.IN_APP_MESSAGE}`,
                  title: "In-app message",
                },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EventBranchEditor;
