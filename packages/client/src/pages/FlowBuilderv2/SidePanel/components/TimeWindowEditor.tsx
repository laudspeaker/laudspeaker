import DatetimePicker from "pages/FlowBuilderv2/Elements/DatetimePicker";
import React, { FC } from "react";

interface TimeWindowEditorProps {
  from?: string;
  to?: string;
  onChangeFrom: (from: string) => void;
  onChangeTo: (to: string) => void;
}

const TimeWindowEditor: FC<TimeWindowEditorProps> = ({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}) => {
  const handleFromChange = (date: Date) => {
    if (to && date > new Date(to)) {
      onChangeFrom(to);
      return;
    }

    onChangeFrom(date.toUTCString());
  };

  const handleToChange = (date: Date) => {
    if (from && date < new Date(from)) {
      onChangeTo(from);
      return;
    }

    onChangeTo(date.toUTCString());
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
        <div>Wait from</div>
        <DatetimePicker
          value={from}
          onChange={(value) => handleFromChange(new Date(value))}
        />
      </div>
      <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
        <div>To</div>
        <DatetimePicker
          value={to}
          onChange={(value) => handleToChange(new Date(value))}
        />
      </div>
    </div>
  );
};

export default TimeWindowEditor;
