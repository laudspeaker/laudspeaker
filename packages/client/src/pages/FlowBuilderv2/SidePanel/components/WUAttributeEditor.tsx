import Select from "components/Elements/Selectv2";
import {
  HitCondition,
  MessageCondition,
  TrackerCondition,
  WUAttributeCondition,
  WUAttributeHappenCondition,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import { useState } from "react";
import { useDebounce } from "react-use";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import FilterBuilderDynamicInput from "../../Elements/DynamicInput";
import { ConditionEditorError, errorToMessageMap } from "./ConditionEditor";

interface WUAttributeEditorProps {
  errors?: {
    [ConditionEditorError.NO_ATTRIBUTE_SELECTED]: string;
    [ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE]: string;
  };
  showErrors?: boolean;
  condition: WUAttributeCondition;
  onChange: React.Dispatch<
    React.SetStateAction<
      HitCondition | TrackerCondition | MessageCondition | WUAttributeCondition
    >
  >;
}

const WUAttributeEditor = ({
  condition,
  errors,
  showErrors,
  onChange,
}: WUAttributeEditorProps) => {
  const [keysQuery, setKeysQuery] = useState("");

  const [possibleKeys, setPossibleKeys] = useState<
    {
      key: string;
      type: StatementValueType;
    }[]
  >([]);

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
    500,
    [keysQuery]
  );

  return (
    <>
      <Select
        value={condition.attributeName}
        placeholder={condition.attributeName.split(";;")[0] || "Attribute name"}
        searchPlaceholder={"Search attribute"}
        searchValue={keysQuery}
        onSearchValueChange={setKeysQuery}
        onChange={(el, i) => {
          if (i === undefined) return;

          onChange({
            ...condition,
            attributeName: el,
            // @ts-ignore IGNORED BECAUSE ARRAY AND OBJECT UNSUPPORTABLE
            valueType: possibleKeys[i].type,
          });
        }}
        noDataPlaceholder={"No results"}
        options={possibleKeys.map((el) => ({
          key: el.key + ";;" + el.type,
          title: el.key,
        }))}
      />
      <Select
        value={condition.happenCondition}
        onChange={(el) => {
          onChange({
            ...condition,
            happenCondition: el,
          });
        }}
        options={[
          {
            key: WUAttributeHappenCondition.CHANGED,
            title: "has been " + WUAttributeHappenCondition.CHANGED,
          },
          {
            key: WUAttributeHappenCondition.CHANGED_TO,
            title: "has been " + WUAttributeHappenCondition.CHANGED_TO,
          },
        ]}
      />
      {condition.happenCondition === WUAttributeHappenCondition.CHANGED_TO && (
        <>
          <Select
            value={condition.valueType}
            onChange={(el) => {
              onChange({
                ...condition,
                // @ts-ignore
                valueType: el,
              });
            }}
            options={[
              ...Object.values(StatementValueType)
                .filter(
                  (el) =>
                    el !== StatementValueType.ARRAY &&
                    el !== StatementValueType.OBJECT
                )
                .map((el) => {
                  return {
                    key: el,
                    title: el,
                  };
                }),
            ]}
          />
          <FilterBuilderDynamicInput
            type={condition.valueType}
            value={condition.value || ""}
            onChange={(value) => {
              onChange({
                ...condition,
                value,
              });
            }}
          />
        </>
      )}
      {showErrors &&
        errors &&
        errors[ConditionEditorError.NO_ATTRIBUTE_SELECTED] && (
          <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
            {errorToMessageMap[ConditionEditorError.NO_ATTRIBUTE_SELECTED]}
          </div>
        )}
      {showErrors &&
        errors &&
        errors[ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE] && (
          <div className="font-inter font-normal text-[12px] leading-5 text-[#E11D48]">
            {errorToMessageMap[ConditionEditorError.UNSUPPORTED_ATTRIBUTE_TYPE]}
          </div>
        )}
    </>
  );
};

export { WUAttributeEditor };
