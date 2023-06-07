import FlowBuilderAutoComplete from "pages/FlowBuilderv2/Elements/FlowBuilderAutoComplete";
import FlowBuilderButton from "pages/FlowBuilderv2/Elements/FlowBuilderButton";
import { AttributeCondition } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
  ComparisonType,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";

interface AttributeConditionEditorProps {
  condition: AttributeCondition;
  onCancel: () => void;
  onSave: (condition: AttributeCondition) => void;
}

const AttributeConditionEditor: FC<AttributeConditionEditorProps> = ({
  condition: initialCondition,
  onCancel,
  onSave,
}) => {
  const [condition, setCondition] = useState(initialCondition);
  const [keysQuery, setKeysQuery] = useState("");
  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
    }[]
  >([]);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const loadPossibleKeys = async (query: string) => {
    const { data } = await ApiService.get<
      {
        key: string;
        type: StatementValueType;
        isArray: boolean;
      }[]
    >({
      url: `/customers/possible-attributes?key=${query}`,
    });

    setPossibleKeys(data);
  };

  useDebounce(
    () => {
      loadPossibleKeys(keysQuery);
    },
    100,
    [keysQuery]
  );

  return (
    <div className="flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      {condition.statements.map((statement, i) => (
        <React.Fragment key={i}>
          <div className="flex justify-between items-center">
            <div className="font-inter font-semibold text-[14px] leading-[22px]">
              Attribute {i + 1}
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
            <FlowBuilderAutoComplete
              initialValue={statement.key}
              value={statement.key}
              includedItems={{
                type: "getter",
                items: possibleKeys.map((item) => item.key),
              }}
              retrieveLabel={(item) => item}
              onQueryChange={(query) => {
                condition.statements[i].key = query;
                setKeysQuery(query);
                setCondition({ ...condition });
              }}
              onSelect={(value) => {
                condition.statements[i].key = value;

                setKeysQuery(value);
                setCondition({ ...condition });
              }}
              getKey={(value) => value}
              placeholder="Property name"
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

export default AttributeConditionEditor;
