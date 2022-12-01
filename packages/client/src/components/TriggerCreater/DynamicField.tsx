import { Input, Select } from "components/Elements";
import React, { FC } from "react";

export interface DynamicFieldProps {
  data: { type?: string; options?: { label: string; id: string }[] };
  value: string;
  onChange: (value: string) => void;
}

const DynamicField: FC<DynamicFieldProps> = ({ data, value, onChange }) => {
  switch (data.type) {
    case "select":
      if (!data.options) return <>Wrong options</>;
      return (
        <Select
          value={value}
          onChange={onChange}
          options={data.options.map((item) => ({
            value: item.id,
            title: item.label,
          }))}
        />
      );
    case "inputText":
      return (
        <Input
          className="!col-span-1"
          name="dynamic-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "inputNumber":
      return (
        <Input
          className="!col-span-1"
          name="dynamic-input"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
  return <></>;
};

export default DynamicField;
