import React from "react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import calendarSvg from "assets/images/calendar.svg";
import "./styles.css";

interface RangePickerProps {
  value: Date[];
  disabled?: boolean;
  onChange: (date: Date[]) => void;
}

const Wrapper = (props: RangePickerProps) => {
  const { value, disabled, onChange } = props;
  return (
    <>
      <DateRangePicker
        onChange={onChange}
        value={value}
        className={`${
          disabled ? "!select-none !cursor-auto !pointer-events-none" : ""
        } react-daterange-picker__wrapper react-daterange-picker__range-divider react-daterange-picker__clear-button`}
        calendarClassName={"react-daterange-picker__calendar"}
        clearIcon
        calendarIcon={<img src={calendarSvg} />}
        format={"MMM dd, yyyy"}
      />
    </>
  );
};

export default Wrapper;
