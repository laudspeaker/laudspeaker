import { Combobox } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { useDebounce } from "react-use";

interface ItemsSetter<T> {
  type: "setter";
  getItems: (query: string) => Promise<T[]>;
}

interface ItemsGetter<T> {
  type: "getter";
  items: T[];
}

interface AutoCompleteProps<T = unknown> {
  initialValue?: string;
  value: T;
  retrieveLabel: (item: T) => string;
  onQueryChange: (query: string) => void;
  onSelect: (value: T) => void;
  placeholder?: string;
  noDataFoundPlaceholder?: string;
  includedItems: ItemsSetter<T> | ItemsGetter<T>;
  getKey?: (item: T) => string;
  inputDataTestId?: string;
}

const AutoComplete = <T,>({
  initialValue,
  value,
  includedItems,
  retrieveLabel,
  onQueryChange,
  onSelect,
  placeholder,
  noDataFoundPlaceholder = "",
  getKey,
  inputDataTestId,
}: AutoCompleteProps<T>) => {
  const [query, setQuery] = useState(initialValue || "");
  const [items, setItems] = useState<T[]>(
    includedItems.type === "getter" ? includedItems.items : []
  );

  useEffect(() => {
    onQueryChange(query);
  }, [query]);

  useDebounce(
    () => {
      if (includedItems.type === "getter") {
        setItems(includedItems.items);
      } else {
        (async () => {
          if (includedItems.type === "setter")
            setItems(await includedItems.getItems(query));
        })();
      }
    },
    100,
    [query, includedItems]
  );

  return (
    <div className="relative w-full">
      <Combobox
        value={value}
        onChange={(val) => {
          onSelect(val);
          if (getKey) {
            setQuery(getKey(val));
          }
        }}
      >
        <Combobox.Input
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full px-[12px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] focus:border-[#6366F1]"
          id="autoCompleteInput"
          data-testid={inputDataTestId}
        />
        <Combobox.Options className="translate-y-[4px] absolute w-full border z-[99999999]">
          <div className="py-[4px] bg-white rounded-sm">
            {items.length === 0 && (
              <span className="text-[14px] block px-[10px] py-[5px] font-inter leading-[22px] text-[#4B5563]">
                {noDataFoundPlaceholder}
              </span>
            )}
            {items.map((item) => (
              <Combobox.Option
                data-testid={`combobox-option-${item}`}
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

export default AutoComplete;
