import AutoComplete from "components/Autocomplete";
import { Input, Select } from "components/Elements";
import { getEventKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useEffect, useState } from "react";
import { EventCondition } from "./TriggerCreater";
import AC from "react-autocomplete";
import { useDebounce } from "react-use";

export interface ConditionCreaterProps {
  condition: EventCondition;
  onChange: (condition: EventCondition) => void;
}

const ConditionCreater: FC<ConditionCreaterProps> = ({
  condition,
  onChange,
}) => {
  const { key, value, type, comparisonType } = condition;

  const [possibleKeys, setPossibleKeys] = useState<string[]>([]);

  const [possibleTypes, setPossibleTypes] = useState<string[]>([]);

  const [possibleComparisonTypes, setPosiblecomparisonTypes] = useState<
    string[]
  >([]);

  useEffect(() => {}, [condition.type]);

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
    <div className="flex gap-[10px] justify-between items-center">
      <div className="relative">
        <AC
          getItemValue={(item) => JSON.stringify(item)}
          items={possibleKeys}
          autoHighlight={false}
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
      <Input
        name="Key name"
        value={key}
        onChange={(e) => handleConditionChange(e.target.name, e.target.value)}
      />
      <Select
        id="keyType"
        options={possibleTypes.map((item) => ({ value: item }))}
        value={type}
        onChange={() => {}}
      />
      <Select
        id="comparisonType"
        value={comparisonType}
        options={possibleComparisonTypes.map((item) => ({ value: item }))}
        onChange={() => {}}
      />
    </div>
  );
};

export default ConditionCreater;
