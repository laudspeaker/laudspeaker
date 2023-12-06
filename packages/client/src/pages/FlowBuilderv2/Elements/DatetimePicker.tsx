import React, { FC, useState } from "react";

interface DatetimePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

const DatetimePicker: FC<DatetimePickerProps> = ({ value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return value || isFocused ? (
    <input
      value={
        value
          ? new Date(
              new Date(value).getTime() -
                new Date().getTimezoneOffset() * 60 * 1000
            )
              .toISOString()
              .slice(0, 16)
          : undefined
      }
      onChange={(e) => onChange(new Date(e.target.value).toUTCString())}
      type="datetime-local"
      className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-sm border border-[#E5E7EB]"
      placeholder="Select time"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  ) : (
    <input
      type="text"
      className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-sm border border-[#E5E7EB] cursor-pointer"
      placeholder="Select time"
      onFocus={() => setIsFocused(true)}
    />
  );
};

export default DatetimePicker;
