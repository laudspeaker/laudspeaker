import FlowBuilderButton from "pages/FlowBuilderv2/Elements/FlowBuilderButton";
import {
  ComparisonType,
  Condition,
  StatementValueType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { ProviderType } from "types/Workflow";

interface ConditionEditorProps {
  condition: Condition;
  onCancel: () => void;
  onSave: (condition: Condition) => void;
}

const ConditionEditor: FC<ConditionEditorProps> = ({
  condition: initialCondition,
  onCancel,
  onSave,
}) => {
  const [condition, setCondition] = useState(initialCondition);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  return (
    <div className="flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      <div className="font-inter font-semibold text-[14px] leading-[22px]">
        Event
      </div>
      <div className="flex gap-[10px]">
        <select
          value={condition.providerType}
          onChange={(e) =>
            setCondition({
              ...condition,
              providerType: e.target.value as ProviderType,
            })
          }
          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
        >
          <option value={ProviderType.Posthog}>Posthog</option>
          <option value={ProviderType.Custom}>Custom</option>
        </select>
        {condition.providerType === ProviderType.Posthog && (
          <input
            type="text"
            placeholder="Event name"
            value={condition.name}
            onChange={(e) =>
              setCondition({ ...condition, name: e.target.value })
            }
            className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
          />
        )}
      </div>
      {condition.statements.map((statement, i) => (
        <React.Fragment key={i}>
          <div className="flex justify-between items-center">
            <div className="font-inter font-semibold text-[14px] leading-[22px]">
              Property {i + 1}
            </div>
            <div
              className="cursor-pointer font-roboto font-normal text-[14px] leading-[22px] underline text-[#EB5757]"
              onClick={() => {
                condition.statements.splice(i);
                setCondition({ ...condition });
              }}
            >
              Delete
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Property name"
              value={statement.key}
              onChange={(e) => {
                condition.statements[i].key = e.target.value;
                setCondition({ ...condition });
              }}
              className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="flex gap-[10px]">
            <select
              value={statement.comparisonType}
              onChange={(e) => {
                condition.statements[i].comparisonType = e.target
                  .value as ComparisonType;
                setCondition({ ...condition });
              }}
              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
            >
              {Object.values(ComparisonType).map((comparisonType, j) => (
                <option key={j} value={comparisonType}>
                  {comparisonType}
                </option>
              ))}
            </select>
            <select
              value={statement.valueType}
              onChange={(e) => {
                condition.statements[i].valueType = e.target
                  .value as StatementValueType;
                setCondition({ ...condition });
              }}
              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
            >
              {Object.values(StatementValueType).map((valueType, j) => (
                <option key={j} value={valueType}>
                  {valueType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Value"
              value={statement.value}
              onChange={(e) => {
                condition.statements[i].value = e.target.value;
                setCondition({ ...condition });
              }}
              className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
            />
          </div>
        </React.Fragment>
      ))}
      <div className="flex justify-between items-center">
        <div
          className="cursor-pointer font-inter text-[14px] leading-[22px] underline"
          onClick={() =>
            setCondition({
              ...condition,
              statements: [
                ...condition.statements,
                {
                  key: "",
                  comparisonType: ComparisonType.EQUALS,
                  valueType: StatementValueType.NUMBER,
                  value: "",
                },
              ],
            })
          }
        >
          Add property
        </div>
        <div className="flex gap-[10px]">
          <FlowBuilderButton
            onClick={onCancel}
            className="!rounded-[2px] !text-[#111827] !bg-white !border-[1px] !border-[#E5E7EB]"
          >
            Cancel
          </FlowBuilderButton>
          <FlowBuilderButton
            className="!rounded-[2px]"
            onClick={() => onSave(condition)}
          >
            Save
          </FlowBuilderButton>
        </div>
      </div>
    </div>
  );
};

export default ConditionEditor;
