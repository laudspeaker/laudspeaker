import React, { FC, useEffect, useId, useState } from "react";
import { useDebounce } from "react-use";
import {
  addSegmentQueryError,
  AttributeQueryStatement,
  ComparisonType,
  ConditionalSegmentsSettings,
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

interface FilterBuilderProps {
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  isSegmentSettings?: boolean;
  onSettingsChange: (
    settings: ConditionalSegmentsSettings | SegmentsSettings
  ) => void;
}

enum QueryStatementError {
  NO_ATTRIBUTE_NAME,
  NO_SEGMENT_SELECTED,
  NO_EVENT_NAME_SELECTED,
  NO_MESSAGE_NAME_SELECTED,
  TIME_SHOULD_BE_SELECTED,
  TIME_RANGE_INCORRECT,
  NO_OBJECT_KEY,
}

const queryStatementErrorToMessageMap: Record<QueryStatementError, string> = {
  [QueryStatementError.NO_ATTRIBUTE_NAME]: "Attribute must be defined",
  [QueryStatementError.NO_SEGMENT_SELECTED]: "Segment must be selected",
  [QueryStatementError.NO_EVENT_NAME_SELECTED]: "Event name must be selected",
  [QueryStatementError.TIME_RANGE_INCORRECT]: "Time range is incorrect",
  [QueryStatementError.TIME_SHOULD_BE_SELECTED]:
    "All time variables should be filled",
  [QueryStatementError.NO_MESSAGE_NAME_SELECTED]:
    "Message name have to be selected",
  [QueryStatementError.NO_OBJECT_KEY]: "Object key should be defined",
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
}) => {
  const { showSegmentsErrors } = useAppSelector((state) => state.flowBuilder);
  const { showSegmentsErrors: showSegmentsSettingsErrors } = useAppSelector(
    (state) => state.segment
  );
  const id = useId();
  const dispatch = useDispatch();

  const { query } = settings;

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
        ...query,
        statements: [
          ...query.statements,
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

  const handleDeleteStatement = (i: number) => {
    const newStatements = [...query.statements];

    newStatements.splice(i, 1);

    onSettingsChange({
      ...settings,
      query: { ...query, statements: newStatements },
    });
  };

  const handleChangeStatement = (i: number, statement: QueryStatement) => {
    const newStatements = [...query.statements];

    newStatements[i] = statement;

    onSettingsChange({
      ...settings,
      query: { ...query, statements: newStatements },
    });
  };

  const statementsErrors: QueryStatementError[][] = [];

  for (const statement of query.statements) {
    const statementErrors = [];

    if (statement.type === QueryStatementType.ATTRIBUTE) {
      if (!statement.key)
        statementErrors.push(QueryStatementError.NO_ATTRIBUTE_NAME);

      if (
        statement.valueType === StatementValueType.OBJECT &&
        statement.comparisonType === ComparisonType.OBJECT_KEY
      ) {
        if (!statement.value)
          statementErrors.push(QueryStatementError.NO_OBJECT_KEY);
      }

      if (
        (statement.comparisonType === ComparisonType.BEFORE &&
          statement.value === undefined) ||
        (statement.comparisonType === ComparisonType.AFTER &&
          statement.value === undefined) ||
        (statement.comparisonType === ComparisonType.BETWEEN &&
          (statement.value === undefined ||
            statement.subComparisonValue === undefined ||
            isBefore(
              new Date(statement.subComparisonValue),
              new Date(statement.value)
            )))
      )
        statementErrors.push(QueryStatementError.TIME_RANGE_INCORRECT);
    }

    if (statement.type === QueryStatementType.SEGMENT && !statement.segmentId) {
      statementErrors.push(QueryStatementError.NO_SEGMENT_SELECTED);
    }

    if (statement.type === QueryStatementType.EVENT) {
      if (
        (statement.time?.comparisonType === ComparisonType.BEFORE &&
          statement.time.timeBefore === undefined) ||
        (statement.time?.comparisonType === ComparisonType.AFTER &&
          statement.time.timeAfter === undefined) ||
        (statement.time?.comparisonType === ComparisonType.BETWEEN &&
          (statement.time?.timeBefore === undefined ||
            statement.time?.timeAfter === undefined ||
            isBefore(
              new Date(statement.time.timeBefore),
              new Date(statement.time.timeAfter)
            )))
      )
        statementErrors.push(QueryStatementError.TIME_RANGE_INCORRECT);

      if (!statement.eventName)
        statementErrors.push(QueryStatementError.NO_EVENT_NAME_SELECTED);
    }

    if (statement.type === QueryStatementType.MessageEvent) {
      if (!statement.messageId)
        statementErrors.push(QueryStatementError.NO_MESSAGE_NAME_SELECTED);

      if (!statement.eventId)
        statementErrors.push(QueryStatementError.NO_EVENT_NAME_SELECTED);
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
      <div className="flex w-full gap-[10px] items-center">
        <div>
          <select
            value={query.type}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                query: { ...query, type: e.target.value as QueryType },
              })
            }
            className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
          >
            {Object.values(QueryType).map((comparisonType, j) => (
              <option key={j} value={comparisonType}>
                {comparisonType}
              </option>
            ))}
          </select>
        </div>
        <div className="font-normal text-[14px] leading-[22px]">
          of the following conditions match
        </div>
      </div>
      {query.statements.map((statement, i) => (
        <div className="flex max-w-[924px] w-full flex-nowrap items-center">
          {query.statements.length > 1 && (
            <div
              className={`min-w-[52px] text-center mr-[12px] py-[5px] px-[12px] bg-[#F3F4F6] border-[1px] border-[#E5E7EB] rounded-[4px] font-roboto font-normal text-[14px] leading-[22px] text-[#4B5563] ${
                i === 0 && "opacity-0"
              }`}
            >
              {query.type === QueryType.ALL ? "And" : "Or"}
            </div>
          )}
          <div
            key={i}
            className="bg-[#F3F4F6] p-[10px] rounded-[4px] flex justify-between items-center"
          >
            <div className="flex gap-[10px] items-center flex-wrap">
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
                        handleChangeStatement(i, { ...statement, key: value });
                        setKeysQuery(value);
                      }}
                      getKey={(value) => value}
                      placeholder="attribute name"
                    />
                  </div>
                  <div>
                    <select
                      value={statement.valueType}
                      onChange={(e) =>
                        handleChangeStatement(i, {
                          ...statement,
                          valueType: e.target.value as StatementValueType,
                          comparisonType:
                            valueTypeToComparisonTypesMap[
                              e.target.value as StatementValueType
                            ][0],
                        })
                      }
                      className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                    >
                      {Object.values(StatementValueType).map(
                        (comparisonType, j) => (
                          <option key={j} value={comparisonType}>
                            {comparisonType}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <select
                      value={
                        valueTypeToComparisonTypesMap[
                          statement.valueType
                        ].includes(statement.comparisonType)
                          ? statement.comparisonType
                          : valueTypeToComparisonTypesMap[
                              statement.valueType
                            ][0]
                      }
                      onChange={(e) =>
                        handleChangeStatement(i, {
                          ...statement,
                          comparisonType: e.target.value as ComparisonType,
                        })
                      }
                      className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] rounded-[2px]"
                    >
                      {valueTypeToComparisonTypesMap[statement.valueType].map(
                        (comparisonType, j) => (
                          <option key={j} value={comparisonType}>
                            {comparisonType}
                          </option>
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
                      statement.comparisonType !== ComparisonType.NOT_EXIST && (
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
                    statement.comparisonType === ComparisonType.BETWEEN && (
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
                      <select
                        value={statement.eventName}
                        onChange={(e) =>
                          handleChangeStatement(i, {
                            ...statement,

                            eventName: e.target.value,
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
                  {statement.time === undefined ? (
                    <div className="min-w-full flex items-center">
                      <Button
                        type={ButtonType.LINK}
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
                    </div>
                  ) : (
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
                          ComparisonType.BETWEEN,
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
                                ? { timeBefore: new Date(value).toISOString() }
                                : { timeAfter: new Date(value).toISOString() }),
                            },
                          });
                        }}
                      />
                      {statement.time?.comparisonType ===
                        ComparisonType.BETWEEN && (
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
                      {Object.values(PerformedType).map((performedType, j) => (
                        <option key={j} value={performedType}>
                          {performedType}
                        </option>
                      ))}
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
              ) : (
                // TODO: add  QueryStatementType.JourneyAttributes after clarification
                <></>
              )}
              {(showSegmentsErrors || showSegmentsSettingsErrors) &&
                statementsErrors[i].map((error) => (
                  <div className="w-full font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                    {queryStatementErrorToMessageMap[error]}
                  </div>
                ))}
            </div>
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
          </div>
        </div>
      ))}
      <Button
        type={ButtonType.SECONDARY}
        onClick={handleAddStatement}
        className="max-w-[120px]"
      >
        Add condition
      </Button>
    </div>
  );
};

export default FilterBuilder;
