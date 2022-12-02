import { Select } from "components/Elements";
import React, { FC } from "react";

const andOrOptions = [{ value: "and" }, { value: "or" }];

export interface AndOrSelectProps {
  value: "and" | "or";
  onChange: (value: "and" | "or") => void;
}

const AndOrSelect: FC<AndOrSelectProps> = ({ value, onChange }) => {
  return <Select value={value} options={andOrOptions} onChange={onChange} />;
};

export default AndOrSelect;
