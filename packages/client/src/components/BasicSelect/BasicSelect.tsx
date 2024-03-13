import { FC } from "react";
import { Select } from "antd";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
interface BasicSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const BasicSelect: FC<BasicSelectProps> = ({ value, onChange, options }) => {
  return (
    <Select
      value={value}
      style={{ width: 90, borderRadius: "4px" }}
      onChange={onChange}
      options={options}
      suffixIcon={<ArrowDropDownIcon style={{ fill: "black" }} />}
    />
  );
};

export default BasicSelect;
