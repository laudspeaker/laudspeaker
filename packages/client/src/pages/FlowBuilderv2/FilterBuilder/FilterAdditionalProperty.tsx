import React from "react";
import {
  ComparisonType,
  EventQueryAdditionalProperty,
  EventQueryStatement,
  ObjectKeyComparisonType,
  QueryType,
  StatementValueType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import FlowBuilderAutoComplete from "../../../components/AutoCompletev2/AutoCompletev2";
import FilterBuilderDynamicInput from "../Elements/DynamicInput";

export enum QueryStatementErrors {
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

export interface QueryStatementError {
  type: QueryStatementErrors;
  eventPropertyErrors: QueryStatementErrors[][];
}

export const queryStatementErrorToMessageMap: Record<
  QueryStatementErrors,
  string
> = {
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

interface FilterPropertyProps {
  statement: EventQueryStatement;
  property: EventQueryAdditionalProperty;
  possibleKeys: {
    key: string;
    type: StatementValueType;
  }[];
  handleChangeEventProperty: (
    i: number,
    j: number,
    property: EventQueryAdditionalProperty
  ) => void;
  propertyI: number;
  i: number;
  setKeysQuery: (value: React.SetStateAction<string>) => void;
  handleDeleteEventProperty: (i: number, j: number) => void;
  showErrors: boolean | undefined;
  statementsErrors: QueryStatementError[][];
}

export const FilterAdditionalProperty = ({
  statement,
  property,
  possibleKeys,
  handleChangeEventProperty,
  propertyI,
  i,
  setKeysQuery,
  handleDeleteEventProperty,
  showErrors,
  statementsErrors,
}: FilterPropertyProps) => {
  return (
    <>
      <div className="flex items-center w-full">
        <div
          className={`${
            statement.additionalProperties.comparison === QueryType.ALL
              ? "text-[#0C4A6E] bg-[#E0F2FE]"
              : "text-[#713F12] bg-[#FEF9C3]"
          } min-w-[50px] z-[1] text-center mr-[10px] py-[2px] px-[11.5px] rounded-[14px] font-roboto font-normal text-[14px] leading-[22px]`}
        >
          {statement.additionalProperties.comparison === QueryType.ALL
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
                  items: possibleKeys.map((item) => item.key),
                }}
                retrieveLabel={(item) => item}
                onQueryChange={(q) => {
                  handleChangeEventProperty(i, propertyI, {
                    ...property,
                    key: q,
                  });
                  setKeysQuery(q);
                }}
                onSelect={(value) => {
                  handleChangeEventProperty(i, propertyI, {
                    ...property,
                    key: value,
                  });
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

                  const [valueType, comparisonValueType] =
                    ev.target.value.split(";;");

                  handleChangeEventProperty(i, propertyI, {
                    ...property,
                    valueType: valueType as StatementValueType,
                    comparisonType: comparisonValueType as ComparisonType,
                  });
                }}
              >
                {Object.values(StatementValueType).map((comparisonType, j) => (
                  <optgroup key={j} label={comparisonType}>
                    {valueTypeToComparisonTypesMap[comparisonType].map(
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
              {property.valueType === StatementValueType.ARRAY &&
              [
                ComparisonType.ARRAY_LENGTH_EQUAL,
                ComparisonType.ARRAY_LENGTH_GREATER,
                ComparisonType.ARRAY_LENGTH_LESS,
              ].includes(property.comparisonType) ? (
                <FilterBuilderDynamicInput
                  type={StatementValueType.NUMBER}
                  value={property.value}
                  onChange={(value) =>
                    +value >= 0 &&
                    handleChangeEventProperty(i, propertyI, {
                      ...property,
                      value: +value ? value : "0",
                    })
                  }
                />
              ) : (
                property.comparisonType !== ComparisonType.EXIST &&
                property.comparisonType !== ComparisonType.NOT_EXIST && (
                  <FilterBuilderDynamicInput
                    type={property.valueType}
                    value={property.value}
                    onChange={(value) =>
                      handleChangeEventProperty(i, propertyI, {
                        ...property,
                        value,
                      })
                    }
                  />
                )
              )}
            </div>
            {property.valueType === StatementValueType.DATE &&
              property.comparisonType === ComparisonType.DURING && (
                <>
                  -
                  <div>
                    <FilterBuilderDynamicInput
                      type={StatementValueType.DATE}
                      value={property.subComparisonValue || ""}
                      onChange={(value) => {
                        handleChangeEventProperty(i, propertyI, {
                          ...property,
                          subComparisonValue: value,
                        });
                      }}
                    />
                  </div>
                </>
              )}
            {property.comparisonType === ComparisonType.OBJECT_KEY && (
              <div>
                <select
                  value={property.subComparisonType}
                  onChange={(e) =>
                    handleChangeEventProperty(i, propertyI, {
                      ...property,
                      subComparisonType: e.target
                        .value as ObjectKeyComparisonType,
                    })
                  }
                  className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
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
            {property.comparisonType === ComparisonType.OBJECT_KEY &&
              [
                ObjectKeyComparisonType.KEY_VALUE_EQUAL_TO,
                ObjectKeyComparisonType.KEY_VALUE_NOT_EQUAL_TO,
              ].includes(property.subComparisonType) && (
                <div>
                  <FilterBuilderDynamicInput
                    type={StatementValueType.STRING}
                    value={property.subComparisonValue}
                    onChange={(value) =>
                      handleChangeEventProperty(i, propertyI, {
                        ...property,
                        subComparisonValue: value,
                      })
                    }
                  />
                </div>
              )}
          </>
          <div
            className="cursor-pointer ml-auto"
            onClick={() => handleDeleteEventProperty(i, propertyI)}
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
            {error?.eventPropertyErrors[propertyI]?.map(
              (propError, propErrorI) => (
                <div
                  key={propErrorI}
                  className="ml-[60px] w-full font-inter font-normal text-[12px] leading-5 text-[#E11D48]"
                >
                  {queryStatementErrorToMessageMap[propError]}
                </div>
              )
            )}
          </React.Fragment>
        ))}
    </>
  );
};
