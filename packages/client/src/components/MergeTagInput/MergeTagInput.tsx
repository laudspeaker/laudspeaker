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
    <div className="w-full m-0 mb-[30px]" ref={wrapperRef}>
      <div
        className={`${
          !isPreview && "hidden"
        } w-full bg-[#E5E5E5] max-w-full overflow-x-scroll py-[18px] px-[29px] z-[1000] rounded-[8px] text-[20px] whitespace-nowrap `}
        onClick={() => {
          setIsPreview(false);
        }}
        data-custominput-placeholder={placeholder}
      >
        {items.length > 0 ? (
          items
        ) : (
          <div className="h-[1.4375em] text-[20px] text-[#a3a4a5] pb-[2px]">
            {placeholder}
          </div>
        )}
      </div>
      <Input
        isRequired
        value={value}
        placeholder={placeholder}
        name={name}
        id={id}
        fullWidth={fullWidth}
        className={`${
          isPreview && "hidden"
        } !text-[20px] bg-[#E5E5E5] outline-none text-[#000] py-[18px] px-[29px] z-[1000] rounded-[8px] whitespace-nowrap`}
        onChange={onChange}
        inputRef={inputRef}
      />
    </div>
  );
};

export default MergeTagInput;
