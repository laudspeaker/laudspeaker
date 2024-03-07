import { FC } from "react";
import { Select } from "antd";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
interface BasicSelectProps {
  defaultValue: string;
  options: { value: string; label: string }[];
}

const BasicSelect: FC<BasicSelectProps> = ({ defaultValue, options }) => {
  const handleChange = (value: string) => {
    console.log(`selected ${value}`);
  };

  return (
    <Select
      defaultValue={defaultValue}
      style={{ width: 90, borderRadius: "4px" }}
      onChange={handleChange}
      options={options}
      suffixIcon={<ArrowDropDownIcon style={{ fill: "black" }} />}
    />
  );
};

export default BasicSelect;
