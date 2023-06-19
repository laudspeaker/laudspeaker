import React, { FC, ReactNode, useEffect } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";

interface ValueChanger {
  value: string;
  onChange: (value: string) => void;
}

interface FlowBuilderDynamicInputProps extends ValueChanger {
  type: StatementValueType;
}

const BooleanComponent: FC<ValueChanger> = ({ value, onChange }) => {
  useEffect(() => {
    onChange("true");
  }, []);

  return (
    <select
      placeholder="value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-[2px]"
    >
      <option value="" disabled>
        value
      </option>
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  );
};

const DateComponent: FC<ValueChanger> = ({ value, onChange }) => {
  useEffect(() => {
    onChange(new Date().toUTCString());
  }, []);

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
  useEffect(() => {
    onChange("email@gmail.com");
  }, []);

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
  useEffect(() => {
    onChange("0");
  }, []);

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
  useEffect(() => {
    onChange("");
  }, []);

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

  return <>{valueTypeToComponentMap[type]}</>;
};

export default FlowBuilderDynamicInput;
