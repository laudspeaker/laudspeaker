import { Box } from "@mui/material";
import { Input } from "components/Elements";
import React, { useEffect, useState, RefObject, useRef } from "react";
import MergeTagPicker from "../MergeTagPicker/MergeTagPicker";
import { useClickAway } from "react-use";

interface MergeTagInputProps {
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
  inputRef?: RefObject<HTMLInputElement | undefined>;
  isPreview: boolean;
  setIsPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

const MergeTagInput = ({
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
  inputRef,
}: MergeTagInputProps) => {
  const [items, setItems] = useState<(string | JSX.Element)[]>([]);
  const handleValueReplace = (regExp: RegExp | string, str: string) => {
    setValue(value.replace(regExp, str));
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useClickAway(wrapperRef, () => {
    setTimeout(() => {
      setIsPreview(true);
    }, 100);
  });

  useEffect(() => {
    if (!value) {
      setItems([]);
      return;
    }

    const nextItems = value.split(/(\{\{.*?\}\})/).map((item, index) => {
      if (item.match(/{{(.*?)}}/)) {
        const itemContent = item.replace("{{", "").replace("}}", "");
        return (
          <MergeTagPicker
            tagContent={itemContent}
            key={index}
            possibleAttributes={possibleAttributes.map(
              (str) => " " + str + " "
            )}
            handleValueReplace={handleValueReplace}
          />
        );
      }
      return item;
    });

    setItems(nextItems);
  }, [value, possibleAttributes]);

  return (
    <Box
      sx={{ width: "100%", margin: "0", marginBottom: "30px" }}
      ref={wrapperRef}
    >
      <Box
        sx={{
          ...(isPreview ? {} : { display: "none" }),
          width: "100%",
          maxWidth: "100%",
          overflowX: "scroll",
          paddingRight: "20px",
          zIndex: 1000,
          padding: "18px 29px",
          backgroundColor: "#EFF0F2",
          borderRadius: "8px",
          fontSize: "20px",
          whiteSpace: "nowrap",
        }}
        onClick={() => {
          setIsPreview(false);
        }}
      >
        {items.length > 0 ? (
          items
        ) : (
          <Box
            sx={{
              height: "1.4375em",
              fontSize: "20px",
              color: "#a3a4a5",
              paddingBottom: 2,
            }}
          >
            {placeholder}
          </Box>
        )}
      </Box>
      <Input
        isRequired
        value={value}
        placeholder={placeholder}
        name={name}
        id={id}
        fullWidth={fullWidth}
        onChange={onChange}
        labelShrink={labelShrink}
        sx={{ ...sx, ...(isPreview ? { display: "none" } : {}) }}
        inputRef={inputRef}
      />
    </Box>
  );
};

export default MergeTagInput;
