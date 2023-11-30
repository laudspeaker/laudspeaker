import { Input } from "components/Elements";
import React, {
  useEffect,
  useState,
  RefObject,
  useRef,
  ChangeEvent,
  FocusEvent,
  FC,
} from "react";
import MergeTagPicker from "../MergeTagPicker/MergeTagPicker";
import { useClickAway } from "react-use";
import TemplateTagPicker from "components/TemplateTagPicker";
import ApiCallTagPicker from "components/ApiCallTagPicker";

interface MergeTagInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
  name: string;
  id: string;
  placeholder: string;
  isRequired?: boolean;
  fullWidth?: boolean;
  labelShrink?: boolean;
  sx?: object;
  viewerClassNames?: string;
  inputClassNames?: string;
  placeholderClassNames?: string;
  possibleAttributes: string[];
  inputRef?: RefObject<HTMLInputElement>;
  isPreview: boolean;
  setIsPreview: (state: boolean) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
}

const MergeTagInput: FC<MergeTagInputProps> = ({
  value,
  onChange,
  setValue,
  placeholder,
  name,
  id,
  fullWidth,
  possibleAttributes,
  isPreview,
  inputClassNames = "",
  viewerClassNames = "",
  placeholderClassNames = "",
  setIsPreview,
  inputRef,
  onFocus,
}) => {
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

    const nextItems = value
      .split(/([\{\[]\{?[\{\[].*?[\}\]]\}?[\}\]])/)
      .map((item, index) => {
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

        if (
          item.match(
            /\[\[\s(email|sms|slack|firebase);[a-zA-Z0-9-\s]+;[a-zA-Z]+\s\]\]/g
          )
        ) {
          const itemContent = item.replace("[[", "").replace("]]", "");

          return (
            <TemplateTagPicker
              itemContent={itemContent}
              handleValueReplace={handleValueReplace}
            />
          );
        }

        if (item.match(/\[\{\[\s[^\s]+;[^\s]+\s\]\}\]/)) {
          const itemContent = item.replace("[{[", "").replace("]}]", "");

          return (
            <ApiCallTagPicker
              itemContent={itemContent}
              handleValueReplace={handleValueReplace}
            />
          );
        }

        return item;
      });

    setItems(nextItems);
  }, [value, possibleAttributes]);

  return (
    <div className="w-full m-0" ref={wrapperRef}>
      {isPreview && (
        <div
          className={`${
            !isPreview && "hidden"
          } ${viewerClassNames} w-full bg-[#E5E5E5] max-w-full overflow-x-scroll py-[18px] px-[29px] z-[1000] rounded-lg text-[20px] whitespace-nowrap `}
          onClick={() => {
            setIsPreview(false);
          }}
          data-custominput-placeholder={placeholder}
          id={id}
        >
          {items.length > 0 ? (
            items
          ) : (
            <div
              className={`${placeholderClassNames} h-[1.4375em] text-[20px] text-[#a3a4a5] pb-[2px] select-none`}
            >
              {placeholder}
            </div>
          )}
        </div>
      )}
      <Input
        isRequired
        value={value}
        placeholder={placeholder}
        name={name}
        id={id}
        fullWidth={fullWidth}
        className={`${
          isPreview && "hidden"
        } ${inputClassNames} !text-[20px] bg-[#E5E5E5] outline-none text-[#000] py-[18px] px-[29px] z-[1000] rounded-lg whitespace-nowrap`}
        onChange={onChange}
        inputRef={inputRef}
        onFocus={onFocus}
      />
    </div>
  );
};

export default MergeTagInput;
