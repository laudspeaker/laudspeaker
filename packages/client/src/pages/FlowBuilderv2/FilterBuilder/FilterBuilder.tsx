import React, { FC, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import {
  ComparisonType,
  ConditionalSegmentsSettings,
  QueryStatement,
  QueryStatementType,
  QueryType,
  StatementValueType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import { Segment } from "types/Segment";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FlowBuilderAutoComplete from "../Elements/FlowBuilderAutoComplete";
import FilterBuilderDynamicInput from "../Elements/FlowBuilderDynamicInput";

interface FilterBuilderProps {
  settings: ConditionalSegmentsSettings;
  onSettingsChange: (settings: ConditionalSegmentsSettings) => void;
}

enum QueryStatementError {
  NO_ATTRIBUTE_NAME,
  NO_SEGMENT_SELECTED,
}

const queryStatementErrorToMessageMap: Record<QueryStatementError, string> = {
  [QueryStatementError.NO_ATTRIBUTE_NAME]: "Attribute must be defined",
  [QueryStatementError.NO_SEGMENT_SELECTED]: "Segment must be selected",
};

const FilterBuilder: FC<FilterBuilderProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { showSegmentsErrors } = useAppSelector((state) => state.flowBuilder);

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

    if (statement.type === QueryStatementType.ATTRIBUTE && !statement.key) {
      statementErrors.push(QueryStatementError.NO_ATTRIBUTE_NAME);
    }

    if (statement.type === QueryStatementType.SEGMENT && !statement.segmentId) {
      statementErrors.push(QueryStatementError.NO_SEGMENT_SELECTED);
    }

    statementsErrors.push(statementErrors);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex gap-[10px] items-center">
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
        <>
          <div
            key={i}
            className="bg-[#F3F4F6] p-[10px] rounded-[4px] flex justify-between items-center"
          >
            <div className="flex gap-[10px] items-center">
              <div>
                <select
                  value={statement.type}
                  onChange={(e) =>
                    handleChangeStatement(
                      i,
                      e.target.value === QueryStatementType.ATTRIBUTE
                        ? {
                            type: QueryStatementType.ATTRIBUTE,
                            key: "",
                            comparisonType: ComparisonType.EQUALS,
                            valueType: StatementValueType.STRING,
                            value: "",
                          }
                        : e.target.value === QueryStatementType.SEGMENT
                        ? {
                            type: QueryStatementType.SEGMENT,
                            segmentId: "",
                          }
                        : statement
                    )
                  }
                  className="w-[100px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
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
                  </div>
                </>
              ) : (
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
              )}
            </div>
            <div
              className="cursor-pointer"
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

          {showSegmentsErrors &&
            statementsErrors[i].map((error) => (
              <div className="font-inter font-normal text-[12px] leading-[20px] text-[#E11D48]">
                {queryStatementErrorToMessageMap[error]}
              </div>
            ))}

          {i !== query.statements.length - 1 && (
            <div className="py-[5px] px-[12px] bg-[#F3F4F6] border-[1px] border-[#E5E7EB] rounded-[4px] w-fit font-roboto font-normal text-[14px] leading-[22px] text-[#4B5563]">
              {query.type === QueryType.ALL ? "And" : "Or"}
            </div>
          )}
        </>
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
