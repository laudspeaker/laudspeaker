import TagsInput from "react-tagsinput";
import CloseIcon from "@heroicons/react/20/solid/XMarkIcon";
import "./TagComponent.css";
import { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";

interface TagComponentProps {
  tags: string[];
  possibleTags?: string[];
  onInputChange?: (val: string) => void;
  onTagChange: (tags: string[]) => void;
  className?: string;
}

export default function TagComponent({
  tags,
  possibleTags = [],
  onTagChange,
  onInputChange = () => {},
  className = "",
}: TagComponentProps) {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const ref = useRef(null);

  useClickAway(ref, () => {
    setFocused(false);
  });

  const noTagsFound = focused && !possibleTags.length && inputValue;
  const noTags = focused && !possibleTags.length && !inputValue;
  const someTagsFound = focused && possibleTags.length;

  useEffect(() => {
    onInputChange(inputValue);
  }, [inputValue]);

  return (
    <div ref={ref} className="relative">
      <TagsInput
        onChange={(tgs) => {
          onTagChange(tgs);
          setInputValue("");
        }}
        value={tags}
        renderInput={(props) => (
          <input
            {...props}
            // @ts-ignore
            className={`${props.className} !max-w-[320px] w-full`}
            placeholder="Please select or enter keywords to create a new tag"
            onChange={(ev) => {
              props.onChange(ev);
              setInputValue(ev.target.value || "");
            }}
            onFocus={(ev) => {
              props.onFocus(ev);
              setFocused(true);
            }}
          />
        )}
        className={`${
          !tags.length && "pl-[12px]"
        } ${className} rounded-sm border border-gray-300 bg-white overflow-hidden p-1 react-tagsinput`}
        renderTag={(tag) => (
          <div
            className="rounded-sm h-[24px] mb-0 mr-[4px] bg-[#E5E7EB] inline-flex items-center py-[2px] pl-2 pr-[4px] select-none cursor-pointer text-[#111827]"
            onClick={() => tag.onRemove(tags.findIndex((el) => el === tag.tag))}
          >
            <span className="inline-block mr-[4px]  text-[12px] font-roboto leading-5">
              {tag.tag}
            </span>
            <CloseIcon className="w-[16px] h-[16px]" />
          </div>
        )}
      />
      {focused && (
        <div
          className={`${
            someTagsFound
              ? "overflow-y-scroll max-h-[200px]"
              : noTagsFound
              ? "max-w-[260px] h-[40px] items-center flex"
              : "max-w-[260px] h-[40px] items-center flex"
          } absolute transition-all rounded left-0 top-full z-[2] bg-white shadow-[0px_9px_28px_8px_rgba(0,0,0,0.05),0px_6px_16px_0px_rgba(0,0,0,0.08),0px_3px_6px_-4px_rgba(0,0,0,0.12);] w-full`}
        >
          {someTagsFound ? (
            possibleTags.map((el, i) => {
              const tagSelected = tags.includes(el);
              return (
                <div
                  key={i}
                  className={`${
                    tagSelected ? "bg-[#EEF2FF]" : ""
                  } text-[#111827] hover:bg-[#F3F4F6] text-[14px] font-roboto w-full px-[12px] py-[5px] cursor-pointer flex justify-between items-center`}
                  onClick={() => {
                    if (tagSelected) {
                      const index = tags.findIndex((tg) => tg === el);
                      const newTags = [...tags];
                      newTags.splice(index, 1);
                      onTagChange(newTags);
                    } else onTagChange([...tags, el]);
                  }}
                >
                  {el}
                  {tagSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M11.3578 1.6875H10.4216C10.2904 1.6875 10.1658 1.74777 10.0855 1.85089L4.56358 8.84598L1.91581 5.49107C1.87576 5.44022 1.82471 5.3991 1.76648 5.3708C1.70826 5.3425 1.64439 5.32776 1.57965 5.32768H0.643492C0.55376 5.32768 0.504207 5.4308 0.559117 5.50045L4.22742 10.1478C4.39885 10.3647 4.72831 10.3647 4.90108 10.1478L11.4422 1.85893C11.4971 1.79063 11.4475 1.6875 11.3578 1.6875Z"
                        fill="#6366F1"
                      />
                    </svg>
                  )}
                </div>
              );
            })
          ) : noTagsFound ? (
            <span className="px-[12px] py-[10px] text-[#4B5563] leading-[22px] text-[14px]">
              No matching tags
            </span>
          ) : (
            <span className="px-[12px] py-[10px] text-[#4B5563] leading-[22px] text-[14px]">
              No tags, enter to create a new tag
            </span>
          )}
        </div>
      )}
    </div>
  );
}
