import Button, { ButtonType } from "components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "components/AutoCompletev2/AutoCompletev2";
import DynamicInput from "pages/FlowBuilderv2/Elements/DynamicInput";
import Select from "components/Elements/Selectv2/Select";
import {
  Condition,
  ElementKey,
  ElementStatement,
  LogicRelation,
  MessageCondition,
  PropertyStatement,
  StatementType,
  WUAttributeCondition,
  WUAttributeHappenCondition,
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
import { ProviderType, Workflow } from "types/Workflow";
import TrackerEditor from "./TrackerEditor";
import { useAppSelector } from "store/hooks";
import { useDispatch } from "react-redux";
import { MessageEditor } from "./MessageEditor";
import { WUAttributeEditor } from "./WUAttributeEditor";

export enum ConditionEditorError {
  NO_PROPERTY_SPECIFIED,
  NO_VALUE_SPECIFIED,
  NO_TRACKER_SPECIFiED,
  NO_TRACKER_EVENT_SPECIFiED,
  NO_JOURNEY_SPECIFiED,
  NO_ATTRIBUTE_SELECTED,
  UNSUPPORTED_ATTRIBUTE_TYPE,
}

export const errorToMessageMap: Record<ConditionEditorError, string> = {
  [ConditionEditorError.NO_PROPERTY_SPECIFIED]: "No property specified",
  [ConditionEditorError.NO_VALUE_SPECIFIED]: "No value specified",
  [ConditionEditorError.NO_TRACKER_SPECIFiED]: "No template specified",
  [ConditionEditorError.NO_TRACKER_EVENT_SPECIFiED]: "No event specified",
  [ConditionEditorError.NO_JOURNEY_SPECIFiED]: "No journey specified",
  [ConditionEditorError.NO_ATTRIBUTE_SELECTED]: "No attribute specified",
  [ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE]:
    "Unsupportable attribute type",
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
  const [propertiesQuery, setPropertiesQuery] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const loadPossibleEvents = async (query: string) => {
    const { data } = await ApiService.get<string[]>({
      url: `/events/possible-names?search=${query}`,
    });

    return data;
  };

  const loadPossibleEventProperties = async (event: string, query: string) => {
    const { data } = await ApiService.get<string[]>({
      url: `/events/possible-event-properties?event=${event}&search=${query}`,
    });

    return data;
  };

  const handleAddStatement = (type: StatementType) => {
    if (condition.providerType !== ProviderType.CUSTOM) return;

    setCondition({
      ...condition,
      statements: [
        ...condition.statements,
        type === StatementType.PROPERTY
          ? ({
              type,
              key: "",
              comparisonType: ComparisonType.EQUALS,
              valueType: StatementValueType.NUMBER,
              value: "",
              relationToNext: LogicRelation.OR,
            } as PropertyStatement)
          : ({
              type,
              order: 0,
              elementKey: ElementKey.TAG_NAME,
              comparisonType: ComparisonType.EQUALS,
              valueType: StatementValueType.NUMBER,
              value: "",
              relationToNext: LogicRelation.OR,
            } as ElementStatement),
      ],
    });
  };

  const errors: ConditionEditorError[][] = [];

  if (
    condition.providerType === ProviderType.CUSTOM ||
    condition.providerType === ProviderType.POSTHOG
  ) {
    for (const statement of condition.statements) {
      const statementErrors: ConditionEditorError[] = [];

      if (
        statement.type == StatementType.ELEMENT ||
        statement.type == StatementType.PROPERTY
      ) {
        if (!statement.value) {
          statementErrors.push(ConditionEditorError.NO_VALUE_SPECIFIED);
        }

        if (statement.type === StatementType.PROPERTY && !statement.key) {
          statementErrors.push(ConditionEditorError.NO_PROPERTY_SPECIFIED);
        }
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
  } else if (condition.providerType === ProviderType.WU_ATTRIBUTE) {
    const statementErrors: ConditionEditorError[] = [];

    if (!(condition as WUAttributeCondition).attributeName) {
      statementErrors.push(ConditionEditorError.NO_ATTRIBUTE_SELECTED);
    }

    // Might be removed later when support of those two will be added
    if (
      [StatementValueType.ARRAY, StatementValueType.OBJECT].includes(
        (condition as WUAttributeCondition).valueType
      ) &&
      (condition as WUAttributeCondition).happenCondition ===
        WUAttributeHappenCondition.CHANGED_TO
    ) {
      statementErrors.push(ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE);
    }

    errors.push(statementErrors);
  } else {
    const statementErrors: ConditionEditorError[] = [];

    if (!(condition as MessageCondition).from) {
      statementErrors.push(ConditionEditorError.NO_JOURNEY_SPECIFiED);
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

  const isMessageEditing = [
    ProviderType.EMAIL_MESSAGE,
    ProviderType.IN_APP_MESSAGE,
    ProviderType.PUSH_MESSAGE,
    ProviderType.SMS_MESSAGE,
  ].includes(condition.providerType);

  return (
    <div className="condition-editor flex flex-col gap-[10px] p-[10px] bg-[#F3F4F6]">
      <div className="font-inter font-semibold text-[14px] leading-[22px]">
        {isMessageEditing
          ? "Message"
          : condition.providerType === ProviderType.WU_ATTRIBUTE
          ? "Attribute"
          : "Event"}
      </div>
      {condition.providerType !== ProviderType.WU_ATTRIBUTE && (
        <div className="flex gap-[10px]">
          <Select
            value={condition.providerType}
            options={[
              // Removed for 1 release
              // { key: ProviderType.POSTHOG, title: "Posthog" },
              ...(isMessageEditing
                ? [
                    { key: ProviderType.EMAIL_MESSAGE, title: "Email" },
                    { key: ProviderType.SMS_MESSAGE, title: "SMS" },
                    { key: ProviderType.PUSH_MESSAGE, title: "Push" },
                    {
                      key: ProviderType.IN_APP_MESSAGE,
                      title: "In-App message",
                    },
                  ]
                : [
                    { key: ProviderType.CUSTOM, title: "Custom" },
                    { key: ProviderType.TRACKER, title: "Tracker" },
                  ]),
            ]}
            onChange={(value) =>
              value === ProviderType.TRACKER
                ? setCondition({
                    providerType: ProviderType.TRACKER,
                    relationToNext: condition.relationToNext,
                  })
                : isMessageEditing
                ? setCondition({
                    ...condition,
                    providerType: value,
                    relationToNext: condition.relationToNext,
                    from: undefined,
                    fromSpecificMessage: {
                      key: "ANY",
                      title: "Any message",
                    },
                    eventCondition: "received",
                  } as MessageCondition)
                : setCondition({
                    providerType: value,
                    name: "",
                    statements: [],
                    relationToNext: condition.relationToNext,
                  })
            }
          />

          {(condition.providerType === ProviderType.CUSTOM ||
            condition.providerType === ProviderType.POSTHOG) &&
            !isMessageEditing && (
              <FlowBuilderAutoComplete
                value={condition.name}
                includedItems={{
                  type: "setter",
                  getItems: loadPossibleEvents,
                }}
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
      )}

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
      ) : condition.providerType === ProviderType.CUSTOM ? (
        <>
          {condition.statements.map((statement, i) => (
            <React.Fragment key={i}>
              <div className="bg-white p-[10px] flex flex-col gap-[10px] border-[#E5E7EB] border rounded">
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
                          type: "setter",
                          getItems: (query) =>
                            loadPossibleEventProperties(condition.name, query),
                        }}
                        retrieveLabel={(item) => item}
                        onQueryChange={(query) => {
                          condition.statements[i] = {
                            ...statement,
                            key: query,
                          };
                          setPropertiesQuery(query);
                          setCondition({ ...condition });
                        }}
                        onSelect={(value) => {
                          condition.statements[i] = {
                            ...statement,
                            key: value,
                          };

                          setPropertiesQuery(value);
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
                        <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
                          {
                            errorToMessageMap[
                              ConditionEditorError.NO_PROPERTY_SPECIFIED
                            ]
                          }
                        </div>
                      )}
                  </div>
                ) : statement.type === StatementType.ELEMENT ? (
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
                          className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF]"
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
                        className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
                      >
                        <option value={ElementKey.TAG_NAME}>Tag Name</option>
                        <option value={ElementKey.TEXT}>Text</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <></>
                )}
                {statement.type === StatementType.ELEMENT ||
                  (statement.type === StatementType.PROPERTY && (
                    <>
                      <div className="flex gap-[10px]">
                        <select
                          value={statement.comparisonType}
                          onChange={(e) => {
                            // @ts-ignore
                            condition.statements[i].comparisonType = e.target
                              .value as ComparisonType;
                            setCondition({ ...condition });
                          }}
                          className="comparison-type-select w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
                        >
                          {valueTypeToComparisonTypesMap[
                            statement.valueType
                          ].map((comparisonType, j) => (
                            <option key={j} value={comparisonType}>
                              {comparisonType}
                            </option>
                          ))}
                        </select>
                        <select
                          value={statement.valueType}
                          onChange={(e) => {
                            // @ts-ignore
                            condition.statements[i].valueType = e.target
                              .value as StatementValueType;
                            setCondition({ ...condition });
                          }}
                          className="value-type-select w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB]"
                        >
                          {Object.values(StatementValueType).map(
                            (valueType, j) => (
                              <option key={j} value={valueType}>
                                {valueType}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-[10px]">
                        <div className="dynamic-input w-full">
                          <DynamicInput
                            type={statement.valueType}
                            value={statement.value}
                            onChange={(value) => {
                              // @ts-ignore
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
                            <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
                              {
                                errorToMessageMap[
                                  ConditionEditorError.NO_VALUE_SPECIFIED
                                ]
                              }
                            </div>
                          )}
                      </div>
                    </>
                  ))}
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
                  className="border border-[#E5E7EB] max-w-[80px] px-[15px] py-[4px] rounded font-roboto font-normal text-[14px] leading-[22px]"
                >
                  <option value={LogicRelation.AND}>And</option>
                  <option value={LogicRelation.OR}>Or</option>
                </select>
              )}
            </React.Fragment>
          ))}

          <div className="flex items-center gap-[10px]">
            {condition.statements.length > 0 && (
              <div className="border border-[#E5E7EB] rounded-sm px-[12px] py-[5px] font-roboto font-normal text-[14px] leading-[22px] text-[#4B5563]">
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
      ) : isMessageEditing ? (
        <MessageEditor
          showErrors={showErrors}
          errors={{
            [ConditionEditorError.NO_JOURNEY_SPECIFiED]: errors[0].some(
              (statementError) =>
                statementError === ConditionEditorError.NO_JOURNEY_SPECIFiED
            )
              ? errorToMessageMap[ConditionEditorError.NO_JOURNEY_SPECIFiED]
              : "",
          }}
          condition={condition as MessageCondition}
          onChange={setCondition}
        />
      ) : condition.providerType === ProviderType.WU_ATTRIBUTE ? (
        <WUAttributeEditor
          showErrors={showErrors}
          errors={{
            [ConditionEditorError.NO_ATTRIBUTE_SELECTED]: errors[0].some(
              (statementError) =>
                statementError === ConditionEditorError.NO_ATTRIBUTE_SELECTED
            )
              ? errorToMessageMap[ConditionEditorError.NO_ATTRIBUTE_SELECTED]
              : "",
            [ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE]: errors[0].some(
              (statementError) =>
                statementError ===
                ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE
            )
              ? errorToMessageMap[
                  ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE
                ]
              : "",
          }}
          condition={condition as WUAttributeCondition}
          onChange={setCondition}
        />
      ) : (
        <></>
      )}

      <div className="flex justify-end items-center">
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
