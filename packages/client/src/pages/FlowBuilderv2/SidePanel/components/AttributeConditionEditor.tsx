import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "components/AutoCompletev2/AutoCompletev2";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import {
  AttributeCondition,
  LogicRelation,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
  ComparisonType,
  StatementValueType,
  valueTypeToComparisonTypesMap,
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
              {valueTypeToComparisonTypesMap[statement.valueType].map(
                (comparisonType, j) => (
                  <option key={j} value={comparisonType}>
                    {comparisonType}
                  </option>
                )
              )}
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
            <FlowBuilderDynamicInput
              type={statement.valueType}
              value={statement.value}
              onChange={(value) => {
                condition.statements[i].value = value;
                setCondition({ ...condition });
              }}
            />
          </div>
          {i !== condition.statements.length - 1 && (
            <select
              value={statement.relationToNext}
              onChange={(e) => {
                const newStatements = [...condition.statements];

                newStatements[i] = {
                  ...statement,
                  relationToNext: e.target.value as LogicRelation,
                };

                setCondition({
                  ...condition,
                  statements: newStatements.map((el) => ({
                    ...el,
                    relationToNext: e.target.value as LogicRelation,
                  })),
                });
              }}
              className="border-[1px] border-[#E5E7EB] max-w-[80px] px-[15px] py-[4px] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px]"
            >
              <option value={LogicRelation.AND}>And</option>
              <option value={LogicRelation.OR}>Or</option>
            </select>
          )}
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
                  valueType: StatementValueType.STRING,
                  relationToNext: LogicRelation.AND,
                },
              ],
            })
          }
        >
          Add property
        </div>
        <div className="flex gap-[10px]">
          <Button type={ButtonType.SECONDARY} onClick={onCancel}>
            Cancel
          </Button>
          <Button type={ButtonType.PRIMARY} onClick={() => onSave(condition)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttributeConditionEditor;
