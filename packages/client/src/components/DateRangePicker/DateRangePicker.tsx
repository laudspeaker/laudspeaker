import React from "react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import calendarSvg from "assets/images/calendar.svg";
import "./styles.css";

interface RangePickerProps {
  value: Date[];
  onChange: (e: any) => void;
}

const Wrapper = (props: RangePickerProps) => {
  const { value, onChange } = props;
  return (
    <>
      <DateRangePicker
        onChange={onChange}
        value={value}
        className={
          "react-daterange-picker__wrapper react-daterange-picker__range-divider react-daterange-picker__clear-button"
        }
        calendarClassName={"react-daterange-picker__calendar"}
        clearIcon
        calendarIcon={<img src={calendarSvg} />}
        format={"MMM dd, yyyy"}
      />
    </>
  );
};

export default Wrapper;
