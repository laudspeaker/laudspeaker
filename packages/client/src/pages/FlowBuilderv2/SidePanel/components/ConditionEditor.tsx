import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "components/AutoCompletev2/AutoCompletev2";
import FlowBuilderDynamicInput from "pages/FlowBuilderv2/Elements/FlowBuilderDynamicInput";
import Select from "components/Elements/Selectv2/Select";
import {
  Condition,
  ElementKey,
  LogicRelation,
  StatementType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useId, useState } from "react";
import { useDebounce } from "react-use";
import {
  StatementValueType,
  ComparisonType,
  valueTypeToComparisonTypesMap,
  addSidePanelError,
  removeSidePanelError,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { ProviderType } from "types/Workflow";
import TrackerEditor from "./TrackerEditor";
import { useAppSelector } from "store/hooks";
import { useDispatch } from "react-redux";

export enum ConditionEditorError {
  NO_PROPERTY_SPECIFIED,
  NO_VALUE_SPECIFIED,
  NO_TRACKER_SPECIFiED,
  NO_TRACKER_EVENT_SPECIFiED,
}

export const errorToMessageMap: Record<ConditionEditorError, string> = {
  [ConditionEditorError.NO_PROPERTY_SPECIFIED]: "No property specified",
  [ConditionEditorError.NO_VALUE_SPECIFIED]: "No value specified",
  [ConditionEditorError.NO_TRACKER_SPECIFiED]: "No template specified",
  [ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED]: "No event specified",
};

export const statementTypeTitleMap: Record<StatementType, string> = {
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
  const { requireSaveEmit } = useAppSelector((store) => store.flowBuilder);
  const id = useId();
  const dispatch = useDispatch();
  const [condition, setCondition] = useState(initialCondition);
  const [keysQuery, setKeysQuery] = useState("");
  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
    }[]
  >([]);
  const [showErrors, setShowErrors] = useState(false);

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
    if (condition.providerType === ProviderType.TRACKER) return;

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
              relationToNext: LogicRelation.OR,
            }
          : {
              type,
              order: 0,
              elementKey: ElementKey.TAG_NAME,
              comparisonType: ComparisonType.EQUALS,
              valueType: StatementValueType.NUMBER,
              value: "",
              relationToNext: LogicRelation.OR,
            },
      ],
    });
  };

  const errors: ConditionEditorError[][] = [];

  if (condition.providerType !== ProviderType.TRACKER) {
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
  } else if (condition.providerType === ProviderType.TRACKER) {
    const statementErrors: ConditionEditorError[] = [];

    if (!condition.trackerId) {
      statementErrors.push(ConditionEditorError.NO_TRACKER_SPECIFiED);
    }

    if (!condition.event) {
      statementErrors.push(ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED);
    }

    errors.push(statementErrors);
  }

  useEffect(() => {
    const isError =
      errors.length > 0 ? errors.every((el) => !!el.length) : false;
    dispatch(isError ? addSidePanelError(id) : removeSidePanelError(id));
  }, [errors]);

  useEffect(() => {
    return () => {
      dispatch(removeSidePanelError(id));
    };
  }, []);

  const handleSave = () => {
    if (errors.some((statementErrors) => statementErrors.length > 0)) {
      setShowErrors(true);
      return;
    }

    onSave(condition);
  };

  useEffect(() => {
    if (requireSaveEmit) handleSave();
  }, [requireSaveEmit]);

  return (
    <div className="condition-editor flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      <div className="font-inter font-semibold text-[14px] leading-[22px]">
        Event
      </div>
      <div className="flex gap-[10px]">
        <Select
          value={condition.providerType}
          options={[
            // Removed for 1 release
            // { key: ProviderType.POSTHOG, title: "Posthog" },
            { key: ProviderType.CUSTOM, title: "Custom" },
            { key: ProviderType.TRACKER, title: "Tracker" },
          ]}
          onChange={(value) =>
            value === ProviderType.TRACKER
              ? setCondition({
                  providerType: ProviderType.TRACKER,
                  relationToNext: condition.relationToNext,
                })
              : setCondition({
                  providerType: value,
                  name: "",
                  statements: [],
                  relationToNext: condition.relationToNext,
                })
          }
        />

        {condition.providerType !== ProviderType.TRACKER && (
          <FlowBuilderAutoComplete
            value={condition.name}
            includedItems={
              condition.providerType === ProviderType.POSTHOG
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
        )}
      </div>

      {condition.providerType === ProviderType.TRACKER ? (
        <TrackerEditor
          trackerId={condition.trackerId}
          onTrackerChange={(trackerId) =>
            setCondition({ ...condition, trackerId })
          }
          showErrors={showErrors}
          errors={{
            [ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED]: errors[0].some(
              (statementError) =>
                statementError ===
                ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED
            )
              ? errorToMessageMap[
                  ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED
                ]
              : "",
            [ConditionEditorError.NO_TRACKER_SPECIFiED]: errors[0].some(
              (statementError) =>
                statementError === ConditionEditorError.NO_TRACKER_SPECIFiED
            )
              ? errorToMessageMap[ConditionEditorError.NO_TRACKER_SPECIFiED]
              : "",
          }}
          event={condition.event}
          onEventChange={(event) => setCondition({ ...condition, event })}
        />
      ) : (
        <>
          {condition.statements.map((statement, i) => (
            <React.Fragment key={i}>
              <div className="bg-white p-[10px] flex flex-col gap-[10px] border-[#E5E7EB] border-[1px] rounded-[4px]">
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
                    <div className="property-name w-full">
                      <FlowBuilderAutoComplete
                        initialValue={statement.key}
                        value={statement.key}
                        includedItems={{
                          type: "getter",
                          items: possibleKeys.map((item) => item.key),
                        }}
                        retrieveLabel={(item) => item}
                        onQueryChange={(query) => {
                          condition.statements[i] = {
                            ...statement,
                            key: query,
                          };
                          setKeysQuery(query);
                          setCondition({ ...condition });
                        }}
                        onSelect={(value) => {
                          condition.statements[i] = {
                            ...statement,
                            key: value,
                          };
                          condition.statements[i].valueType =
                            possibleKeys.find((item) => item.key === value)
                              ?.type || condition.statements[i].valueType;

                          setKeysQuery(value);
                          setCondition({ ...condition });
                        }}
                        getKey={(value) => value}
                        placeholder="Property name"
                      />
                    </div>

                    {showErrors &&
                      errors[i].some(
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

                          setCondition({
                            ...condition,
                            statements: newStatements,
                          });
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
                    className="comparison-type-select w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
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
                    className="value-type-select w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB]"
                  >
                    {Object.values(StatementValueType).map((valueType, j) => (
                      <option key={j} value={valueType}>
                        {valueType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <div className="dynamic-input w-full">
                    <FlowBuilderDynamicInput
                      type={statement.valueType}
                      value={statement.value}
                      onChange={(value) => {
                        condition.statements[i].value = value;
                        setCondition({ ...condition });
                      }}
                    />
                  </div>

                  {showErrors &&
                    errors[i].some(
                      (statementError) =>
                        statementError ===
                        ConditionEditorError.NO_VALUE_SPECIFIED
                    ) && (
                      <div className="font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                        {
                          errorToMessageMap[
                            ConditionEditorError.NO_VALUE_SPECIFIED
                          ]
                        }
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
            </React.Fragment>
          ))}

          <div className="flex items-center gap-[10px]">
            {condition.statements.length > 0 && (
              <div className="border-[1px] border-[#E5E7EB] rounded-[2px] px-[12px] py-[5px] font-roboto font-normal text-[14px] leading-[22px] text-[#4B5563]">
                {condition.statements[condition.statements.length - 1]
                  ?.relationToNext === LogicRelation.AND
                  ? "And"
                  : "Or"}
              </div>
            )}

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
        </>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-[10px]">
          <Button
            className="cancel-condition"
            type={ButtonType.SECONDARY}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="save-condition"
            type={ButtonType.PRIMARY}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConditionEditor;
