import React, { ReactNode } from "react";
import {
  Select as MuiSelect,
  SelectChangeEvent,
  InputLabel,
} from "@mui/material";
import { ElementType } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export interface SelectProps {
  value: any;
  id: string;
  name?: string;
  autoWidth?: boolean;
  children?: React.ReactNode;
  customClass?: Object;
  defaultOpen?: boolean;
  defaultValue?: any;
  displayEmpty?: boolean;
  arrowIcon?: ElementType;
  input?: React.ReactElement;
  inputProps?: object;
  label?: string | ReactNode;
  labelId?: string;
  labelShrink?: boolean;
  MenuProps?: object;
  multipleSelections?: boolean;
  placeholder?: string;
  // native?: boolean,
  isOpen?: boolean;
  sx?: object;
  variant?: "filled" | "outlined" | "standard";
  // SelectDisplayProps?: boolean,
  // renderValue?: ReactNode,
  onChange: (e: SelectChangeEvent) => void;
  onClose?: (e: object) => void;
  onOpen?: (e: object) => void;
  renderValue?: (value: any) => React.ReactNode;
}

const Select = (props: SelectProps) => {
  const {
    value,
    children,
    autoWidth,
    customClass,
    defaultOpen,
    defaultValue,
    displayEmpty,
    arrowIcon = KeyboardArrowDownIcon,
    id,
    name,
    input,
    inputProps,
    label,
    labelId,
    labelShrink,
    multipleSelections,
    isOpen,
    sx,
    variant = "standard",
    placeholder,
    onChange,
    onClose,
    onOpen,
    renderValue,
  } = props;
  return (
    <>
      {label && (
        <InputLabel id={id} shrink={labelShrink}>
          {label}
        </InputLabel>
      )}
      <MuiSelect
        id={id}
        value={value}
        autoWidth={autoWidth}
        classes={customClass}
        defaultOpen={defaultOpen}
        defaultValue={defaultValue}
        displayEmpty={displayEmpty}
        IconComponent={arrowIcon}
        input={input}
        inputProps={inputProps}
        label={label}
        labelId={labelId}
        multiple={multipleSelections}
        open={isOpen}
        sx={sx}
        variant={variant}
        placeholder={placeholder}
        onChange={onChange}
        onClose={onClose}
        onOpen={onOpen}
        renderValue={renderValue}
        name={name}
      >
        {children}
      </MuiSelect>
    </>
  );
};

export default Select;
