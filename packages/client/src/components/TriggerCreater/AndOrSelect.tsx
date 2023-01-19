import { Select } from "components/Elements";
import React, { FC } from "react";

const andOrOptions: { value: "and" | "or" }[] = [
  { value: "and" },
  { value: "or" },
];

export interface AndOrSelectProps {
  value: "and" | "or";
  onChange: (value: "and" | "or") => void;
  disabled?: boolean;
}

const AndOrSelect: FC<AndOrSelectProps> = ({ value, onChange, disabled }) => {
  return (
    <Select
      value={value}
      options={andOrOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
};

export default AndOrSelect;
