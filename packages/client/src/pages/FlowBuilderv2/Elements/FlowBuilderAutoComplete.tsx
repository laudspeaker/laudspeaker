import { Combobox } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { useDebounce } from "react-use";

interface FlowBuilderAutoCompleteProps<T = unknown> {
  value: T;
  getItems: (query: string) => Promise<T[]>;
  // items: T[];
  retrieveLabel: (item: T) => string;
  onQueryChange: (query: string) => void;
  onSelect: (value: T) => void;
  placeholder?: string;
}

const FlowBuilderAutoComplete = <T,>({
  value,
  getItems,
  retrieveLabel,
  onQueryChange,
  onSelect,
  placeholder,
}: FlowBuilderAutoCompleteProps<T>) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    onQueryChange(query);
  }, [query]);

  useDebounce(
    () => {
      (async () => {
        setItems(await getItems(query));
      })();
    },
    100,
    [query]
  );

  return (
    <div className="relative">
      <Combobox value={value} onChange={onSelect}>
        <Combobox.Input
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border-[1px] border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] focus:border-[#6366F1]"
        />
        <Combobox.Options className="translate-y-[4px] absolute w-full">
          <div className="py-[4px] bg-white rounded-[2px]">
            {items.map((item) => (
              <Combobox.Option
                key={retrieveLabel(item)}
                value={item}
                className="px-[12px] py-[5px] hover:bg-[#F3F4F6] select-none cursor-pointer"
              >
                {retrieveLabel(item)}
              </Combobox.Option>
            ))}
          </div>
        </Combobox.Options>
      </Combobox>
    </div>
  );
};

export default FlowBuilderAutoComplete;
