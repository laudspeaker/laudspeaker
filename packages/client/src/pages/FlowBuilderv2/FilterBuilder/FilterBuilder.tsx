import React, { FC, useEffect, useId, useRef, useState } from "react";
import { useDebounce } from "react-use";
import {
  addSegmentQueryError,
  AttributeQueryStatement,
  ComparisonType,
  ConditionalSegmentsSettings,
  DateComparisonType,
  EventQueryAdditionalProperty,
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
import FilterBuilderDynamicInput from "../Elements/DynamicInput";
import { isBefore } from "date-fns";
import { useDispatch } from "react-redux";
import { SegmentsSettings } from "reducers/segment.reducer";
import { capitalize } from "lodash";
import Select from "components/Elements/Selectv2";
import { Workflow } from "types/Workflow";
import axios, { CancelTokenSource } from "axios";
import deepCopy from "utils/deepCopy";
import AutoComplete from "../../../components/AutoCompletev2/AutoCompletev2";

interface FilterBuilderProps {
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  isSegmentSettings?: boolean;
  isMultisplitBuilder?: boolean;
  isSubBuilderChild?: boolean;
  shouldShowErrors?: boolean;
  queryErrorsActions?: {
    add: (str: string) => void;
    remove: (str: string) => void;
  };
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
  JOURNEY_TAG_SHOULD_BE_SELECTED,
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
  [QueryStatementErrors.JOURNEY_TAG_SHOULD_BE_SELECTED]:
    "Journey tag should be selected",
};

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

const messageEventsCorelation: Record<
  | QueryStatementType.EMAIL
  | QueryStatementType.SMS
  | QueryStatementType.PUSH
  | QueryStatementType.IN_APP,
  {
    key:
      | MessageEmailEventCondition
      | MessageSMSEventCondition
      | MessagePushEventCondition
      | MessageInAPPEventCondition;
    title: string;
  }[]
> = {
  [QueryStatementType.EMAIL]: Object.values(MessageEmailEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
  [QueryStatementType.SMS]: [
    {
      key: MessageSMSEventCondition.RECEIVED,
      title: "been " + MessageSMSEventCondition.RECEIVED,
    },
    {
      key: MessageSMSEventCondition.CLICK_LINK,
      title: "been clicked sms link",
    },
  ],
  [QueryStatementType.PUSH]: Object.values(MessagePushEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
  [QueryStatementType.IN_APP]: Object.values(MessageInAPPEventCondition).map(
    (el) => ({
      key: el,
      title: "been " + el,
    })
  ),
};

const FilterBuilder: FC<FilterBuilderProps> = ({
  settings,
  isSegmentSettings,
  onSettingsChange,
  onSubBuilderUngroup,
  shouldShowErrors,
  isSubBuilderChild,
  isMultisplitBuilder,
  queryErrorsActions,
}) => {
  const { showSegmentsErrors, availableTags: availableTagsFlow } =
    useAppSelector((state) => state.flowBuilder);
  const {
    showSegmentsErrors: showSegmentsSettingsErrors,
    availableTags: availableTagsSegment,
  } = useAppSelector((state) => state.segment);

  const showErrors =
    showSegmentsErrors || showSegmentsSettingsErrors || shouldShowErrors;

  const availableTags = isSegmentSettings
    ? availableTagsSegment
    : availableTagsFlow;

  const id = useId();
  const dispatch = useDispatch();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [keysQuery, setKeysQuery] = useState("");

  const [journeySearchQuery, setJourneySearchQuery] = useState("");
  const [journeySearchQueryPage, setJourneySearchQueryPage] = useState(1);
  const [journeySearchTotalPages, setJourneySearchTotalPages] = useState(1);
  const [availableJourneys, setAvailableJourneys] = useState<Workflow[]>([]);
  const [isJourneySearchLoading, setIsJourneySearchLoading] = useState(false);

  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const [specMessageQuery, setSpecMessageQuery] = useState("");
  const [isSpecMessageQueryLoading, setIsSpecMessageQueryLoading] =
    useState(false);
  const [possibleMessages, setPossibleMessages] = useState<
    Record<string, { key: string; title: string }[]>
  >({});
  const [sizeCountCancelToken, setSizeCountCancelToken] = useState<
    Record<string, CancelTokenSource>
  >({});
  const [changesHappenIndex, setChangesHappenIndex] = useState<
    Record<string, boolean>
  >({});
  const [sizeLoading, setSizeLoading] = useState<Record<string, boolean>>({});
  const [sizeData, setSizeData] = useState<
    Record<string, { size: number; total: number }>
  >({});
  const [withDebounce, setWithDebounce] = useState(false);

  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
      isArray?: boolean;
    }[]
  >([]);

  const loadSegments = async () => {
    const {
      data: { data },
    } = await ApiService.get<{ data: Segment[] }>({ url: "/segments" });

    setSegments(data);
  };

  const loadAllMessages = async (channel: string, specJourneyId: string) => {
    setIsSpecMessageQueryLoading(true);
    try {
      const { data } = await ApiService.get<
        {
          id: string;
          metadata: {
            channel: string;
            customName: string;
            destination: string;
            template: number;
          };
        }[]
      >({
        url: `/journeys/messages/${specJourneyId}/${channel}`,
      });
      setPossibleMessages((prev) => {
        prev[`${channel};;${specJourneyId}`] = data.map((el) => ({
          key: el.id,
          title: el.metadata.customName,
        }));

        return prev;
      });
    } catch (error) {
    } finally {
      setIsSpecMessageQueryLoading(false);
    }
  };

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

  const loadPossibleJourneys = async () => {
    setIsJourneySearchLoading(true);
    try {
      const { data } = await ApiService.get<{
        data: Workflow[];
        totalPages: number;
      }>({
        url: `/journeys?take=12&skip=${
          (journeySearchQueryPage - 1) * 12
        }&search=${journeySearchQuery}&orderBy=latestSave&orderType=desc&filterStatuses=Active,Paused,Draft`,
      });

      setAvailableJourneys(
        journeySearchQueryPage === 1
          ? data.data
          : [...availableJourneys, ...data.data]
      );
      setJourneySearchTotalPages(data.totalPages);
    } catch (error) {
    } finally {
      setIsJourneySearchLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
    loadPossibleJourneys();
  }, []);

  useDebounce(
    () => {
      setJourneySearchQueryPage(1);
      loadPossibleJourneys();
    },
    100,
    [journeySearchQuery]
  );

  const getRecountAsync = async () => {
    if (isSubBuilderChild || !settings?.query?.type) return;

    if (settings.query.type === QueryType.ANY && changesHappenIndex[0]) {
      setSizeLoading((prev) => {
        prev[0] = true;
        return { ...prev };
      });
      if (sizeCountCancelToken[0]) {
        sizeCountCancelToken[0].cancel();
        setSizeCountCancelToken((prev) => {
          delete prev[0];
          return { ...prev };
        });
      }
      sizeCountCancelToken[0] = axios.CancelToken.source();
      try {
        const { data } = await ApiService.post({
          url: "/segments/size",
          options: {
            inclusionCriteria: {
              query: settings.query,
            },
          },
        });
        setChangesHappenIndex((prev) => {
          prev[0] = false;
          return { ...prev };
        });
        setSizeData((prev) => ({
          0: data,
        }));
      } catch (error) {}
      setSizeLoading((prev) => {
        prev[0] = false;
        return { ...prev };
      });
      setWithDebounce(true);
    } else if (settings.query.type === QueryType.ALL) {
      const index = Object.keys(changesHappenIndex).find(
        (el) => changesHappenIndex[el]
      );
      if (index === undefined) {
        setWithDebounce(true);
        return;
      }

      setChangesHappenIndex((prev) => {
        delete prev[index];
        return { ...prev };
      });

      setSizeLoading((prev) => {
        prev[index] = true;
        return { ...prev };
      });
      if (sizeCountCancelToken[index]) {
        sizeCountCancelToken[index].cancel();
        setSizeCountCancelToken((prev) => {
          delete prev[index];
          return { ...prev };
        });
      }
      sizeCountCancelToken[index] = axios.CancelToken.source();

      const newQuery = deepCopy(settings.query);
      newQuery.statements = newQuery.statements.slice(0, Number(index) + 1);
      //newQuery.statements = [newQuery.statements[Number(index)]];
      try {
        const { data } = await ApiService.post({
          url: "/segments/size",
          options: {
            inclusionCriteria: {
              query: newQuery,
            },
          },
        });
        setSizeData((prev) => {
          prev[index] = data;
          return prev;
        });
      } catch (error) {}
      setSizeLoading((prev) => {
        prev[index] = false;
        return { ...prev };
      });
    }
  };

  useDebounce(
    () => {
      if (isMultisplitBuilder) return;

      getRecountAsync();
    },
    withDebounce ? 2000 : 0,
    [changesHappenIndex]
  );

  useEffect(() => {
    if (isSubBuilderChild) return;
    setWithDebounce(false);
    setSizeLoading({});
    setSizeData({});
    setSizeCountCancelToken({});

    if (settings.query.type === QueryType.ANY)
      setChangesHappenIndex({ 0: true });
    else {
      const indexsToCheck: Record<string, boolean> = {};
      settings.query.statements.forEach((el, i) => {
        indexsToCheck[i] = true;
      });
      setChangesHappenIndex(indexsToCheck);
    }
  }, [settings.query.type]);

  useEffect(() => {
    loadPossibleJourneys();
  }, [journeySearchQueryPage]);

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
            dateComparisonType: DateComparisonType.ABSOLUTE,
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

  const handleChangeStatement = (i: number, statement: QueryStatement) => {
    const newStatements = [...settings.query.statements];

    newStatements[i] = statement;

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
    handleUpdateSetEvents(i);
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

    if (
      [
        QueryStatementType.EMAIL,
        QueryStatementType.SMS,
        QueryStatementType.PUSH,
        QueryStatementType.IN_APP,
      ].includes(statement.type as QueryStatementType)
    ) {
      const specStatement = { ...(statement as MessageEventQuery) };

      if (specStatement.from.key === "WITH_TAG" && !specStatement.tag) {
        statementErrors.push({
          type: QueryStatementErrors.JOURNEY_TAG_SHOULD_BE_SELECTED,
          eventPropertyErrors: [],
        });
      }

      if (
        (specStatement.time?.comparisonType === ComparisonType.BEFORE &&
          !specStatement.time.timeBefore) ||
        (specStatement.time?.comparisonType === ComparisonType.AFTER &&
          !specStatement.time.timeAfter) ||
        (specStatement.time?.comparisonType === ComparisonType.DURING &&
          (!specStatement.time?.timeBefore ||
            !specStatement.time?.timeAfter ||
            isBefore(
              new Date(specStatement.time.timeBefore),
              new Date(specStatement.time.timeAfter)
            )))
      )
        statementErrors.push({
          type: QueryStatementErrors.TIME_RANGE_INCORRECT,
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

    if (queryErrorsActions) {
      if (isError) queryErrorsActions.add(id);
      else queryErrorsActions.remove(id);
    } else {
      dispatch(
        (isError
          ? isSegmentSettings
            ? addSegmentSettingQueryError
            : addSegmentQueryError
          : isSegmentSettings
          ? removeSegmentSettingQueryError
          : removeSegmentQueryError)(id)
      );
    }
  }, [statementsErrors]);

  const searchableJournys = [
    ...(!journeySearchQuery
      ? [
          {
            key: MessageFromJourney.ANY,
            title: "Any journeys",
          },
          {
            key: MessageFromJourney.WITH_TAG,
            title: "Journeys with a tag",
          },
        ]
      : []),
    ...(!availableJourneys?.length && journeySearchQuery
      ? []
      : [
          {
            key: "JourneysLabel",
            title: "Journeys",
            groupLabel: true,
          },
        ]),
    ...(!availableJourneys?.length && !journeySearchQuery
      ? [
          {
            key: "NoCreatedLabel",
            title: "No journey created",
            nonSelectable: true,
          },
        ]
      : availableJourneys?.map((el) => ({
          key: el.id,
          title: el.name,
        })) || []),
  ];

  const searchableMessageInJourney = (channel: string, specId: string) => [
    {
      key: "ANY",
      title: `Any ${channel} in this journey`,
    },
    ...(possibleMessages[`${channel};;${specId}`] || []),
  ];

  const retriveEventNames = async (query: string) => {
    const { data } = await ApiService.get<string[]>({
      url: `/events/possible-names?search=${query}`,
    });

    return data;
  };

  return (
    <div className="flex w-full flex-col gap-[10px] pr-[10px]">
      <div className="flex relative w-full gap-[10px] items-center">
        <div>
          <select
            data-testid="filter-builder-condition-select"
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
            className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
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
                          i,
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
                          const attribute = possibleKeys.find(
                            (attr) => attr.key === q
                          );

                          const valueType = attribute?.isArray
                            ? StatementValueType.ARRAY
                            : attribute?.type || undefined;

                          handleChangeStatement(i, {
                            ...statement,
                            key: q,
                            valueType,
                            comparisonType: valueType
                              ? valueTypeToComparisonTypesMap[valueType][0]
                              : ComparisonType.EQUALS,
                          });
                          setKeysQuery(q);
                        }}
                        onSelect={(value) => {
                          const attribute = possibleKeys.find(
                            (attr) => attr.key === value
                          );

                          const valueType = attribute?.isArray
                            ? StatementValueType.ARRAY
                            : attribute?.type || undefined;

                          handleChangeStatement(i, {
                            ...statement,
                            key: value,
                            valueType,
                            comparisonType: valueType
                              ? valueTypeToComparisonTypesMap[valueType][0]
                              : ComparisonType.EQUALS,
                          });
                          setKeysQuery(value);
                        }}
                        getKey={(value) => value}
                        placeholder="Attribute name"
                        inputDataTestId={`attribute-name-input-${i}`}
                      />
                    </div>
                    <div>
                      <select
                        value={`${statement.valueType};;${statement.comparisonType}`}
                        className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                        id="comparison-type-select"
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
                        data-testid={`attribute-statement-select-${i}`}
                      >
                        {Object.values(StatementValueType)
                          .filter((valueType) =>
                            statement.valueType
                              ? statement.valueType === valueType
                              : true
                          )
                          .map((comparisonType, j) => (
                            <optgroup key={j} label={comparisonType}>
                              {valueTypeToComparisonTypesMap[
                                comparisonType
                              ].map((comparisonValueType, k) => (
                                <option
                                  key={k}
                                  value={`${comparisonType};;${comparisonValueType}`}
                                  id={`comparison-type-${comparisonType}-${comparisonValueType}`}
                                >
                                  {comparisonValueType}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                      </select>
                    </div>

                    {[
                      ComparisonType.AFTER,
                      ComparisonType.BEFORE,
                      ComparisonType.DURING,
                    ].includes(statement.comparisonType) && (
                      <>
                        <Select
                          buttonClassName="!w-fit"
                          className="!w-fit"
                          value={statement.dateComparisonType}
                          id="date-comparison-type-select"
                          onChange={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              dateComparisonType: value,
                              value:
                                value === DateComparisonType.ABSOLUTE
                                  ? ""
                                  : "1 days ago",
                            })
                          }
                          options={[
                            {
                              key: DateComparisonType.ABSOLUTE,
                              title: "absolute date",
                            },
                            {
                              key: DateComparisonType.RELATIVE,
                              title: "relative date",
                            },
                          ]}
                          dataTestId={`attribute-name-${i}-date-select`}
                        />
                      </>
                    )}

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
                          dataTestId={`attribute-statement-${i}`}
                        />
                      ) : (
                        statement.comparisonType !== ComparisonType.EXIST &&
                        statement.comparisonType !==
                          ComparisonType.NOT_EXIST && (
                          <FilterBuilderDynamicInput
                            type={
                              statement.valueType || StatementValueType.STRING
                            }
                            value={statement.value}
                            isRelativeDate={
                              statement.dateComparisonType ===
                              DateComparisonType.RELATIVE
                            }
                            onChange={(value) =>
                              handleChangeStatement(i, {
                                ...statement,
                                value,
                              })
                            }
                            dataTestId={`attribute-statement-${i}`}
                          />
                        )
                      )}
                    </div>

                    {(statement.valueType === StatementValueType.DATE ||
                      statement.valueType === StatementValueType.DATE_TIME) &&
                      statement.comparisonType === ComparisonType.DURING && (
                        <>
                          -
                          <div>
                            <FilterBuilderDynamicInput
                              type={StatementValueType.DATE}
                              isRelativeDate={
                                statement.dateComparisonType ===
                                DateComparisonType.RELATIVE
                              }
                              value={statement.subComparisonValue || ""}
                              onChange={(value) => {
                                handleChangeStatement(i, {
                                  ...statement,
                                  subComparisonValue: value,
                                });
                              }}
                              dataTestId={`attribute-statement-${i}`}
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
                          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                          data-testid={`attribute-name-object-select-${i}`}
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
                            dataTestId={`attribute-statement-${i}`}
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
                  <>
                    <div className="flex gap-[10px]">
                      <div>
                        <AutoComplete
                          value={statement.eventName}
                          onQueryChange={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              eventName: value,
                            })
                          }
                          inputDataTestId={`attribute-statement-${i}`}
                          onSelect={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              eventName: value,
                            })
                          }
                          retrieveLabel={(item) => item}
                          includedItems={{
                            type: "setter",
                            getItems: retriveEventNames,
                          }}
                          placeholder="Name"
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
                          className="w-[166px] px-[12px] py-[5px] mr-[10px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                        >
                          {Object.values(PerformedType).map(
                            (performedType, j) => (
                              <option key={j} value={performedType}>
                                {performedType}
                              </option>
                            )
                          )}
                        </select>
                        {statement.comparisonType === "has performed" && (
                          <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                            at least
                          </span>
                        )}
                      </div>
                      {statement.comparisonType === "has performed" && (
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
                            className="w-full max-w-[80px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] mr-[6px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
                          />
                          <span className="font-inter text-[14px] leading-[22px] text-[#18181B]">
                            time
                          </span>
                        </div>
                      )}
                    </div>

                    {statement.time && (
                      <div className="min-w-full flex items-center px-5 py-[14px] border border-[#E5E7EB] bg-white gap-[10px]">
                        <Select
                          value={statement.time.comparisonType}
                          options={[
                            ComparisonType.BEFORE,
                            ComparisonType.AFTER,
                            ComparisonType.DURING,
                          ].map((comparisonType) => ({
                            key: comparisonType,
                            title: comparisonType,
                          }))}
                          onChange={(e) =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                comparisonType: e as any,
                                dateComparisonType: DateComparisonType.ABSOLUTE,
                              },
                            })
                          }
                          className="max-w-[145px]"
                        />

                        <Select
                          buttonClassName="!w-fit"
                          className="!w-fit"
                          value={statement.time.dateComparisonType}
                          onChange={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                ...statement.time,
                                comparisonType:
                                  statement.time?.comparisonType ||
                                  ComparisonType.AFTER,
                                dateComparisonType: value,
                                timeBefore:
                                  value === DateComparisonType.ABSOLUTE
                                    ? ""
                                    : "1 days ago",
                                timeAfter:
                                  value === DateComparisonType.ABSOLUTE
                                    ? ""
                                    : "1 days ago",
                              },
                            })
                          }
                          options={[
                            {
                              key: DateComparisonType.ABSOLUTE,
                              title: "absolute date",
                            },
                            {
                              key: DateComparisonType.RELATIVE,
                              title: "relative date",
                            },
                          ]}
                        />

                        <FilterBuilderDynamicInput
                          type={StatementValueType.DATE}
                          value={
                            (statement.time?.comparisonType ===
                            ComparisonType.BEFORE
                              ? statement.time.timeBefore
                              : statement.time.timeAfter) || ""
                          }
                          isRelativeDate={
                            statement.time.dateComparisonType ===
                            DateComparisonType.RELATIVE
                          }
                          onChange={(value) => {
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                ...statement.time!,
                                ...(statement.time?.comparisonType ===
                                ComparisonType.BEFORE
                                  ? {
                                      timeBefore:
                                        statement.time.dateComparisonType ===
                                        DateComparisonType.ABSOLUTE
                                          ? new Date(value).toISOString()
                                          : value,
                                    }
                                  : {
                                      timeAfter:
                                        statement.time?.dateComparisonType ===
                                        DateComparisonType.ABSOLUTE
                                          ? new Date(value).toISOString()
                                          : value,
                                    }),
                              },
                            });
                          }}
                          dataTestId={`attribute-statement-${i}`}
                        />
                        {statement.time?.comparisonType ===
                          ComparisonType.DURING && (
                          <>
                            -
                            <FilterBuilderDynamicInput
                              type={StatementValueType.DATE}
                              value={statement.time.timeBefore || ""}
                              isRelativeDate={
                                statement.time.dateComparisonType ===
                                DateComparisonType.RELATIVE
                              }
                              onChange={(value) => {
                                handleChangeStatement(i, {
                                  ...statement,
                                  time: {
                                    ...statement.time!,
                                    timeBefore:
                                      statement.time!.dateComparisonType ===
                                      DateComparisonType.ABSOLUTE
                                        ? new Date(value).toISOString()
                                        : value,
                                  },
                                });
                              }}
                              dataTestId={`attribute-statement-${i}`}
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
                                className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
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
                                            className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
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
                                              dataTestId={`attribute-statement-${i}`}
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
                                                dataTestId={`attribute-statement-${i}`}
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
                                                  dataTestId={`attribute-statement-${i}`}
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
                                              className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
                                              id="selectComparisonType"
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
                                                dataTestId={`attribute-statement-${i}`}
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
                                  {showErrors &&
                                    statementsErrors[i].map((error, errorI) => (
                                      <React.Fragment key={errorI}>
                                        {error?.eventPropertyErrors[
                                          propertyI
                                        ]?.map((propError, propErrorI) => (
                                          <div
                                            key={propErrorI}
                                            className="ml-[60px] w-full font-inter font-normal text-[12px] leading-5 text-[#E11D48]"
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
                    <div className="min-w-full flex flex-nowrap items-center gap-[10px]">
                      <Button
                        type={ButtonType.LINK}
                        className="text-[#6366F1] whitespace-nowrap"
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
                                dateComparisonType: DateComparisonType.ABSOLUTE,
                              },
                            })
                          }
                        >
                          Set time
                        </Button>
                      )}
                    </div>
                  </>
                ) : [
                    QueryStatementType.EMAIL,
                    QueryStatementType.SMS,
                    QueryStatementType.PUSH,
                    QueryStatementType.IN_APP,
                  ].includes(statement.type as QueryStatementType) ? (
                  <>
                    <span className="font-inter text-[14px] leading-[22px] text-[#111827]">
                      from
                    </span>
                    <Select
                      value={(statement as MessageEventQuery).from.key}
                      searchPlaceholder="search journey"
                      placeholder={(statement as MessageEventQuery).from.title}
                      searchValue={journeySearchQuery}
                      isLoading={isJourneySearchLoading}
                      onSearchValueChange={setJourneySearchQuery}
                      onScrollToEnd={() => {
                        if (
                          isJourneySearchLoading ||
                          journeySearchQueryPage >= journeySearchTotalPages
                        )
                          return;

                        setJourneySearchQueryPage((prev) => prev + 1);
                      }}
                      onChange={(el, selectedOptionI) => {
                        if (selectedOptionI === undefined) return;

                        if (
                          el !== MessageFromJourney.ANY &&
                          el !== MessageFromJourney.WITH_TAG
                        ) {
                          loadAllMessages(
                            (statement as MessageEventQuery).type.toLowerCase(),
                            el
                          );
                        }

                        handleChangeStatement(i, {
                          ...statement,
                          from: {
                            key: el,
                            title: searchableJournys[selectedOptionI].title,
                          },
                          fromSpecificMessage: {
                            key: "ANY",
                            title: "Any message",
                          },
                        } as MessageEventQuery);
                      }}
                      noDataPlaceholder={"No results"}
                      className="min-w-[200px] max-w-[200px]"
                      options={searchableJournys}
                    />
                    {(statement as MessageEventQuery).from.key ===
                      MessageFromJourney.WITH_TAG && (
                      <Select
                        value={(statement as MessageEventQuery).tag}
                        placeholder={
                          (statement as MessageEventQuery).tag || "select a tag"
                        }
                        searchPlaceholder={"filter tag"}
                        searchValue={tagSearchQuery}
                        onSearchValueChange={setTagSearchQuery}
                        onChange={(el) => {
                          handleChangeStatement(i, {
                            ...statement,
                            tag: el,
                          } as MessageEventQuery);
                        }}
                        noDataPlaceholder={"No results"}
                        className="min-w-[200px] max-w-[200px]"
                        options={availableTags
                          .filter((el) =>
                            el
                              .toLowerCase()
                              .includes(tagSearchQuery.toLowerCase())
                          )
                          .map((el) => ({
                            key: el,
                            title: el,
                          }))}
                      />
                    )}
                    {(statement as MessageEventQuery).from.key !==
                      MessageFromJourney.WITH_TAG &&
                      (statement as MessageEventQuery).from.key !==
                        MessageFromJourney.ANY && (
                        <Select
                          value={
                            (statement as MessageEventQuery).fromSpecificMessage
                              .key
                          }
                          placeholder={
                            (statement as MessageEventQuery).fromSpecificMessage
                              .title
                          }
                          searchValue={specMessageQuery}
                          isLoading={isSpecMessageQueryLoading}
                          onSearchValueChange={setSpecMessageQuery}
                          onChange={(el, selectedOptionI) => {
                            if (selectedOptionI === undefined) return;

                            handleChangeStatement(i, {
                              ...statement,
                              fromSpecificMessage: {
                                key: el,
                                title: searchableMessageInJourney(
                                  statement.type.toLowerCase(),
                                  (statement as MessageEventQuery).from.key
                                ).filter((filterEl) =>
                                  filterEl.title.includes(specMessageQuery)
                                )[selectedOptionI].title,
                              },
                            } as MessageEventQuery);
                          }}
                          noDataPlaceholder={"No results"}
                          className="min-w-[140px] max-w-[140px]"
                          options={searchableMessageInJourney(
                            statement.type.toLowerCase(),
                            (statement as MessageEventQuery).from.key
                          ).filter((el) =>
                            (el.title || "").includes(specMessageQuery)
                          )}
                        />
                      )}
                    <Select
                      value={(statement as MessageEventQuery).happenCondition}
                      onChange={(el) => {
                        handleChangeStatement(i, {
                          ...statement,
                          happenCondition: el as MessageGeneralComparison,
                        } as MessageEventQuery);
                      }}
                      noDataPlaceholder={"No results"}
                      className="min-w-[80px] max-w-[110px]"
                      options={[
                        {
                          key: MessageGeneralComparison.HAS,
                          title: MessageGeneralComparison.HAS,
                        },
                        {
                          key: MessageGeneralComparison.HAS_NOT,
                          title: MessageGeneralComparison.HAS_NOT,
                        },
                      ]}
                    />
                    <Select
                      value={(statement as MessageEventQuery).eventCondition}
                      onChange={(el) => {
                        handleChangeStatement(i, {
                          ...statement,
                          eventCondition: el,
                        } as MessageEventQuery);
                      }}
                      noDataPlaceholder={"No results"}
                      className="max-w-[160px]"
                      options={
                        messageEventsCorelation[
                          (statement as MessageEventQuery).type
                        ]
                      }
                    />
                    {(statement as MessageEventQuery).time === undefined && (
                      <div className="min-w-full">
                        <Button
                          type={ButtonType.LINK}
                          className="text-[#6366F1]"
                          onClick={() =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                comparisonType: ComparisonType.BEFORE,
                                timeBefore: new Date().toISOString(),
                                dateComparisonType: DateComparisonType.ABSOLUTE,
                              },
                            } as MessageEventQuery)
                          }
                        >
                          Set time
                        </Button>
                      </div>
                    )}
                    {(statement as MessageEventQuery).time !== undefined && (
                      <div className="min-w-full flex items-center px-5 py-[14px] border border-[#E5E7EB] bg-white gap-[10px]">
                        <Select
                          value={
                            (statement as MessageEventQuery).time!
                              .comparisonType
                          }
                          options={[
                            ComparisonType.BEFORE,
                            ComparisonType.AFTER,
                            ComparisonType.DURING,
                          ].map((comparisonType) => ({
                            key: comparisonType,
                            title: comparisonType,
                          }))}
                          onChange={(e) =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                comparisonType: e as any,
                                dateComparisonType: DateComparisonType.ABSOLUTE,
                              },
                            } as MessageEventQuery)
                          }
                          className="max-w-[145px]"
                        />

                        <Select
                          buttonClassName="!w-fit"
                          className="!w-fit"
                          value={
                            (statement as MessageEventQuery).time
                              ?.dateComparisonType
                          }
                          onChange={(value) =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                ...(statement as MessageEventQuery).time,
                                comparisonType:
                                  (statement as MessageEventQuery).time
                                    ?.comparisonType || ComparisonType.AFTER,
                                dateComparisonType: value,
                                timeBefore:
                                  value === DateComparisonType.ABSOLUTE
                                    ? ""
                                    : "1 days ago",
                                timeAfter:
                                  value === DateComparisonType.ABSOLUTE
                                    ? ""
                                    : "1 days ago",
                              },
                            } as MessageEventQuery)
                          }
                          options={[
                            {
                              key: DateComparisonType.ABSOLUTE,
                              title: "absolute date",
                            },
                            {
                              key: DateComparisonType.RELATIVE,
                              title: "relative date",
                            },
                          ]}
                        />

                        <FilterBuilderDynamicInput
                          type={StatementValueType.DATE}
                          isRelativeDate={
                            (statement as MessageEventQuery).time
                              ?.dateComparisonType ===
                            DateComparisonType.RELATIVE
                          }
                          value={
                            ((statement as MessageEventQuery).time
                              ?.comparisonType === ComparisonType.BEFORE
                              ? (statement as MessageEventQuery).time
                                  ?.timeBefore
                              : (statement as MessageEventQuery).time
                                  ?.timeAfter) || ""
                          }
                          onChange={(value) => {
                            handleChangeStatement(i, {
                              ...statement,
                              time: {
                                ...(statement as MessageEventQuery).time!,
                                ...((statement as MessageEventQuery).time
                                  ?.comparisonType === ComparisonType.BEFORE
                                  ? {
                                      timeBefore:
                                        (statement as MessageEventQuery).time
                                          ?.dateComparisonType ===
                                        DateComparisonType.ABSOLUTE
                                          ? new Date(value).toISOString()
                                          : value,
                                    }
                                  : {
                                      timeAfter:
                                        (statement as MessageEventQuery).time
                                          ?.dateComparisonType ===
                                        DateComparisonType.ABSOLUTE
                                          ? new Date(value).toISOString()
                                          : value,
                                    }),
                              },
                            } as MessageEventQuery);
                          }}
                          dataTestId={`attribute-statement-${i}`}
                        />
                        {(statement as MessageEventQuery).time
                          ?.comparisonType === ComparisonType.DURING && (
                          <>
                            -
                            <FilterBuilderDynamicInput
                              type={StatementValueType.DATE}
                              isRelativeDate={
                                (statement as MessageEventQuery).time
                                  ?.dateComparisonType ===
                                DateComparisonType.RELATIVE
                              }
                              value={
                                (statement as MessageEventQuery).time
                                  ?.timeBefore || ""
                              }
                              onChange={(value) => {
                                handleChangeStatement(i, {
                                  ...statement,
                                  time: {
                                    ...(statement as MessageEventQuery).time!,
                                    timeBefore:
                                      (statement as MessageEventQuery).time
                                        ?.dateComparisonType ===
                                      DateComparisonType.ABSOLUTE
                                        ? new Date(value).toISOString()
                                        : value,
                                  },
                                } as MessageEventQuery);
                              }}
                              dataTestId={`attribute-statement-${i}`}
                            />
                          </>
                        )}
                        <div
                          className="cursor-pointer ml-auto"
                          onClick={() =>
                            handleChangeStatement(i, {
                              ...statement,
                              time: undefined,
                            } as MessageEventQuery)
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
                ) : (statement as Query)?.isSubBuilderChild ? (
                  <FilterBuilder
                    settings={{
                      query: statement as Query,
                    }}
                    isSubBuilderChild
                    onSettingsChange={(filter) => {
                      handleChangeStatement(i, filter.query);
                    }}
                    shouldShowErrors={showErrors}
                    queryErrorsActions={queryErrorsActions}
                    onSubBuilderUngroup={handleUngroup(i)}
                    isSegmentSettings={isSegmentSettings}
                  />
                ) : (
                  <></>
                )}
                {showErrors &&
                  statementsErrors[i].map((error, k) => (
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
            !isMultisplitBuilder &&
            (settings.query.type === QueryType.ALL ||
              i === settings.query.statements.length - 1) &&
            (() => {
              const isLoading =
                settings?.query?.type === QueryType.ALL
                  ? !!sizeLoading[i]
                  : !!sizeLoading[0];

              const data =
                settings?.query?.type === QueryType.ALL
                  ? sizeData[i]
                  : sizeData[0];

              const percentage = data
                ? Math.ceil((data.size / data.total) * 100)
                : 0;

              return !data && !isLoading ? (
                <></>
              ) : (
                <div
                  className={`${
                    isLoading && "opacity-70 animate-pulse pointer-events-none"
                  } relative flex items-center py-[8.45px] max-w-[360px] px-[11.45px] rounded bg-[#F3F4F6]`}
                  id="users-reached"
                >
                  <div
                    className="mr-[2px] min-w-[15px] min-h-[15px] border border-[#6366F1] rounded-full"
                    style={{
                      background: `
                  conic-gradient(
                    #6366F1 ${percentage}%,
                    white ${percentage}% 100%
                  )
                `,
                    }}
                  />
                  {isLoading ? (
                    <span className="ml-[6px] text-[#4B5563] font-roboto text-[14px] leading-[22px]">
                      Loading...
                    </span>
                  ) : (
                    data && (
                      <>
                        <span className="text-[#6366F1] font-roboto font-semibold text-[14px] leading-[22px]">
                          {percentage}%
                        </span>
                        <span
                          className="ml-[6px] text-[#4B5563] font-roboto text-[14px] leading-[22px]"
                          id="users-reached-span-number"
                        >
                          of users estimated reached ≈{" "}
                          {Intl.NumberFormat("en", {
                            notation: "compact",
                          }).format(data.size)}
                        </span>
                      </>
                    )
                  )}
                  <div className="absolute top-full left-[25px] z-[0] h-[10px] w-[1px] bg-[#E5E7EB]" />
                </div>
              );
            })()}
        </React.Fragment>
      ))}
      <div className="flex flex-nowrap gap-[10px]">
        <Button
          type={ButtonType.SECONDARY}
          onClick={handleAddStatement}
          className="max-w-[120px] whitespace-nowrap"
          data-testid="filter-builder-add-condition-button"
        >
          Add condition
        </Button>
        <Button
          type={ButtonType.LINK}
          onClick={handleAddGroup}
          className="max-w-[130px] text-[#6366F1] whitespace-nowrap"
          data-testid="filter-builder-add-logic-group-button"
        >
          Add logic group
        </Button>
        {isSubBuilderChild && onSubBuilderUngroup && (
          <Button
            type={ButtonType.LINK}
            onClick={() => {
              onSubBuilderUngroup(settings.query.statements);
            }}
            className="max-w-[130px] text-[#6366F1] whitespace-nowrap"
            data-testid="filter-builder-ungroup-button"
          >
            Ungroup
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBuilder;
