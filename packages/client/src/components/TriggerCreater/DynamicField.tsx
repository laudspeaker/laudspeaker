import { Input, Select } from "components/Elements";
import DateTimePicker from "components/Elements/DateTimePicker";
import Autocomplete from "components/Autocomplete";
import React, { FC } from "react";

export interface DynamicFieldProps {
  data: { type?: string; options?: { label: string; id: string }[] };
  value: string;
  possibleValues: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DynamicField: FC<DynamicFieldProps> = ({
  data,
  value,
  onChange,
  possibleValues,
  disabled,
}) => {
  switch (data.type) {
    case "select":
      if (!data.options) return <>Wrong options</>;
      return (
        <Select
          value={value}
          id="dynamicInput"
          onChange={onChange}
          options={data.options.map((item) => ({
            value: item.id,
            title: item.label,
          }))}
          disabled={disabled}
          wrapperClassnames="max-w-[200px]"
        />
      );
    case "inputText":
      return (
        <div className="relative">
          <Autocomplete
            inputId="dynamicInput"
            items={possibleValues}
            inputValue={value}
            onInputChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            onOptionSelect={(el) => {
              onChange(el);
            }}
            optionKey={(el) => el}
            optionRender={(el) => el}
          />
        </div>
      );
    case "inputNumber":
      return (
        <Input
          className="!col-span-1"
          name="dynamic-input"
          type="number"
          id="dynamicInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "dateTime":
      return (
        <DateTimePicker
          handleChange={onChange}
          value={value}
          disabled={disabled}
        />
      );
  }
  return <></>;
};

export default DynamicField;
