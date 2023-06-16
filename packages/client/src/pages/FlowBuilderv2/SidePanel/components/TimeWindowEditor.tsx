import React, { FC } from "react";

interface TimeWindowEditorProps {
  from: string;
  to: string;
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
    if (date > new Date(to)) {
      onChangeFrom(to);
      return;
    }

    onChangeFrom(date.toUTCString());
  };

  const handleToChange = (date: Date) => {
    if (date < new Date(from)) {
      onChangeTo(from);
      return;
    }

    onChangeTo(date.toUTCString());
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
        <div>Wait from</div>
        <input
          value={new Date(
            new Date(from).getTime() -
              new Date().getTimezoneOffset() * 60 * 1000
          )
            .toISOString()
            .slice(0, 16)}
          onChange={(e) => handleFromChange(new Date(e.target.value))}
          type="datetime-local"
          className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
          placeholder="Select time"
        />
      </div>
      <div className="flex justify-between items-center font-inter font-normal text-[14px] leading-[22px]">
        <div>To</div>
        <input
          value={new Date(
            new Date(to).getTime() - new Date().getTimezoneOffset() * 60 * 1000
          )
            .toISOString()
            .slice(0, 16)}
          onChange={(e) => handleToChange(new Date(e.target.value))}
          type="datetime-local"
          className="w-[200px] h-[32px] px-[12px] py-[5px] font-roboto text-[14px] leading-[22px] rounded-[2px] border-[1px] border-[#E5E7EB]"
          placeholder="Select time"
        />
      </div>
    </div>
  );
};

export default TimeWindowEditor;
