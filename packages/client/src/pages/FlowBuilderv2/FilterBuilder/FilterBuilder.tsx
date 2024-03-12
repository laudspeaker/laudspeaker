import axios, { CancelTokenSource } from "axios";
import { isBefore } from "date-fns";
import { capitalize } from "lodash";
import { FC, useEffect, useId, useState } from "react";
import { useDispatch } from "react-redux";
import { useDebounce } from "react-use";
import {
  ComparisonType,
  ConditionalSegmentsSettings,
  DateComparisonType,
  MessageEventQuery,
  ObjectKeyComparisonType,
  QueryStatement,
  QueryStatementType,
  QueryType,
  StatementValueType,
  addSegmentQueryError,
  removeSegmentQueryError,
} from "reducers/flow-builder.reducer";
import {
  SegmentsSettings,
  addSegmentQueryError as addSegmentSettingQueryError,
  removeSegmentQueryError as removeSegmentSettingQueryError,
} from "reducers/segment.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import { Segment } from "types/Segment";
import { Workflow } from "types/Workflow";
import deepCopy from "utils/deepCopy";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import {
  QueryStatementError,
  QueryStatementErrors,
} from "./FilterAdditionalProperty";
import { Statement } from "./FilterStatement";

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
    }[]
  >([]);

  const loadSegments = async () => {
    const {
      data: { data },
    } = await ApiService.get<{ data: Segment[] }>({ url: "/segments" });

    setSegments(data);
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

  return (
    <div className="flex w-full flex-col gap-[10px] pr-[10px]">
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
      {settings.query.statements.map((statement, index) => (
        <Statement
          key={`${statement.type}-${index}`}
          {...{
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
          }}
        />
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
