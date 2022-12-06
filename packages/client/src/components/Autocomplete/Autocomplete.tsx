import React, { ChangeEvent, FC } from "react";
import AC from "react-autocomplete";

export interface AutocompleteProps {
  value: string;
  items: string[];
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSelect: (str: string) => void;
}

const Autocomplete: FC<AutocompleteProps> = ({
  value,
  items,
  onChange,
  onSelect,
}) => {
  return (
    <AC
      getItemValue={(item) => item.label}
      items={items}
      renderItem={(item, isHighlighted) => (
        <div style={{ background: isHighlighted ? "lightgray" : "white" }}>
          {item}
        </div>
      )}
      value={value}
      onChange={onChange}
      onSelect={onSelect}
    />
  );
};

export default Autocomplete;
