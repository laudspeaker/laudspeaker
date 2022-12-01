import AutoComplete from "components/Autocomplete";
import { Input, Select } from "components/Elements";
import { getEventKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useEffect, useState } from "react";
import { EventCondition } from "./TriggerCreater";
import AC from "react-autocomplete";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import DynamicField from "./DynamicField";

export interface ConditionCreaterProps {
  condition: EventCondition;
  onChange: (condition: EventCondition) => void;
  possibleTypes: string[];
}

const ConditionCreater: FC<ConditionCreaterProps> = ({
  condition,
  onChange,
  possibleTypes,
}) => {
  const { key, value, type, comparisonType } = condition;

  const [possibleKeys, setPossibleKeys] = useState<string[]>([]);

  const [possibleComparisonTypes, setPossibleComparisonTypes] = useState<
    {
      label: string;
      id: string;
    }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({
        url: `/events/possible-comparison/${type}`,
      });

      setPossibleComparisonTypes(data);
    })();
  }, [type]);

  const [dynamicDataToRender, setDynamicDataToRender] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({
        url: `/events/attributes/${comparisonType}`,
      });

      setDynamicDataToRender(data);
    })();
  }, [comparisonType]);

  const handleConditionChange = (name: string, newValue: string) => {
    (condition as any)[name] = newValue;
    onChange(condition);
    getEventKeys(newValue).then(({ data }) => {
      setPossibleKeys(data);
    });
  };

  const [newKey, setNewKey] = useState(condition.key);

  useDebounce(
    () => {
      handleConditionChange("Key name", newKey || "");
    },
    1000,
    [newKey]
  );

  useEffect(() => {
    getEventKeys("").then(({ data }) => {
      setPossibleKeys(data);
    });
  }, []);

  return (
    <div className="grid grid-cols-4 gap-[10px] items-center m-[10px_0px]">
      <div className="relative">
        <AC
          getItemValue={(item) => JSON.stringify(item)}
          items={possibleKeys}
          autoHighlight={false}
          renderInput={(props) => (
            <Input
              name={props.name || ""}
              value={props.value}
              onChange={props.onChange}
              aria-expanded={props["aria-expanded"]}
            />
          )}
          renderItem={(item, isHighlighted) => (
            <div
              className={`${
                isHighlighted ? "bg-cyan-100" : ""
              } p-[2px] rounded-[6px]`}
            >
              {item.key}
            </div>
          )}
          renderMenu={(items) => {
            return (
              <div className="shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                {items}
              </div>
            );
          }}
          value={newKey}
          onChange={(e) => {
            setNewKey(e.target.value);
          }}
          onSelect={(e) => {
            console.log(JSON.parse(e));
          }}
        />
      </div>
      <Select
        id="keyType"
        options={possibleTypes.map((item) => ({ value: item }))}
        value={type}
        onChange={(val) => {
          handleConditionChange("type", val);
          handleConditionChange("comparisonType", "");
          handleConditionChange("value", "");
        }}
      />
      <Select
        id="comparisonType"
        value={comparisonType}
        options={possibleComparisonTypes.map((item) => ({
          value: item.id,
          title: item.label,
        }))}
        onChange={(val) => {
          handleConditionChange("comparisonType", val);
          handleConditionChange("value", "");
        }}
      />
      <DynamicField
        value={value}
        data={dynamicDataToRender}
        onChange={(val) => handleConditionChange("value", val)}
      />
    </div>
  );
};

export default ConditionCreater;
