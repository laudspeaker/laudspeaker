import { Input, Select } from "components/Elements";
import DateTimePicker from "components/Elements/DateTimePicker";
import AC from "react-autocomplete";
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
        />
      );
    case "inputText":
      return (
        <div className="relative">
          <AC
            items={possibleValues}
            getItemValue={(item) => JSON.stringify(item)}
            renderItem={(item, isHighlighted) => (
              <div
                className={`${
                  isHighlighted ? "bg-cyan-100" : ""
                } p-[2px] rounded-[6px] overflow-hidden text-ellipsis`}
              >
                {item}
              </div>
            )}
            autoHighlight={false}
            renderInput={(props) => (
              <Input
                className="!col-span-1"
                name="dynamic-input"
                inputRef={props.ref}
                disabled={disabled}
                id="dynamicInput"
                {...props}
              />
            )}
            renderMenu={(items) => {
              if (!items.length) return <></>;

              return (
                <div className="shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                  {items}
                </div>
              );
            }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={(val) => onChange(JSON.parse(val))}
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
