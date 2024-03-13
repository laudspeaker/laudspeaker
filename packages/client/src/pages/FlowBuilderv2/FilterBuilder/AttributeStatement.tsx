import Select from "components/Elements/Selectv2";
import React from "react";
import {
  AttributeQueryStatement,
  ComparisonType,
  DateComparisonType,
  ObjectKeyComparisonType,
  QueryStatement,
  StatementValueType,
  valueTypeToComparisonTypesMap,
} from "reducers/flow-builder.reducer";
import FlowBuilderAutoComplete from "../../../components/AutoCompletev2/AutoCompletev2";
import FilterBuilderDynamicInput from "../Elements/DynamicInput";

interface AttributeStatementProps {
  statement: AttributeQueryStatement;
  possibleKeys: {
    key: string;
    type: StatementValueType;
  }[];
  handleChangeStatement: (i: number, _statement: QueryStatement) => void;
  setKeysQuery: (value: React.SetStateAction<string>) => void;
  index: number;
}

export const AttributeStatement = ({
  statement,
  possibleKeys,
  handleChangeStatement,
  setKeysQuery,
  index,
}: AttributeStatementProps) => {
  return (
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
            handleChangeStatement(index, { ...statement, key: q });
            setKeysQuery(q);
          }}
          onSelect={(value) => {
            handleChangeStatement(index, {
              ...statement,
              key: value,
            });
            setKeysQuery(value);
          }}
          getKey={(value) => value}
          placeholder="Attribute name"
          inputDataTestId={`attribute-name-input-${index}`}
        />
      </div>
      <div>
        <select
          value={`${statement.valueType};;${statement.comparisonType}`}
          className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
          onChange={(ev) => {
            if (!ev.target.value) return;

            const [valueType, comparisonValueType] =
              ev.target.value.split(";;");

            handleChangeStatement(index, {
              ...statement,
              valueType: valueType as StatementValueType,
              comparisonType: comparisonValueType as ComparisonType,
            });
          }}
          data-testid={`attribute-statement-select-${index}`}
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
            onChange={(value) =>
              handleChangeStatement(index, {
                ...statement,
                dateComparisonType: value,
                value:
                  value === DateComparisonType.ABSOLUTE ? "" : "1 days ago",
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
            dataTestId={`attribute-name-${index}-date-select`}
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
              handleChangeStatement(index, {
                ...statement,
                value: +value ? value : "0",
              })
            }
            dataTestId={`attribute-statement-${index}`}
          />
        ) : (
          statement.comparisonType !== ComparisonType.EXIST &&
          statement.comparisonType !== ComparisonType.NOT_EXIST && (
            <FilterBuilderDynamicInput
              type={statement.valueType}
              value={statement.value}
              isRelativeDate={
                statement.dateComparisonType === DateComparisonType.RELATIVE
              }
              onChange={(value) =>
                handleChangeStatement(index, {
                  ...statement,
                  value,
                })
              }
              dataTestId={`attribute-statement-${index}`}
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
                  statement.dateComparisonType === DateComparisonType.RELATIVE
                }
                value={statement.subComparisonValue || ""}
                onChange={(value) => {
                  handleChangeStatement(index, {
                    ...statement,
                    subComparisonValue: value,
                  });
                }}
                dataTestId={`attribute-statement-${index}`}
              />
            </div>
          </>
        )}
      {statement.comparisonType === ComparisonType.OBJECT_KEY && (
        <div>
          <select
            value={statement.subComparisonType}
            onChange={(e) =>
              handleChangeStatement(index, {
                ...statement,
                subComparisonType: e.target.value as ObjectKeyComparisonType,
              })
            }
            className="w-[145px] px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] rounded-sm"
            data-testid={`attribute-name-object-select-${index}`}
          >
            {Object.values(ObjectKeyComparisonType).map((comparisonType, j) => (
              <option key={j} value={comparisonType}>
                {comparisonType}
              </option>
            ))}
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
                handleChangeStatement(index, {
                  ...statement,
                  subComparisonValue: value,
                })
              }
              dataTestId={`attribute-statement-${index}`}
            />
          </div>
        )}
    </>
  );
};
