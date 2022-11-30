import { Input, Select } from "components/Elements";
import React, { FC, useEffect, useState } from "react";
import { EventCondition } from "./TriggerCreater";

export interface ConditionCreaterProps {
  condition: EventCondition;
  onChange: (condition: EventCondition) => void;
}

const ConditionCreater: FC<ConditionCreaterProps> = ({
  condition,
  onChange,
}) => {
  const handleConditionChange = (name: string, value: string) => {
    (condition as any)[name] = value;
    onChange(condition);
  };

  const { key, value, type, comparisonType } = condition;

  const [possibleTypes, setPossibleTypes] = useState<string[]>([]);

  const [possibleComparisonTypes, setPosiblecomparisonTypes] = useState<
    string[]
  >([]);

  useEffect(() => {}, []);

  return (
    <div className="flex gap-[10px] justify-between items-center">
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
