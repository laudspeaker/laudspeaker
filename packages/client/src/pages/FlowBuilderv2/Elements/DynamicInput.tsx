import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Modal from "components/Elements/Modalv2";
import Select from "components/Elements/Selectv2";
import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";
import { ArrayComponent } from "./ArrayComponent";

export interface ValueChanger {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
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

export enum DateRelativeUnit {
  DAYS = "days",
  WEEKS = "weeks",
}

export enum DateRelativePoint {
  FROM_NOW = "from-now",
  AGO = "ago",
}

export const DateComponent: FC<ValueChanger & { isRelativeDate?: boolean }> = ({
  value,
  onChange,
  isRelativeDate,
}) => {
  const [relativeCount, setRelativeCount] = useState(0);
  const [relativeUnit, setRelativeUnit] = useState<DateRelativeUnit>(
    DateRelativeUnit.DAYS
  );
  const [relativePoint, setRelativePoint] = useState<DateRelativePoint>(
    DateRelativePoint.FROM_NOW
  );

  useEffect(() => {
    if (!isRelativeDate) return;

    const [newRelativeCount, newRelativeUnit, newRelativePoint] =
      value.split(" ");

    if (!isNaN(+newRelativeCount)) setRelativeCount(+newRelativeCount);
    if (
      newRelativeUnit === DateRelativeUnit.DAYS ||
      newRelativeUnit === DateRelativeUnit.WEEKS
    )
      setRelativeUnit(newRelativeUnit);

    if (
      newRelativePoint === DateRelativePoint.AGO ||
      newRelativePoint === DateRelativePoint.FROM_NOW
    )
      setRelativePoint(newRelativePoint);
  }, [value]);

  useEffect(() => {
    if (!isRelativeDate) return;

    onChange(`${relativeCount} ${relativeUnit} ${relativePoint}`);
  }, [relativeCount, relativeUnit, relativePoint]);

  if (!isRelativeDate) {
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
        className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-sm border border-[#E5E7EB]"
        placeholder="Select time"
      />
    );
  }

  return (
    <div className="flex gap-2.5">
      <Input
        value={String(relativeCount)}
        onChange={(numString) => {
          const num = +numString;
          if (isNaN(num) || num < 0) return;

          setRelativeCount(num);
        }}
        type="number"
      />
      <Select
        value={relativeUnit}
        onChange={(relativeUn) => setRelativeUnit(relativeUn)}
        options={Object.values(DateRelativeUnit).map((relativeUn) => ({
          key: relativeUn,
          title: relativeUn,
        }))}
      />
      <Select
        value={relativePoint}
        onChange={(val) => setRelativePoint(val)}
        options={[
          { key: DateRelativePoint.FROM_NOW, title: "from now" },
          { key: DateRelativePoint.AGO, title: "ago" },
        ]}
      />
    </div>
  );
};

const EmailComponent: FC<ValueChanger> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      placeholder="value"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
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
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
    />
  );
};

const StringComponent: FC<ValueChanger> = ({
  value,
  placeholder = "",
  onChange,
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder || "value"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
    />
  );
};

interface DynamicInputProps extends ValueChanger {
  type: StatementValueType;
  isArray?: boolean;
  isRelativeDate?: boolean;
}

const DynamicInput: FC<DynamicInputProps> = ({
  type,
  isArray,
  value,
  placeholder,
  onChange,
  isRelativeDate,
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const defaultValuesMap: Record<StatementValueType, string> = {
    [StatementValueType.BOOLEAN]: "true",
    [StatementValueType.DATE]: new Date().toUTCString(),
    [StatementValueType.DATE_TIME]: new Date().toUTCString(),
    [StatementValueType.EMAIL]: "email@gmail.com",
    [StatementValueType.NUMBER]: "0",
    [StatementValueType.STRING]: "",
    [StatementValueType.ARRAY]: JSON.stringify([]),
    [StatementValueType.OBJECT]: "",
  };

  const valueTypeToComponentMap: Record<StatementValueType, ReactNode> = {
    [StatementValueType.BOOLEAN]: (
      <BooleanComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.DATE]: (
      <DateComponent
        value={value}
        onChange={onChange}
        isRelativeDate={isRelativeDate}
      />
    ),
    [StatementValueType.DATE_TIME]: (
      <DateComponent
        value={value}
        onChange={onChange}
        isRelativeDate={isRelativeDate}
      />
    ),
    [StatementValueType.EMAIL]: (
      <EmailComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.NUMBER]: (
      <NumberComponent value={value} onChange={onChange} />
    ),
    [StatementValueType.STRING]: (
      <StringComponent
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
    [StatementValueType.ARRAY]: (
      <StringComponent
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
    [StatementValueType.OBJECT]: (
      <StringComponent
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
  };

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    onChange(defaultValuesMap[type]);
  }, [type]);

  const dynamicComponent = valueTypeToComponentMap[type];

  return (
    <>
      {isArray ? (
        <ArrayComponent
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        dynamicComponent
      )}
    </>
  );
};

export default DynamicInput;
