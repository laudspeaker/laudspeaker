import React, { FC, useEffect, useId, useState } from "react";
import { useDebounce } from "react-use";
import {
  addSegmentQueryError,
  AttributeQueryStatement,
  ComparisonType,
  ConditionalSegmentsSettings,
  EventQueryAdditionalProperty,
  EventQueryStatement,
  MessageEventQueryStatement,
  ObjectKeyComparisonType,
  PerformedType,
  QueryStatement,
  QueryStatementType,
  QueryType,
  removeSegmentQueryError,
  SegmentQueryStatement,
  StatementValueType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import {
  addSegmentQueryError as addSegmentSettingQueryError,
  removeSegmentQueryError as removeSegmentSettingQueryError,
} from "reducers/segment.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import { Segment } from "types/Segment";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "../../../components/AutoCompletev2/AutoCompletev2";
import FilterBuilderDynamicInput from "../Elements/FlowBuilderDynamicInput";
import { isBefore } from "date-fns";
import { useDispatch } from "react-redux";
import { SegmentsSettings } from "reducers/segment.reducer";
import { capitalize } from "lodash";

interface FilterBuilderProps {
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  isSegmentSettings?: boolean;
  isSubBuilderChild?: boolean;
  requireSettingsReset?: boolean;
  onSubBuilderUngroup?: (statements: QueryStatement[]) => void;
  onSettingsChange: (
    settings: ConditionalSegmentsSettings | SegmentsSettings
  ) => void;
}

enum QueryStatementErrors {
  NO_ATTRIBUTE_NAME,
  NO_SEGMENT_SELECTED,
  NO_EVENT_NAME_SELECTED,
  NO_MESSAGE_NAME_SELECTED,
  TIME_SHOULD_BE_SELECTED,
  TIME_RANGE_INCORRECT,
  NO_OBJECT_KEY,
  EVENT_PROPERTIES_ERRORS,
}

interface QueryStatementError {
  type: QueryStatementErrors;
  eventPropertyErrors: QueryStatementErrors[][];
}

const queryStatementErrorToMessageMap: Record<QueryStatementErrors, string> = {
  [QueryStatementErrors.NO_ATTRIBUTE_NAME]: "Attribute must be defined",
  [QueryStatementErrors.NO_SEGMENT_SELECTED]: "Segment must be selected",
  [QueryStatementErrors.NO_EVENT_NAME_SELECTED]: "Event name must be selected",
  [QueryStatementErrors.TIME_RANGE_INCORRECT]: "Time range is incorrect",
  [QueryStatementErrors.TIME_SHOULD_BE_SELECTED]:
    "All time variables should be filled",
  [QueryStatementErrors.NO_MESSAGE_NAME_SELECTED]:
    "Message name have to be selected",
  [QueryStatementErrors.NO_OBJECT_KEY]: "Object key should be defined",
  [QueryStatementErrors.EVENT_PROPERTIES_ERRORS]:
    "Event properties not fulfilled",
};

const corelationTypeToDefaultSettings: {
  [QueryStatementType.ATTRIBUTE]: AttributeQueryStatement;
  [QueryStatementType.SEGMENT]: SegmentQueryStatement;
  [QueryStatementType.EVENT]: EventQueryStatement;
  [QueryStatementType.MessageEvent]: MessageEventQueryStatement;
} = {
  [QueryStatementType.ATTRIBUTE]: {
    type: QueryStatementType.ATTRIBUTE,
    key: "",
    comparisonType: ComparisonType.EQUALS,
    subComparisonType: ObjectKeyComparisonType.KEY_EXIST,
    subComparisonValue: "",
    valueType: StatementValueType.STRING,
    value: "",
  },
  [QueryStatementType.SEGMENT]: {
    type: QueryStatementType.SEGMENT,
    segmentId: "",
  },
  [QueryStatementType.EVENT]: {
    type: QueryStatementType.EVENT,
    comparisonType: PerformedType.HasPerformed,
    eventName: "",
    value: 1,
    time: undefined,
    additionalProperties: {
      comparison: QueryType.ALL,
      properties: [],
    },
  },
  [QueryStatementType.MessageEvent]: {
    type: QueryStatementType.MessageEvent,
    value: 0,
    eventId: "",
    messageId: "",
    performedType: PerformedType.HasPerformed,
  },
};

const FilterBuilder: FC<FilterBuilderProps> = ({
  settings,
  isSegmentSettings,
  onSettingsChange,
  onSubBuilderUngroup,
  isSubBuilderChild,
}) => {
  const { showSegmentsErrors } = useAppSelector((state) => state.flowBuilder);
  const { showSegmentsErrors: showSegmentsSettingsErrors } = useAppSelector(
    (state) => state.segment
  );
  const id = useId();
  const dispatch = useDispatch();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [keysQuery, setKeysQuery] = useState("");
  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
    }[]
  >([]);

  const loadSegments = async () => {
    const {
      data: { data },
    } = await ApiService.get<{ data: Segment[] }>({ url: "/segments" });

    setSegments(data);
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const loadPossibleKeys = async (q: string) => {
    const { data } = await ApiService.get<
      {
        key: string;
        type: StatementValueType;
        isArray: boolean;
      }[]
    >({
      url: `/customers/possible-attributes?key=${q}`,
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

  const handleAddStatement = () => {
    onSettingsChange({
      ...settings,
      query: {
        ...settings.query,
        statements: [
          ...settings.query.statements,
          {
            type: QueryStatementType.ATTRIBUTE,
            key: "",
            comparisonType: ComparisonType.EQUALS,
            subComparisonType: ObjectKeyComparisonType.KEY_EXIST,
            subComparisonValue: "",
            valueType: StatementValueType.STRING,
            value: "",
          },
        ],
      },
    });
  };

  const handleAddGroup = () => {
    onSettingsChange({
      ...settings,
      query: {
        ...settings.query,
        statements: [
          ...settings.query.statements,
          {
            type: QueryType.ALL,
            statements: [],
            isSubBuilderChild: true,
          },
        ],
      },
    });
  };

  const handleDeleteStatement = (i: number) => {
    const newStatements = [...settings.query.statements];

    newStatements.splice(i, 1);

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  const handleChangeStatement = (i: number, statement: QueryStatement) => {
    const newStatements = [...settings.query.statements];

    newStatements[i] = statement;

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  const handleChangeEventProperty = (
    i: number,
    j: number,
    property: EventQueryAdditionalProperty
  ) => {
    const newStatements = [...settings.query.statements];

    const statement = newStatements[i] as EventQueryStatement;

    const newProperties = [...statement.additionalProperties.properties];

    newProperties[j] = { ...property };

    newStatements[i] = {
      ...statement,
      additionalProperties: {
        ...statement.additionalProperties,
        properties: [...newProperties],
      },
    };

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  const handleDeleteEventProperty = (i: number, j: number) => {
    const newStatements = [...settings.query.statements];

    const statement = newStatements[i] as EventQueryStatement;

    const newProperties = [...statement.additionalProperties.properties];

    newProperties.splice(j, 1);

    newStatements[i] = {
      ...statement,
      additionalProperties: {
        ...statement.additionalProperties,
        properties: [...newProperties],
      },
    };

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  const handleUngroup = (i: number) => (statements: QueryStatement[]) => {
    const newStatements = [...settings.query.statements];

    newStatements.splice(i, 1);

    onSettingsChange({
      ...settings,
      query: {
        ...settings.query,
        statements: [...newStatements, ...statements],
      },
    });
  };

  const statementsErrors: QueryStatementError[][] = [];

  for (const statement of settings.query.statements) {
    const statementErrors: QueryStatementError[] = [];

    if (statement.type === QueryStatementType.ATTRIBUTE) {
      if (!statement.key)
        statementErrors.push({
          type: QueryStatementErrors.NO_ATTRIBUTE_NAME,
          eventPropertyErrors: [],
        });

      if (
        statement.valueType === StatementValueType.OBJECT &&
        statement.comparisonType === ComparisonType.OBJECT_KEY
      ) {
        if (!statement.value)
          statementErrors.push({
            type: QueryStatementErrors.NO_OBJECT_KEY,
            eventPropertyErrors: [],
          });
      }

      if (
        (statement.comparisonType === ComparisonType.BEFORE &&
          statement.value === undefined) ||
        (statement.comparisonType === ComparisonType.AFTER &&
          statement.value === undefined) ||
        (statement.comparisonType === ComparisonType.DURING &&
          (statement.value === undefined ||
            statement.subComparisonValue === undefined ||
            isBefore(
              new Date(statement.subComparisonValue),
              new Date(statement.value)
            )))
      )
        statementErrors.push({
          type: QueryStatementErrors.TIME_RANGE_INCORRECT,
          eventPropertyErrors: [],
        });
    }

    if (statement.type === QueryStatementType.SEGMENT && !statement.segmentId) {
      statementErrors.push({
        type: QueryStatementErrors.NO_SEGMENT_SELECTED,
        eventPropertyErrors: [],
      });
    }

    if (statement.type === QueryStatementType.EVENT) {
      if (
        (statement.time?.comparisonType === ComparisonType.BEFORE &&
          !statement.time.timeBefore) ||
        (statement.time?.comparisonType === ComparisonType.AFTER &&
          !statement.time.timeAfter) ||
        (statement.time?.comparisonType === ComparisonType.DURING &&
          (!statement.time?.timeBefore ||
            !statement.time?.timeAfter ||
            isBefore(
              new Date(statement.time.timeBefore),
              new Date(statement.time.timeAfter)
            )))
      )
        statementErrors.push({
          type: QueryStatementErrors.TIME_RANGE_INCORRECT,
          eventPropertyErrors: [],
        });

      if (!statement.eventName)
        statementErrors.push({
          type: QueryStatementErrors.NO_EVENT_NAME_SELECTED,
          eventPropertyErrors: [],
        });

      const eventPropertiesErrors: QueryStatementErrors[][] = [];

      statement.additionalProperties.properties.forEach((property) => {
        const errors: QueryStatementErrors[] = [];
        if (!property.key) errors.push(QueryStatementErrors.NO_ATTRIBUTE_NAME);

        if (
          property.valueType === StatementValueType.OBJECT &&
          property.comparisonType === ComparisonType.OBJECT_KEY
        ) {
          if (!property.value) errors.push(QueryStatementErrors.NO_OBJECT_KEY);
        }

        if (
          (property.comparisonType === ComparisonType.BEFORE &&
            !property.value) ||
          (property.comparisonType === ComparisonType.AFTER &&
            !property.value) ||
          (property.comparisonType === ComparisonType.DURING &&
            (!property.value ||
              !property.subComparisonValue ||
              isBefore(
                new Date(property.subComparisonValue),
                new Date(property.value)
              )))
        )
          errors.push(QueryStatementErrors.TIME_RANGE_INCORRECT);

        eventPropertiesErrors.push(errors);
      });

      if (
        eventPropertiesErrors.length &&
        eventPropertiesErrors.some((evPropError) => evPropError.length !== 0)
      )
        statementErrors.push({
          type: QueryStatementErrors.EVENT_PROPERTIES_ERRORS,
          eventPropertyErrors: eventPropertiesErrors,
        });
    }

    if (statement.type === QueryStatementType.MessageEvent) {
      if (!statement.messageId)
        statementErrors.push({
          type: QueryStatementErrors.NO_MESSAGE_NAME_SELECTED,
          eventPropertyErrors: [],
        });

      if (!statement.eventId)
        statementErrors.push({
          type: QueryStatementErrors.NO_EVENT_NAME_SELECTED,
          eventPropertyErrors: [],
        });
    }

    statementsErrors.push(statementErrors);
  }

  useEffect(() => {
    const isError =
      statementsErrors.length > 0
        ? statementsErrors.some((el) => !!el.length)
        : false;

    dispatch(
      (isError
        ? isSegmentSettings
          ? addSegmentSettingQueryError
          : addSegmentQueryError
        : isSegmentSettings
        ? removeSegmentSettingQueryError
        : removeSegmentQueryError)(id)
    );
  }, [statementsErrors]);

  return (
    <div className="flex w-full flex-col gap-[10px]">
      <div className="flex relative w-full gap-[10px] items-center">
        <div>
          <select
            value={settings.query.type}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                query: {
                  ...settings.query,
                  type: e.target.value as QueryType,
                },
              })
            }
            className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
          >
            {Object.values(QueryType).map((comparisonType, j) => (
              <option key={j} value={comparisonType}>
                {capitalize(comparisonType)}
              </option>
            ))}
          </select>
        </div>
        <div className="font-normal text-[14px] leading-[22px]">
          of the following conditions match
        </div>
        <div className="absolute top-full left-[25px] z-[0] h-[10px] w-[1px] bg-[#E5E7EB]" />
      </div>
      {settings.query.statements.map((statement, i) => (
        <React.Fragment key={i}>
          <div className="flex max-w-[924px] relative w-full flex-nowrap items-center">
            <div className="absolute top-0 left-[25px] z-[0] h-full w-[1px] bg-[#E5E7EB]" />
            <div className="absolute top-full left-[25px] z-[0] h-[10px] w-[1px] bg-[#E5E7EB]" />
            <div
              className={`${
                settings.query.type === QueryType.ALL
                  ? "text-[#0C4A6E] bg-[#E0F2FE]"
                  : "text-[#713F12] bg-[#FEF9C3]"
              } ${
                // @ts-ignore
                statement?.isSubBuilderChild ? "self-start mt-[4px]" : ""
              } min-w-[50px] z-[1] text-center mr-[10px] py-[2px] px-[11.5px] rounded-[14px] font-roboto font-normal text-[14px] leading-[22px]`}
            >
              {settings.query.type === QueryType.ALL ? "AND" : "OR"}
            </div>
            <div
              key={i}
              className={`${
                /* @ts-ignore */
                !statement?.isSubBuilderChild && "bg-[#F3F4F6] p-[10px]"
              } rounded-[4px] flex justify-between items-center`}
            >
              <div className="flex gap-[10px] relative items-center flex-wrap">
                {/* @ts-ignore */}
                {!statement?.isSubBuilderChild && (
                  <div>
                    <select
                      value={statement.type}
                      onChange={(e) =>
                        handleChangeStatement(
                          i,
                          // @ts-ignore
                          corelationTypeToDefaultSettings?.[e.target.value] ||
                            statement
                        )
                      }
                      className={`${
                        statement.type === QueryStatementType.MessageEvent
                          ? "w-[140px]"
                          : "w-[100px]"
                      } px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]`}
                    >
                      {Object.values(QueryStatementType).map(
                        (comparisonType, j) => (
                          <option key={j} value={comparisonType}>
                            {comparisonType}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
                {statement.type === QueryStatementType.ATTRIBUTE ? (
                  <>
                    <div>
                      <FlowBuilderAutoComplete
                        initialValue={statement.key}
                        value={statement.key}
                        includedItems={{
                          type: "getter",
                          items: possibleKeys.map((item) => item.key),
                        }}
                        retrieveLabel={(item) => item}
                        onQueryChange={(q) => {
                          handleChangeStatement(i, { ...statement, key: q });
                          setKeysQuery(q);
                        }}
                        onSelect={(value) => {
                          handleChangeStatement(i, {
                            ...statement,
                            key: value,
                          });
                          setKeysQuery(value);
                        }}
                        getKey={(value) => value}
                        placeholder="Attribute name"
                      />
                    </div>
                    <div>
                      <select
                        value={`${statement.valueType};;${statement.comparisonType}`}
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                        onChange={(ev) => {
                          if (!ev.target.value) return;

                          const [valueType, comparisonValueType] =
                            ev.target.value.split(";;");

                          handleChangeStatement(i, {
                            ...statement,
                            valueType: valueType as StatementValueType,
                            comparisonType:
                              comparisonValueType as ComparisonType,
                          });
                        }}
                      >
                        {Object.values(StatementValueType).map(
                          (comparisonType, j) => (
                            <optgroup key={j} label={comparisonType}>
                              {valueTypeToComparisonTypesMap[
                                comparisonType
                              ].map((comparisonValueType, k) => (
                                <option
                                  key={k}
                                  value={`${comparisonType};;${comparisonValueType}`}
                                >
                                  {comparisonValueType}
                                </option>
                              ))}
                            </optgroup>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      {statement.valueType === StatementValueType.ARRAY &&
                      [
                        ComparisonType.ARRAY_LENGTH_EQUAL,
                        ComparisonType.ARRAY_LENGTH_GREATER,
                        ComparisonType.ARRAY_LENGTH_LESS,
                      ].includes(statement.comparisonType) ? (
                        <FilterBuilderDynamicInput
                          type={StatementValueType.NUMBER}
                          value={statement.value}
                          onChange={(value) =>
                            +value >= 0 &&
                            handleChangeStatement(i, {
                              ...statement,
                              value: +value ? value : "0",
                            })
                          }
                        />
                      ) : (
                        statement.comparisonType !== ComparisonType.EXIST &&
                        statement.comparisonType !==
                          ComparisonType.NOT_EXIST && (
                          <FilterBuilderDynamicInput
                            type={statement.valueType}
                            value={statement.value}
                            onChange={(value) =>
                              handleChangeStatement(i, {
                                ...statement,
                                value,
                              })
                            }
                          />
                        )
                      )}
                    </div>
                    {statement.valueType === StatementValueType.DATE &&
                      statement.comparisonType === ComparisonType.DURING && (
                        <>
                          -
                          <div>
                            <FilterBuilderDynamicInput
                              type={StatementValueType.DATE}
                              value={statement.subComparisonValue || ""}
                              onChange={(value) => {
                                handleChangeStatement(i, {
                                  ...statement,
                                  subComparisonValue: value,
                                });
                              }}
                            />
                          </div>
                        </>
                      )}
                    {statement.comparisonType === ComparisonType.OBJECT_KEY && (
                      <div>
                        <select
                          value={statement.subComparisonType}
                          onChange={(e) =>
                            handleChangeStatement(i, {
                              ...statement,
                              subComparisonType: e.target
                                .value as ObjectKeyComparisonType,
                            })
                          }
                          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                        >
                          {Object.values(ObjectKeyComparisonType).map(
                            (comparisonType, j) => (
                              <option key={j} value={comparisonType}>
                                {comparisonType}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )}
                    {statement.comparisonType === ComparisonType.OBJECT_KEY &&
                      [
                        ObjectKeyComparisonType.KEY_VALUE_EQUAL_TO,
                        ObjectKeyComparisonType.KEY_VALUE_NOT_EQUAL_TO,
                      ].includes(statement.subComparisonType) && (
                        <div>
                          <FilterBuilderDynamicInput
                            type={StatementValueType.STRING}
                            value={statement.subComparisonValue}
                            onChange={(value) =>
                              handleChangeStatement(i, {
                                ...statement,
                                subComparisonValue: value,
                              })
                            }
                          />
                        </div>
                      )}
                  </>
                ) : statement.type === QueryStatementType.SEGMENT ? (
                  <div>
                    <select
                      value={statement.segmentId}
                      onChange={(e) =>
                        handleChangeStatement(i, {
                          ...statement,
                          segmentId: e.target.value,
                        })
                      }
                      className={`w-[140px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px] ${
                        statement.segmentId ? "" : "text-[#9CA3AF]"
                      }`}
                    >
                      <option value="" disabled>
                        segment
                      </option>
                      {segments.map((segment, j) => (
                        <option
                          className="text-[#111827]"
                          key={j}
                          value={segment.id}
                        >
                          {segment.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : statement.type === QueryStatementType.EVENT ? (
                  <>
                    <div className="flex gap-[10px]">
                      <div>
                        <FilterBuilderDynamicInput
                          type={StatementValueType.STRING}
                          value={statement.eventName}
                          placeholder="Name"
                          onChange={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              eventName: value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center">
                        <select
                          value={statement.comparisonType}
                          onChange={(e) =>
                            handleChangeStatement(i, {
                              ...statement,

                              comparisonType: e.target.value as PerformedType,
                            })
                          }
                          className="w-[166px] px-[12px] py-[5px] mr-[10px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                        >
                          {Object.values(PerformedType).map(
                            (performedType, j) => (
                              <option key={j} value={performedType}>
                                {performedType}
                              </option>
                            )
                          )}
                        </select>
                        <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                          at least
                        </span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={statement.value}
                          onChange={(e) =>
                            +e.target.value >= 0 &&
                            handleChangeStatement(i, {
                              ...statement,
                              value: +e.target.value || 0,
                            })
                          }
                          min="0"
                          placeholder="Mins"
                          className="w-full max-w-[80px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] mr-[6px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
                        />
                        <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                          time
                        </span>
                      </div>
                    </div>

                    {statement.time !== undefined && (
                      <div className="min-w-full flex items-center px-[20px] py-[14px] border border-[#E5E7EB] bg-white gap-[10px]">
                        <select
                          value={statement.time.comparisonType}
                          onChange={(e) =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                comparisonType: e.target.value as any,
                              },
                            })
                          }
                          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                        >
                          {[
                            ComparisonType.BEFORE,
                            ComparisonType.AFTER,
                            ComparisonType.DURING,
                          ].map((comparisonType, j) => (
                            <option key={j} value={comparisonType}>
                              {comparisonType}
                            </option>
                          ))}
                        </select>
                        <FilterBuilderDynamicInput
                          type={StatementValueType.DATE}
                          value={
                            (statement.time?.comparisonType ===
                            ComparisonType.BEFORE
                              ? statement.time.timeBefore
                              : statement.time.timeAfter) || ""
                          }
                          onChange={(value) => {
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                ...statement.time!,
                                ...(statement.time?.comparisonType ===
                                ComparisonType.BEFORE
                                  ? {
                                      timeBefore: new Date(value).toISOString(),
                                    }
                                  : {
                                      timeAfter: new Date(value).toISOString(),
                                    }),
                              },
                            });
                          }}
                        />
                        {statement.time?.comparisonType ===
                          ComparisonType.DURING && (
                          <>
                            -
                            <FilterBuilderDynamicInput
                              type={StatementValueType.DATE}
                              value={statement.time.timeBefore || ""}
                              onChange={(value) => {
                                handleChangeStatement(i, {
                                  ...statement,
                                  time: {
                                    ...statement.time!,
                                    timeBefore: new Date(value).toISOString(),
                                  },
                                });
                              }}
                            />
                          </>
                        )}
                        <div
                          className="cursor-pointer ml-auto"
                          onClick={() =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: undefined,
                            })
                          }
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5.28739 2.14118H5.14453C5.2231 2.14118 5.28739 2.0769 5.28739 1.99833V2.14118H10.716V1.99833C10.716 2.0769 10.7802 2.14118 10.8588 2.14118H10.716V3.4269H12.0017V1.99833C12.0017 1.36797 11.4892 0.855469 10.8588 0.855469H5.14453C4.51417 0.855469 4.00167 1.36797 4.00167 1.99833V3.4269H5.28739V2.14118ZM14.2874 3.4269H1.71596C1.39989 3.4269 1.14453 3.68225 1.14453 3.99833V4.56975C1.14453 4.64833 1.20882 4.71261 1.28739 4.71261H2.36596L2.80703 14.0519C2.8356 14.6608 3.33917 15.1412 3.9481 15.1412H12.0552C12.666 15.1412 13.1677 14.6626 13.1963 14.0519L13.6374 4.71261H14.716C14.7945 4.71261 14.8588 4.64833 14.8588 4.56975V3.99833C14.8588 3.68225 14.6035 3.4269 14.2874 3.4269ZM11.9177 13.8555H4.0856L3.65346 4.71261H12.3499L11.9177 13.8555Z"
                              fill="#4B5563"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    {!!statement.additionalProperties.properties.length && (
                      <>
                        <div className="min-w-full">
                          <div className="flex relative w-full gap-[10px] items-center">
                            <div>
                              <select
                                value={
                                  statement.additionalProperties.comparison
                                }
                                onChange={(e) =>
                                  handleChangeStatement(i, {
                                    ...statement,
                                    additionalProperties: {
                                      ...statement.additionalProperties,
                                      comparison: e.target.value as QueryType,
                                    },
                                  })
                                }
                                className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
                              >
                                {Object.values(QueryType).map(
                                  (comparisonType, j) => (
                                    <option key={j} value={comparisonType}>
                                      {capitalize(comparisonType)}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                            <div className="font-normal text-[14px] leading-[22px]">
                              of the following conditions match
                            </div>
                          </div>
                          <div className="w-full flex flex-col gap-[10px] mt-[10px]">
                            {statement.additionalProperties.properties.map(
                              (property, propertyI) => (
                                <>
                                  <div className="flex items-center w-full">
                                    <div
                                      className={`${
                                        statement.additionalProperties
                                          .comparison === QueryType.ALL
                                          ? "text-[#0C4A6E] bg-[#E0F2FE]"
                                          : "text-[#713F12] bg-[#FEF9C3]"
                                      } min-w-[50px] z-[1] text-center mr-[10px] py-[2px] px-[11.5px] rounded-[14px] font-roboto font-normal text-[14px] leading-[22px]`}
                                    >
                                      {statement.additionalProperties
                                        .comparison === QueryType.ALL
                                        ? "AND"
                                        : "OR"}
                                    </div>
                                    <div className="flex gap-[10px] items-center bg-white p-[10px] w-full">
                                      <>
                                        <div>
                                          <FlowBuilderAutoComplete
                                            initialValue={property.key}
                                            value={property.key}
                                            includedItems={{
                                              type: "getter",
                                              items: possibleKeys.map(
                                                (item) => item.key
                                              ),
                                            }}
                                            retrieveLabel={(item) => item}
                                            onQueryChange={(q) => {
                                              handleChangeEventProperty(
                                                i,
                                                propertyI,
                                                {
                                                  ...property,
                                                  key: q,
                                                }
                                              );
                                              setKeysQuery(q);
                                            }}
                                            onSelect={(value) => {
                                              handleChangeEventProperty(
                                                i,
                                                propertyI,
                                                {
                                                  ...property,
                                                  key: value,
                                                }
                                              );
                                              setKeysQuery(value);
                                            }}
                                            getKey={(value) => value}
                                            placeholder="Property name"
                                          />
                                        </div>
                                        <div>
                                          <select
                                            value={`${property.valueType};;${property.comparisonType}`}
                                            className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                                            onChange={(ev) => {
                                              if (!ev.target.value) return;

                                              const [
                                                valueType,
                                                comparisonValueType,
                                              ] = ev.target.value.split(";;");

                                              handleChangeEventProperty(
                                                i,
                                                propertyI,
                                                {
                                                  ...property,
                                                  valueType:
                                                    valueType as StatementValueType,
                                                  comparisonType:
                                                    comparisonValueType as ComparisonType,
                                                }
                                              );
                                            }}
                                          >
                                            {Object.values(
                                              StatementValueType
                                            ).map((comparisonType, j) => (
                                              <optgroup
                                                key={j}
                                                label={comparisonType}
                                              >
                                                {valueTypeToComparisonTypesMap[
                                                  comparisonType
                                                ].map(
                                                  (comparisonValueType, k) => (
                                                    <option
                                                      key={k}
                                                      value={`${comparisonType};;${comparisonValueType}`}
                                                    >
                                                      {comparisonValueType}
                                                    </option>
                                                  )
                                                )}
                                              </optgroup>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          {property.valueType ===
                                            StatementValueType.ARRAY &&
                                          [
                                            ComparisonType.ARRAY_LENGTH_EQUAL,
                                            ComparisonType.ARRAY_LENGTH_GREATER,
                                            ComparisonType.ARRAY_LENGTH_LESS,
                                          ].includes(
                                            property.comparisonType
                                          ) ? (
                                            <FilterBuilderDynamicInput
                                              type={StatementValueType.NUMBER}
                                              value={property.value}
                                              onChange={(value) =>
                                                +value >= 0 &&
                                                handleChangeEventProperty(
                                                  i,
                                                  propertyI,
                                                  {
                                                    ...property,
                                                    value: +value ? value : "0",
                                                  }
                                                )
                                              }
                                            />
                                          ) : (
                                            property.comparisonType !==
                                              ComparisonType.EXIST &&
                                            property.comparisonType !==
                                              ComparisonType.NOT_EXIST && (
                                              <FilterBuilderDynamicInput
                                                type={property.valueType}
                                                value={property.value}
                                                onChange={(value) =>
                                                  handleChangeEventProperty(
                                                    i,
                                                    propertyI,
                                                    {
                                                      ...property,
                                                      value,
                                                    }
                                                  )
                                                }
                                              />
                                            )
                                          )}
                                        </div>
                                        {property.valueType ===
                                          StatementValueType.DATE &&
                                          property.comparisonType ===
                                            ComparisonType.DURING && (
                                            <>
                                              -
                                              <div>
                                                <FilterBuilderDynamicInput
                                                  type={StatementValueType.DATE}
                                                  value={
                                                    property.subComparisonValue ||
                                                    ""
                                                  }
                                                  onChange={(value) => {
                                                    handleChangeEventProperty(
                                                      i,
                                                      propertyI,
                                                      {
                                                        ...property,
                                                        subComparisonValue:
                                                          value,
                                                      }
                                                    );
                                                  }}
                                                />
                                              </div>
                                            </>
                                          )}
                                        {property.comparisonType ===
                                          ComparisonType.OBJECT_KEY && (
                                          <div>
                                            <select
                                              value={property.subComparisonType}
                                              onChange={(e) =>
                                                handleChangeEventProperty(
                                                  i,
                                                  propertyI,
                                                  {
                                                    ...property,
                                                    subComparisonType: e.target
                                                      .value as ObjectKeyComparisonType,
                                                  }
                                                )
                                              }
                                              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                                            >
                                              {Object.values(
                                                ObjectKeyComparisonType
                                              ).map((comparisonType, j) => (
                                                <option
                                                  key={j}
                                                  value={comparisonType}
                                                >
                                                  {comparisonType}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                        {property.comparisonType ===
                                          ComparisonType.OBJECT_KEY &&
                                          [
                                            ObjectKeyComparisonType.KEY_VALUE_EQUAL_TO,
                                            ObjectKeyComparisonType.KEY_VALUE_NOT_EQUAL_TO,
                                          ].includes(
                                            property.subComparisonType
                                          ) && (
                                            <div>
                                              <FilterBuilderDynamicInput
                                                type={StatementValueType.STRING}
                                                value={
                                                  property.subComparisonValue
                                                }
                                                onChange={(value) =>
                                                  handleChangeEventProperty(
                                                    i,
                                                    propertyI,
                                                    {
                                                      ...property,
                                                      subComparisonValue: value,
                                                    }
                                                  )
                                                }
                                              />
                                            </div>
                                          )}
                                      </>
                                      <div
                                        className="cursor-pointer ml-auto"
                                        onClick={() =>
                                          handleDeleteEventProperty(
                                            i,
                                            propertyI
                                          )
                                        }
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M5.28739 2.14118H5.14453C5.2231 2.14118 5.28739 2.0769 5.28739 1.99833V2.14118H10.716V1.99833C10.716 2.0769 10.7802 2.14118 10.8588 2.14118H10.716V3.4269H12.0017V1.99833C12.0017 1.36797 11.4892 0.855469 10.8588 0.855469H5.14453C4.51417 0.855469 4.00167 1.36797 4.00167 1.99833V3.4269H5.28739V2.14118ZM14.2874 3.4269H1.71596C1.39989 3.4269 1.14453 3.68225 1.14453 3.99833V4.56975C1.14453 4.64833 1.20882 4.71261 1.28739 4.71261H2.36596L2.80703 14.0519C2.8356 14.6608 3.33917 15.1412 3.9481 15.1412H12.0552C12.666 15.1412 13.1677 14.6626 13.1963 14.0519L13.6374 4.71261H14.716C14.7945 4.71261 14.8588 4.64833 14.8588 4.56975V3.99833C14.8588 3.68225 14.6035 3.4269 14.2874 3.4269ZM11.9177 13.8555H4.0856L3.65346 4.71261H12.3499L11.9177 13.8555Z"
                                            fill="#4B5563"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  {(isSegmentSettings
                                    ? showSegmentsSettingsErrors
                                    : showSegmentsErrors) &&
                                    statementsErrors[i].map((error, errorI) => (
                                      <React.Fragment key={errorI}>
                                        {error?.eventPropertyErrors[
                                          propertyI
                                        ]?.map((propError, propErrorI) => (
                                          <div
                                            key={propErrorI}
                                            className="ml-[60px] w-full font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]"
                                          >
                                            {
                                              queryStatementErrorToMessageMap[
                                                propError
                                              ]
                                            }
                                          </div>
                                        ))}
                                      </React.Fragment>
                                    ))}
                                </>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="min-w-full flex items-center gap-[10px]">
                      <Button
                        type={ButtonType.LINK}
                        className="text-[#6366F1]"
                        onClick={() =>
                          handleChangeStatement(i, {
                            ...statement,
                            additionalProperties: {
                              ...statement.additionalProperties,
                              properties: [
                                ...statement.additionalProperties.properties,
                                {
                                  key: "",
                                  comparisonType: ComparisonType.EQUALS,
                                  subComparisonType:
                                    ObjectKeyComparisonType.KEY_EXIST,
                                  subComparisonValue: "",
                                  valueType: StatementValueType.STRING,
                                  value: "",
                                },
                              ],
                            },
                          })
                        }
                      >
                        Add property
                      </Button>
                      {statement.time === undefined && (
                        <Button
                          type={ButtonType.LINK}
                          className="text-[#6366F1]"
                          onClick={() =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                comparisonType: ComparisonType.BEFORE,
                                timeBefore: new Date().toISOString(),
                              },
                            })
                          }
                        >
                          Set time
                        </Button>
                      )}
                    </div>
                  </>
                ) : statement.type === QueryStatementType.MessageEvent ? (
                  <>
                    <div>
                      <select
                        value={statement.messageId}
                        onChange={(e) =>
                          handleChangeStatement(i, {
                            ...statement,
                            messageId: e.target.value,
                          })
                        }
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                      >
                        <option value="" disabled>
                          message name
                        </option>
                        <option value="text">test message</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={statement.eventId}
                        onChange={(e) =>
                          handleChangeStatement(i, {
                            ...statement,
                            eventId: e.target.value,
                          })
                        }
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                      >
                        <option value="" disabled>
                          event name
                        </option>
                        <option value="text">test</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <select
                        value={statement.performedType}
                        onChange={(e) =>
                          handleChangeStatement(i, {
                            ...statement,
                            performedType: e.target.value as PerformedType,
                          })
                        }
                        className="w-[166px] px-[12px] py-[5px] mr-[10px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                      >
                        {Object.values(PerformedType).map(
                          (performedType, j) => (
                            <option key={j} value={performedType}>
                              {performedType}
                            </option>
                          )
                        )}
                      </select>
                      <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                        at least
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={statement.value}
                        onChange={(e) =>
                          +e.target.value >= 0 &&
                          handleChangeStatement(i, {
                            ...statement,
                            value: +e.target.value || 0,
                          })
                        }
                        min="0"
                        placeholder="Mins"
                        className="w-full max-w-[80px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] mr-[6px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
                      />
                      <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                        time
                      </span>
                    </div>
                  </>
                ) : statement.isSubBuilderChild ? (
                  <FilterBuilder
                    settings={{
                      query: statement,
                    }}
                    isSubBuilderChild
                    onSettingsChange={(filter) => {
                      handleChangeStatement(i, filter.query);
                    }}
                    onSubBuilderUngroup={handleUngroup(i)}
                    isSegmentSettings={isSegmentSettings}
                  />
                ) : (
                  // TODO: add  QueryStatementType.JourneyAttributes after clarification
                  <></>
                )}
                {(showSegmentsErrors || showSegmentsSettingsErrors) &&
                  statementsErrors[i].map((error, k) => (
                    <div
                      key={k}
                      className="w-full font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]"
                    >
                      {queryStatementErrorToMessageMap[error.type]}
                    </div>
                  ))}
              </div>
              {/* @ts-ignore */}
              {!statement?.isSubBuilderChild && (
                <div
                  className="cursor-pointer ml-[10px]"
                  onClick={() => handleDeleteStatement(i)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.28739 2.14118H5.14453C5.2231 2.14118 5.28739 2.0769 5.28739 1.99833V2.14118H10.716V1.99833C10.716 2.0769 10.7802 2.14118 10.8588 2.14118H10.716V3.4269H12.0017V1.99833C12.0017 1.36797 11.4892 0.855469 10.8588 0.855469H5.14453C4.51417 0.855469 4.00167 1.36797 4.00167 1.99833V3.4269H5.28739V2.14118ZM14.2874 3.4269H1.71596C1.39989 3.4269 1.14453 3.68225 1.14453 3.99833V4.56975C1.14453 4.64833 1.20882 4.71261 1.28739 4.71261H2.36596L2.80703 14.0519C2.8356 14.6608 3.33917 15.1412 3.9481 15.1412H12.0552C12.666 15.1412 13.1677 14.6626 13.1963 14.0519L13.6374 4.71261H14.716C14.7945 4.71261 14.8588 4.64833 14.8588 4.56975V3.99833C14.8588 3.68225 14.6035 3.4269 14.2874 3.4269ZM11.9177 13.8555H4.0856L3.65346 4.71261H12.3499L11.9177 13.8555Z"
                      fill="#4B5563"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          {/* @ts-ignore */}
          {!settings?.query?.isSubBuilderChild &&
            (settings.query.type === QueryType.ALL ||
              i === settings.query.statements.length - 1) && (
              <div className="relative flex items-center py-[8.45px] max-w-[360px] px-[11.45px] rounded bg-[#F3F4F6]">
                <div
                  className="mr-[2px] min-w-[15px] min-h-[15px] border-[1px] border-[#6366F1] rounded-full"
                  // TODO: update to render on BE data
                  style={{
                    background: `
                  conic-gradient(
                    #6366F1 ${90}%,
                    white ${90}% 100%
                  )
                `,
                  }}
                />
                {/* TODO: update to render on BE data */}
                <span className="text-[#6366F1] font-roboto font-semibold text-[14px] leading-[22px]">
                  90%
                </span>
                <span className="ml-[6px] text-[#4B5563] font-roboto text-[14px] leading-[22px]">
                  of users estimated reached ≈{" "}
                  {Intl.NumberFormat("en", { notation: "compact" }).format(
                    21567
                  )}
                </span>
                <div className="absolute top-full left-[25px] z-[0] h-[10px] w-[1px] bg-[#E5E7EB]" />
              </div>
            )}
        </React.Fragment>
      ))}
      <div className="flex gap-[10px]">
        <Button
          type={ButtonType.SECONDARY}
          onClick={handleAddStatement}
          className="max-w-[120px]"
        >
          Add condition
        </Button>
        <Button
          type={ButtonType.LINK}
          onClick={handleAddGroup}
          className="max-w-[130px] text-[#6366F1]"
        >
          Add logic group
        </Button>
        {isSubBuilderChild && onSubBuilderUngroup && (
          <Button
            type={ButtonType.LINK}
            onClick={() => {
              onSubBuilderUngroup(settings.query.statements);
            }}
            className="max-w-[130px] text-[#6366F1]"
          >
            Ungroup
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBuilder;
