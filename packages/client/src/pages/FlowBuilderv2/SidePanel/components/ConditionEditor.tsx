import FlowBuilderAutoComplete from "pages/FlowBuilderv2/Elements/FlowBuilderAutoComplete";
import FlowBuilderButton from "pages/FlowBuilderv2/Elements/FlowBuilderButton";
import {
  Condition,
  ElementKey,
  LogicRelation,
  StatementType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
  StatementValueType,
  ComparisonType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
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
    300,
    [keysQuery]
  );

  const loadPossiblePosthogEventTypes = async (query: string) => {
    const { data } = await ApiService.get<string[]>({
      url: `/events/possible-posthog-types?search=${query}`,
    });

    return data;
  };

  const handleAddStatement = (type: StatementType) => {
    setCondition({
      ...condition,
      statements: [
        ...condition.statements,
        type === StatementType.PROPERTY
          ? {
              type,
              key: "",
              comparisonType: ComparisonType.EQUALS,
              valueType: StatementValueType.NUMBER,
              value: "",
              relationToNext: LogicRelation.AND,
            }
          : {
              type,
              order: 0,
              elementKey: ElementKey.TAG_NAME,
              comparisonType: ComparisonType.EQUALS,
              valueType: StatementValueType.NUMBER,
              value: "",
              relationToNext: LogicRelation.AND,
            },
      ],
    });
  };

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
        <FlowBuilderAutoComplete
          value={condition.name}
          includedItems={
            condition.providerType === ProviderType.Posthog
              ? {
                  type: "setter",
                  getItems: loadPossiblePosthogEventTypes,
                }
              : { type: "getter", items: [] }
          }
          retrieveLabel={(item) => item}
          onQueryChange={(query) => {
            setCondition({ ...condition, name: query });
          }}
          onSelect={(value) => {
            setCondition({ ...condition, name: value });
          }}
          placeholder="Event name"
        />
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
          {statement.type === StatementType.PROPERTY ? (
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
                  condition.statements[i] = { ...statement, key: query };
                  setKeysQuery(query);
                  setCondition({ ...condition });
                }}
                onSelect={(value) => {
                  condition.statements[i] = { ...statement, key: value };
                  condition.statements[i].valueType =
                    possibleKeys.find((item) => item.key === value)?.type ||
                    condition.statements[i].valueType;

                  setKeysQuery(value);
                  setCondition({ ...condition });
                }}
                getKey={(value) => value}
                placeholder="Property name"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="font-inter font-normal text-[14px] leading-[22px]">
                  Order
                </div>
                <div>
                  <input
                    type="number"
                    value={statement.order}
                    onChange={(e) => {
                      const order = +e.target.value;

                      if (isNaN(order) || order < 0) return;

                      const newStatements = [...condition.statements];

                      newStatements[i] = {
                        ...statement,
                        order,
                      };

                      setCondition({ ...condition, statements: newStatements });
                    }}
                    className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statement.elementKey}
                  onChange={(e) => {
                    const newStatements = [...condition.statements];

                    newStatements[i] = {
                      ...statement,
                      elementKey: e.target.value as ElementKey,
                    };

                    setCondition({ ...condition, statements: newStatements });
                  }}
                  className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
                >
                  <option value={ElementKey.TAG_NAME}>Tag Name</option>
                  <option value={ElementKey.TEXT}>Text</option>
                </select>
              </div>
            </>
          )}

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

          {i !== condition.statements.length - 1 && (
            <select
              value={statement.relationToNext}
              onChange={(e) => {
                const newStatements = [...condition.statements];

                newStatements[i] = {
                  ...statement,
                  relationToNext: e.target.value as LogicRelation,
                };

                setCondition({ ...condition, statements: newStatements });
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
        <select
          value="default"
          onChange={(e) => handleAddStatement(e.target.value as StatementType)}
          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
        >
          <option value="default" disabled>
            Add condition
          </option>
          <option value={StatementType.PROPERTY}>Property</option>
          <option value={StatementType.ELEMENT}>Element</option>
        </select>

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
