import Select from "components/Elements/Selectv2";
import { capitalize } from "lodash";
import React from "react";
import {
  ComparisonType,
  ConditionalSegmentsSettings,
  EventQueryAdditionalProperty,
  EventQueryStatement,
  ObjectKeyComparisonType,
  PerformedType,
  QueryStatement,
  QueryType,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import Button, {
  ButtonType,
} from "../../../components/Elements/Buttonv2/Button";
import FilterBuilderDynamicInput from "../Elements/DynamicInput";
import {
  FilterAdditionalProperty,
  QueryStatementError,
} from "./FilterAdditionalProperty";
import { SegmentsSettings } from "reducers/segment.reducer";

interface EventStatementProps {
  statement: EventQueryStatement;
  index: number;
  handleChangeStatement: (i: number, _statement: QueryStatement) => void;
  possibleKeys: {
    key: string;
    type: StatementValueType;
  }[];
  setKeysQuery: (value: React.SetStateAction<string>) => void;
  showErrors: boolean | undefined;
  statementsErrors: QueryStatementError[][];
  settings: ConditionalSegmentsSettings | SegmentsSettings;
  onSettingsChange: (
    settings: ConditionalSegmentsSettings | SegmentsSettings
  ) => void;
}

export const EventStatement = ({
  statement,
  index,
  handleChangeStatement,
  possibleKeys,
  setKeysQuery,
  showErrors,
  statementsErrors,
  settings,
  onSettingsChange,
}: EventStatementProps) => {
  const handleChangeEventProperty = (
    i: number,
    j: number,
    property: EventQueryAdditionalProperty
  ) => {
    const newStatements = [...settings.query.statements];

    const _statement = newStatements[i] as EventQueryStatement;

    const newProperties = [..._statement.additionalProperties.properties];

    newProperties[j] = { ...property };

    newStatements[i] = {
      ..._statement,
      additionalProperties: {
        ..._statement.additionalProperties,
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

    const _statement = newStatements[i] as EventQueryStatement;

    const newProperties = [..._statement.additionalProperties.properties];

    newProperties.splice(j, 1);

    newStatements[i] = {
      ..._statement,
      additionalProperties: {
        ..._statement.additionalProperties,
        properties: [...newProperties],
      },
    };

    onSettingsChange({
      ...settings,
      query: { ...settings.query, statements: newStatements },
    });
  };

  return (
    <>
      <div className="flex gap-[10px]">
        <div>
          <FilterBuilderDynamicInput
            type={StatementValueType.STRING}
            value={statement.eventName}
            placeholder="Name"
            onChange={(value) =>
              handleChangeStatement(index, {
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
              handleChangeStatement(index, {
                ...statement,

                comparisonType: e.target.value as PerformedType,
              })
            }
            className="w-[166px] px-[12px] py-[5px] mr-[10px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
          >
            {Object.values(PerformedType).map((performedType, j) => (
              <option key={j} value={performedType}>
                {performedType}
              </option>
            ))}
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
                handleChangeStatement(index, {
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

      {statement.time !== undefined && (
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
              handleChangeStatement(index, {
                ...statement,
                time: {
                  comparisonType: e as any,
                },
              })
            }
            className="max-w-[145px]"
          />

          <FilterBuilderDynamicInput
            type={StatementValueType.DATE}
            value={
              (statement.time?.comparisonType === ComparisonType.BEFORE
                ? statement.time.timeBefore
                : statement.time.timeAfter) || ""
            }
            onChange={(value) => {
              handleChangeStatement(index, {
                ...statement,
                time: {
                  ...statement.time!,
                  ...(statement.time?.comparisonType === ComparisonType.BEFORE
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
          {statement.time?.comparisonType === ComparisonType.DURING && (
            <>
              -
              <FilterBuilderDynamicInput
                type={StatementValueType.DATE}
                value={statement.time.timeBefore || ""}
                onChange={(value) => {
                  handleChangeStatement(index, {
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
              handleChangeStatement(index, {
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
                  value={statement.additionalProperties.comparison}
                  onChange={(e) =>
                    handleChangeStatement(index, {
                      ...statement,
                      additionalProperties: {
                        ...statement.additionalProperties,
                        comparison: e.target.value as QueryType,
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
            </div>
            <div className="w-full flex flex-col gap-[10px] mt-[10px]">
              {statement.additionalProperties.properties.map(
                (property, propertyI) => (
                  <FilterAdditionalProperty
                    {...{
                      statement,
                      property,
                      propertyI,
                      possibleKeys,
                      handleChangeEventProperty,
                      setKeysQuery,
                      handleDeleteEventProperty,
                      showErrors,
                      statementsErrors,
                    }}
                    i={index}
                  />
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
            handleChangeStatement(index, {
              ...statement,
              additionalProperties: {
                ...statement.additionalProperties,
                properties: [
                  ...statement.additionalProperties.properties,
                  {
                    key: "",
                    comparisonType: ComparisonType.EQUALS,
                    subComparisonType: ObjectKeyComparisonType.KEY_EXIST,
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
              handleChangeStatement(index, {
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
  );
};
