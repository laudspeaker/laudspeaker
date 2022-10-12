import { Box, Typography } from "@mui/material";
import { Input } from "components/Elements";
import React, { useEffect, useState, RefObject, useRef } from "react";
import MergeTagPicker from "../MergeTagPicker/MergeTagPicker";
import { useClickAway } from "react-use";

interface CustomInputProps {
  value: string;
  onChange: (e: any) => void;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  id: string;
  placeholder: string;
  isRequired?: boolean;
  fullWidth?: boolean;
  labelShrink?: any;
  sx?: any;
  possibleAttributes: string[];
  ref?: RefObject<HTMLInputElement | undefined>;
  isPreview: boolean;
  setIsPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomInput = ({
  value,
  onChange,
  setValue,
  placeholder,
  name,
  id,
  fullWidth,
  labelShrink,
  sx,
  possibleAttributes,
  isPreview,
  setIsPreview,
  ref,
}: CustomInputProps) => {
  const [items, setItems] = useState<(string | JSX.Element)[]>([]);
  const handleValueReplace = (regExp: RegExp | string, str: string) => {
    setValue(value.replace(regExp, str));
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useClickAway(wrapperRef, (e) => {
    setIsPreview(true);
  });

  useEffect(() => {
    const nextItems = value.split(/(\{\{.*?\}\})/).map((item, index) => {
      if (item.match(/{{(.*?)}}/)) {
        const itemContent = item.replace("{{", "").replace("}}", "");
        return (
          <MergeTagPicker
            tagContent={itemContent}
            key={index}
            possibleAttributes={possibleAttributes}
            handleValueReplace={handleValueReplace}
          />
        );
      }
      return item;
    });
    setItems(nextItems);
  }, [value]);

  return (
    <Box
      sx={{ position: "relative", width: "100%", margin: "0" }}
      ref={wrapperRef}
    >
      {isPreview ? (
        <Box
          sx={{
            position: "absolute",
            zIndex: 1000,
            padding: "18px 29px",
            backgroundColor: "#EFF0F2",
            borderRadius: "8px",
            fontSize: "1rem",
          }}
          onClick={() => {
            setIsPreview(false);
          }}
        >
          {items}
        </Box>
      ) : (
        <Input
          isRequired
          value={value}
          placeholder={placeholder}
          name={name}
          id={id}
          fullWidth={fullWidth}
          onChange={onChange}
          labelShrink={labelShrink}
          sx={sx}
          ref={ref}
        />
      )}
    </Box>
  );
};

export default CustomInput;
