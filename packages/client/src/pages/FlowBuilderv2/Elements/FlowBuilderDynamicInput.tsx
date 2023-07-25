import Select from "components/Elements/Selectv2";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";

interface ValueChanger {
  value: string;
  onChange: (value: string) => void;
}

interface FlowBuilderDynamicInputProps extends ValueChanger {
  type: StatementValueType;
}

const BooleanComponent: FC<ValueChanger> = ({ value, onChange }) => {
  return (
    <Select
      placeholder="value"
      value={value}
      options={[
        { key: "true", title: "true" },
        { key: "false", title: "false" },
      ]}
      onChange={(v) => onChange(v)}
    />
  );
};

const DateComponent: FC<ValueChanger> = ({ value, onChange }) => {
  let relativeValue = "";

  try {
    relativeValue = new Date(
      new Date(value).getTime() - new Date().getTimezoneOffset() * 60 * 1000
    )
      .toISOString()
      .slice(0, 16);
  } catch (e) {}

  return (
    <input
      value={relativeValue}
      onChange={(e) => onChange(new Date(e.target.value).toUTCString())}
      type="datetime-local"
      className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
      placeholder="Select time"
    />
  );
};

const EmailComponent: FC<ValueChanger> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      placeholder="value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
    />
  );
};

const NumberComponent: FC<ValueChanger> = ({ value, onChange }) => {
  return (
    <input
      type="number"
      placeholder="value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
    />
  );
};

const StringComponent: FC<ValueChanger> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      placeholder="value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
    />
  );
};

const FlowBuilderDynamicInput: FC<FlowBuilderDynamicInputProps> = ({
  type,
  value,
  onChange,
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const defaultValuesMap: Record<StatementValueType, string> = {
    [StatementValueType.BOOLEAN]: "true",
    [StatementValueType.DATE]: new Date().toUTCString(),
    [StatementValueType.EMAIL]: "email@gmail.com",
    [StatementValueType.NUMBER]: "0",
    [StatementValueType.STRING]: "",
  };

  const valueTypeToComponentMap: Record<StatementValueType, ReactNode> = {
    [StatementValueType.BOOLEAN]: (
      <BooleanComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.DATE]: (
      <DateComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.EMAIL]: (
      <EmailComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.NUMBER]: (
      <NumberComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.STRING]: (
      <StringComponent value={value} onChange={onChange} />
    ),
  };

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    onChange(defaultValuesMap[type]);
  }, [type]);

  return <>{valueTypeToComponentMap[type]}</>;
};

export default FlowBuilderDynamicInput;
