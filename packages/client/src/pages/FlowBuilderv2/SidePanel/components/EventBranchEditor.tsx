import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import {
  Condition,
  ElementKey,
  EventBranch,
  LogicRelation,
  StatementType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { ProviderType } from "types/Workflow";
import ConditionEditor from "./ConditionEditor";
import ConditionViewer from "./ConditionViewer";

interface EventBranchEditorProps {
  branch: EventBranch;
  onAddCondition: () => void;
  onConditionChange: (
    j: number,
    condition: Condition,
    needRelationCheck: boolean
  ) => void;
  onDeleteCondition: (j: number) => void;
  isOnlyBranch?: boolean;
}

const EventBranchEditor: FC<EventBranchEditorProps> = ({
  branch,
  onAddCondition,
  onConditionChange,
  onDeleteCondition,
  isOnlyBranch,
}) => {
  const { isOnboarding } = useAppSelector((state) => state.flowBuilder);

  const [conditionIndexToChange, setConditionIndexToChange] =
    useState<number>();

  useEffect(() => {
    if (branch.conditions.length === 1 && isOnlyBranch) {
      setConditionIndexToChange(0);
    }
  }, []);

  return (
    <div className="flex flex-col gap-[10px] relative border-b pb-5">
      {branch.conditions.map((condition, i) => (
        <React.Fragment key={i}>
          {conditionIndexToChange === i ? (
            <ConditionEditor
              condition={condition}
              onCancel={() => setConditionIndexToChange(undefined)}
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
              className="border-[1px] border-[#E5E7EB] max-w-[80px] px-[15px] py-[4px] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px]"
            >
              <option value={LogicRelation.OR}>Or</option>
              <option value={LogicRelation.AND}>And</option>
            </select>
          )}
        </React.Fragment>
      ))}

      <div className="flex gap-[10px]">
        {conditionIndexToChange === undefined && (
          <Button
            type={ButtonType.LINK}
            onClick={isOnboarding ? () => null : onAddCondition}
          >
            Add condition
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventBranchEditor;
