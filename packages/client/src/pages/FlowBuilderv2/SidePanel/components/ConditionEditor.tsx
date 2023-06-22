import Button, { ButtonType } from "pages/FlowBuilderv2/Elements/Button";
import FlowBuilderAutoComplete from "pages/FlowBuilderv2/Elements/FlowBuilderAutoComplete";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import Select from "pages/FlowBuilderv2/Elements/Select";
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

enum ConditionEditorError {
  NO_PROPERTY_SPECIFIED,
  NO_VALUE_SPECIFIED,
}

const errorToMessageMap: Record<ConditionEditorError, string> = {
  [ConditionEditorError.NO_PROPERTY_SPECIFIED]: "No property specified",
  [ConditionEditorError.NO_VALUE_SPECIFIED]: "No value specified",
};

const statementTypeTitleMap: Record<StatementType, string> = {
  [StatementType.PROPERTY]: "Property",
  [StatementType.ELEMENT]: "Element",
};

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

  const errors: ConditionEditorError[][] = [];

  for (const statement of condition.statements) {
    const statementErrors: ConditionEditorError[] = [];

    if (!statement.value) {
      statementErrors.push(ConditionEditorError.NO_VALUE_SPECIFIED);
    }

    if (statement.type === StatementType.PROPERTY && !statement.key) {
      statementErrors.push(ConditionEditorError.NO_PROPERTY_SPECIFIED);
    }

    errors.push(statementErrors);
  }

  return (
    <div className="flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      <div className="font-inter font-semibold text-[14px] leading-[22px]">
        Event
      </div>
      <div className="flex gap-[10px]">
        <Select
          value={condition.providerType}
          options={[
            { key: ProviderType.Posthog, title: "Posthog" },
            { key: ProviderType.Custom, title: "Custom" },
          ]}
          onChange={(value) =>
            setCondition({
              ...condition,
              providerType: value,
            })
          }
        />

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
        <>
          <div
            className="bg-white p-[10px] flex flex-col gap-[10px] border-[#E5E7EB] border-[1px] rounded-[4px]"
            key={i}
          >
            <div className="flex justify-between items-center">
              <div className="font-inter font-semibold text-[14px] leading-[22px]">
                {statementTypeTitleMap[statement.type]}
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
              <div className="flex flex-col gap-[10px]">
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
                {errors[i].some(
                  (statementError) =>
                    statementError ===
                    ConditionEditorError.NO_PROPERTY_SPECIFIED
                ) && (
                  <div className="font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                    {
                      errorToMessageMap[
                        ConditionEditorError.NO_PROPERTY_SPECIFIED
                      ]
                    }
                  </div>
                )}
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

                        setCondition({
                          ...condition,
                          statements: newStatements,
                        });
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
            <div className="flex flex-col gap-[10px]">
              <FlowBuilderDynamicInput
                type={statement.valueType}
                value={statement.value}
                onChange={(value) => {
                  condition.statements[i].value = value;
                  setCondition({ ...condition });
                }}
              />

              {errors[i].some(
                (statementError) =>
                  statementError === ConditionEditorError.NO_VALUE_SPECIFIED
              ) && (
                <div className="font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                  {errorToMessageMap[ConditionEditorError.NO_VALUE_SPECIFIED]}
                </div>
              )}
            </div>
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
        </>
      ))}

      <div className="flex items-center gap-[10px]">
        <div className="border-[1px] border-[#E5E7EB] rounded-[2px] px-[12px] py-[5px] font-roboto font-normal text-[14px] leading-[22px] text-[#4B5563]">
          {condition.statements[condition.statements.length - 1]
            ?.relationToNext === LogicRelation.AND
            ? "And"
            : "Or"}
        </div>

        <div className="w-[145px]">
          <Select
            value={undefined}
            options={[
              { key: StatementType.PROPERTY, title: "Property" },
              { key: StatementType.ELEMENT, title: "Element" },
            ]}
            onChange={(value) => value && handleAddStatement(value)}
            placeholder="Add condition"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-[10px]">
          <Button type={ButtonType.SECONDARY} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => onSave(condition)}
            disabled={errors.some(
              (statementErrors) => statementErrors.length > 0
            )}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConditionEditor;
