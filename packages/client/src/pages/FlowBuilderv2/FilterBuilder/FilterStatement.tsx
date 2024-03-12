import Select from "components/Elements/Selectv2";
import React from "react";
import {
  AttributeQueryStatement,
  ComparisonType,
  ConditionalSegmentsSettings,
  DateComparisonType,
  EventQueryStatement,
  MessageEmailEventCondition,
  MessageEventQuery,
  MessageFromJourney,
  MessageGeneralComparison,
  MessageInAPPEventCondition,
  MessagePushEventCondition,
  MessageSMSEventCondition,
  ObjectKeyComparisonType,
  PerformedType,
  Query,
  QueryStatement,
  QueryStatementType,
  QueryType,
  SegmentQueryStatement,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import { SegmentsSettings } from "reducers/segment.reducer";
import { Segment } from "types/Segment";
import { Workflow } from "types/Workflow";
import { AttributeStatement } from "./AttributeStatement";
import { EventStatement } from "./EventStatement";
import {
  QueryStatementError,
  queryStatementErrorToMessageMap,
} from "./FilterAdditionalProperty";
import FilterBuilder from "./FilterBuilder";
import { FilterSummary } from "./FilterSummary";
import { MessageStatement } from "./MessageStatement";

interface StatementProps {
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  index: number;
  statement: QueryStatement;
  possibleKeys: {
    key: string;
    type: StatementValueType;
  }[];
  setKeysQuery: (value: React.SetStateAction<string>) => void;
  segments: Segment[];
  showErrors: boolean | undefined;
  statementsErrors: QueryStatementError[][];
  journeySearchQuery: string;
  isJourneySearchLoading: boolean;
  setJourneySearchQuery: React.Dispatch<React.SetStateAction<string>>;
  journeySearchQueryPage: number;
  journeySearchTotalPages: number;
  setJourneySearchQueryPage: (value: React.SetStateAction<number>) => void;
  availableTags: string[];

  queryErrorsActions:
    | {
        add: (str: string) => void;
        remove: (str: string) => void;
      }
    | undefined;
  isSegmentSettings: boolean | undefined;
  isMultisplitBuilder: boolean | undefined;
  sizeLoading: Record<string, boolean>;
  sizeData: Record<
    string,
    {
      size: number;
      total: number;
    }
  >;
  onSettingsChange: (
    settings: ConditionalSegmentsSettings | SegmentsSettings
  ) => void;
  availableJourneys: Workflow[];
  isSubBuilderChild: boolean | undefined;
  setChangesHappenIndex: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

const corelationTypeToDefaultSettings: {
  [QueryStatementType.ATTRIBUTE]: AttributeQueryStatement;
  [QueryStatementType.SEGMENT]: SegmentQueryStatement;
  [QueryStatementType.EVENT]: EventQueryStatement;
  [QueryStatementType.EMAIL]: MessageEventQuery;
  [QueryStatementType.SMS]: MessageEventQuery;
  [QueryStatementType.PUSH]: MessageEventQuery;
  [QueryStatementType.IN_APP]: MessageEventQuery;
} = {
  [QueryStatementType.ATTRIBUTE]: {
    type: QueryStatementType.ATTRIBUTE,
    key: "",
    comparisonType: ComparisonType.EQUALS,
    subComparisonType: ObjectKeyComparisonType.KEY_EXIST,
    subComparisonValue: "",
    valueType: StatementValueType.STRING,
    value: "",
    dateComparisonType: DateComparisonType.ABSOLUTE,
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
  [QueryStatementType.EMAIL]: {
    type: QueryStatementType.EMAIL,
    eventCondition: MessageEmailEventCondition.RECEIVED,
    from: {
      key: MessageFromJourney.ANY,
      title: "Any journeys",
    },
    fromSpecificMessage: {
      key: "ANY",
      title: "Any step",
    },
    happenCondition: MessageGeneralComparison.HAS,
    tag: undefined,
    time: undefined,
  },
  [QueryStatementType.SMS]: {
    type: QueryStatementType.SMS,
    eventCondition: MessageSMSEventCondition.RECEIVED,
    from: {
      key: MessageFromJourney.ANY,
      title: "Any journeys",
    },
    fromSpecificMessage: {
      key: "ANY",
      title: "Any step",
    },
    happenCondition: MessageGeneralComparison.HAS,
    tag: undefined,
    time: undefined,
  },
  [QueryStatementType.PUSH]: {
    type: QueryStatementType.PUSH,
    eventCondition: MessagePushEventCondition.RECEIVED,
    from: {
      key: MessageFromJourney.ANY,
      title: "Any journeys",
    },
    fromSpecificMessage: {
      key: "ANY",
      title: "Any step",
    },
    happenCondition: MessageGeneralComparison.HAS,
    tag: undefined,
    time: undefined,
  },
  [QueryStatementType.IN_APP]: {
    type: QueryStatementType.IN_APP,
    eventCondition: MessageInAPPEventCondition.RECEIVED,
    from: {
      key: MessageFromJourney.ANY,
      title: "Any journeys",
    },
    fromSpecificMessage: {
      key: "ANY",
      title: "Any step",
    },
    happenCondition: MessageGeneralComparison.HAS,
    tag: undefined,
    time: undefined,
  },
};

export const Statement = ({
  settings,
  index,
  statement,
  possibleKeys,
  setKeysQuery,
  segments,
  showErrors,
  statementsErrors,
  journeySearchQuery,
  isJourneySearchLoading,
  setJourneySearchQuery,
  journeySearchQueryPage,
  journeySearchTotalPages,
  setJourneySearchQueryPage,
  availableTags,
  queryErrorsActions,
  isSegmentSettings,
  isMultisplitBuilder,
  sizeLoading,
  sizeData,
  onSettingsChange,
  availableJourneys,
  isSubBuilderChild,
  setChangesHappenIndex,
}: StatementProps) => {
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

  const handleDeleteStatement = (i: number) => {
    const newStatements = [...settings.query.statements];

    newStatements.splice(i, 1);

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  const handleUpdateSetEvents = (i: number) => {
    if (!isSubBuilderChild) {
      if (settings.query.type === QueryType.ANY)
        setChangesHappenIndex((prev) => {
          prev[0] = true;
          return { ...prev };
        });
      else {
        setChangesHappenIndex((prev) => {
          prev[i] = true;
          return { ...prev };
        });
      }
    }
  };

  const handleChangeStatement = (i: number, _statement: QueryStatement) => {
    const newStatements = [...settings.query.statements];

    newStatements[i] = _statement;

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
    handleUpdateSetEvents(i);
  };

  return (
    <React.Fragment key={index}>
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
          key={index}
          className={`${
            /* @ts-ignore */
            !statement?.isSubBuilderChild && "bg-[#F3F4F6] p-[10px]"
          } rounded flex justify-between items-center`}
        >
          <div className="flex gap-[10px] relative items-center flex-wrap">
            {/* @ts-ignore */}
            {!statement?.isSubBuilderChild && (
              <div>
                <Select
                  value={statement.type}
                  onChange={(el) => {
                    handleChangeStatement(
                      index,
                      // @ts-ignore
                      corelationTypeToDefaultSettings?.[el] || statement
                    );
                  }}
                  className="min-w-[80px]"
                  options={[
                    {
                      key: "UserDataLabel",
                      title: "User Data",
                      groupLabel: true,
                    },
                    {
                      key: QueryStatementType.ATTRIBUTE,
                      title: QueryStatementType.ATTRIBUTE,
                    },
                    {
                      key: QueryStatementType.EVENT,
                      title: QueryStatementType.EVENT,
                    },
                    {
                      key: "MessageLabel",
                      title: "Message",
                      groupLabel: true,
                    },
                    {
                      key: QueryStatementType.EMAIL,
                      title: QueryStatementType.EMAIL,
                    },
                    {
                      key: QueryStatementType.PUSH,
                      title: QueryStatementType.PUSH,
                    },
                    {
                      key: QueryStatementType.SMS,
                      title: QueryStatementType.SMS,
                    },
                    {
                      key: QueryStatementType.IN_APP,
                      title: QueryStatementType.IN_APP,
                    },
                    {
                      key: "OthersLabel",
                      title: "Others",
                      groupLabel: true,
                    },
                    {
                      key: QueryStatementType.SEGMENT,
                      title: QueryStatementType.SEGMENT,
                    },
                  ]}
                />
              </div>
            )}
            {statement.type === QueryStatementType.ATTRIBUTE ? (
              <AttributeStatement
                {...{
                  statement,
                  possibleKeys,
                  handleChangeStatement,
                  setKeysQuery,
                  index,
                }}
              />
            ) : statement.type === QueryStatementType.SEGMENT ? (
              <div>
                <select
                  value={statement.segmentId}
                  onChange={(e) =>
                    handleChangeStatement(index, {
                      ...statement,
                      segmentId: e.target.value,
                    })
                  }
                  className={`w-[140px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm ${
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
              <EventStatement
                {...{
                  statement,
                  index,
                  handleChangeStatement,
                  possibleKeys,
                  setKeysQuery,
                  showErrors,
                  statementsErrors,
                  settings,
                  onSettingsChange,
                }}
              />
            ) : [
                QueryStatementType.EMAIL,
                QueryStatementType.SMS,
                QueryStatementType.PUSH,
                QueryStatementType.IN_APP,
              ].includes(statement.type as QueryStatementType) ? (
              <MessageStatement
                {...{
                  statement,
                  journeySearchQuery,
                  isJourneySearchLoading,
                  setJourneySearchQuery,
                  journeySearchQueryPage,
                  journeySearchTotalPages,
                  setJourneySearchQueryPage,
                  handleChangeStatement,
                  index,
                  availableTags,
                  availableJourneys,
                }}
              />
            ) : (statement as Query)?.isSubBuilderChild ? (
              <FilterBuilder
                settings={{
                  query: statement as Query,
                }}
                isSubBuilderChild
                onSettingsChange={(filter) => {
                  handleChangeStatement(index, filter.query);
                }}
                shouldShowErrors={showErrors}
                queryErrorsActions={queryErrorsActions}
                onSubBuilderUngroup={handleUngroup(index)}
                isSegmentSettings={isSegmentSettings}
              />
            ) : (
              <></>
            )}
            {showErrors &&
              statementsErrors[index].map((error, k) => (
                <div
                  key={k}
                  className="w-full font-inter font-normal text-[12px] leading-5 text-[#E11D48]"
                >
                  {queryStatementErrorToMessageMap[error.type]}
                </div>
              ))}
          </div>
          {/* @ts-ignore */}
          {!statement?.isSubBuilderChild && (
            <div
              className="cursor-pointer ml-[10px]"
              onClick={() => handleDeleteStatement(index)}
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
        !isMultisplitBuilder &&
        (settings.query.type === QueryType.ALL ||
          index === settings.query.statements.length - 1) && (
          <FilterSummary
            settings={settings}
            sizeLoading={sizeLoading}
            sizeData={sizeData}
            i={index}
          />
        )}
    </React.Fragment>
  );
};
