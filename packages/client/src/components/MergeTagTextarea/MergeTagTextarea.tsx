import { Textarea } from "components/Elements";
import MergeTagPicker from "components/MergeTagPicker";
import TemplateTagPicker from "components/TemplateTagPicker";
import React, {
  ChangeEvent,
  FC,
  FocusEvent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useClickAway } from "react-use";

interface MergeTagTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  setValue: (value: string) => void;
  name: string;
  id: string;
  placeholder: string;
  isRequired?: boolean;
  labelShrink?: boolean;
  sx?: object;
  possibleAttributes: string[];
  textareaRef?: RefObject<HTMLTextAreaElement>;
  isPreview: boolean;
  setIsPreview: React.Dispatch<React.SetStateAction<boolean>>;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  viewerClassNames?: string;
  inputClassNames?: string;
}

const MergeTagTextarea: FC<MergeTagTextareaProps> = ({
  value,
  onChange,
  setValue,
  placeholder,
  name,
  id,
  possibleAttributes,
  isPreview,
  setIsPreview,
  textareaRef,
  onFocus,
  inputClassNames,
  viewerClassNames,
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
      .split(/([\{\[][\{\[].*?[\}\]][\}\]])/)
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
        return item;
      });

    setItems(nextItems);
  }, [value, possibleAttributes]);

  return (
    <div className="w-full m-0" ref={wrapperRef}>
      <div
        className={`${
          !isPreview && "hidden"
        } w-full bg-[#E5E5E5] max-w-full overflow-x-scroll py-[18px] px-[29px] z-[1000] rounded-lg text-[20px] whitespace-pre-line ${viewerClassNames}`}
        onClick={() => {
          setIsPreview(false);
        }}
        id={id}
        data-custominput-placeholder={placeholder}
      >
        {items.length > 0 ? (
          items
        ) : (
          <div className="h-[1.4375em] text-[20px] text-[#a3a4a5] pb-[2px] select-none">
            {placeholder}
          </div>
        )}
      </div>
      <Textarea
        isRequired
        value={value}
        placeholder={placeholder}
        name={name}
        id={id}
        className={`${
          isPreview && "hidden"
        } w-full !text-[20px] bg-[#E5E5E5] outline-none text-[#000] py-[18px] px-[29px] z-[1000] rounded-lg whitespace-pre-line ${inputClassNames}`}
        onChange={onChange}
        textareaRef={textareaRef}
        onFocus={onFocus}
      />
    </div>
  );
};

export default MergeTagTextarea;
