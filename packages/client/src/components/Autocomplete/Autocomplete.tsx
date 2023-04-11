import React, { ChangeEvent, Fragment, ReactNode, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

export interface AutocompleteProps<T> {
  inputValue: string;
  inputId: string;
  items: T[];
  label?: string;
  disabled?: boolean;
  showSelectIcon?: boolean;
  customLabelClassNames?: string;
  customInputClassNames?: string;
  customOptionClassNames?: string;
  inputWrapperClassNames?: string;
  wrapperClassNames?: string;
  optionRender: (el: T) => string | ReactNode;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOptionSelect: (opt: T) => void;
  optionKey: (el: T) => string;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Autocomplete = <T extends any>({
  items,
  label,
  inputId,
  inputValue,
  disabled = false,
  showSelectIcon = false,
  customInputClassNames = "",
  customLabelClassNames = "",
  customOptionClassNames = "",
  inputWrapperClassNames = "",
  wrapperClassNames = "",
  optionKey,
  onInputChange,
  optionRender,
  onOptionSelect,
}: AutocompleteProps<T>) => {
  const comboBtnRef = useRef<HTMLButtonElement>(null);

  const handleInputFocus = () => comboBtnRef.current?.click();

  return (
    <div className={`${wrapperClassNames} relative`}>
      <Combobox disabled={disabled} value={inputValue}>
        {label && (
          <Combobox.Label
            className={`${customLabelClassNames} block text-sm font-medium text-gray-700 max-w-[200px]`}
          >
            {label}
          </Combobox.Label>
        )}
        <div className={`${inputWrapperClassNames} relative`}>
          <Combobox.Input
            id={inputId}
            onChange={disabled ? () => null : onInputChange}
            value={inputValue}
            className={`${customInputClassNames} relative min-h-[30px] border-transparent cursor-pointer w-full rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-300 sm:text-sm`}
            onFocus={handleInputFocus}
            autoComplete="off"
          />
          <Combobox.Button
            className={`${
              !showSelectIcon && "hidden"
            } absolute inset-y-0 right-0 flex items-center pr-2`}
            ref={comboBtnRef}
          >
            <ChevronUpDownIcon className="text-gray-400 h-5 w-5" />
          </Combobox.Button>
        </div>
        <Combobox.Options
          className={`${
            !items.length && "hidden"
          } max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]`}
        >
          {items.map((el) => (
            <Combobox.Option
              key={optionKey(el)}
              value={optionKey(el)}
              as={Fragment}
              disabled={disabled}
            >
              {() => (
                <li
                  className={`${customOptionClassNames} bg-white text-black select-none cursor-pointer hover:bg-cyan-100`}
                  onClick={() => onOptionSelect(el)}
                >
                  {optionRender(el)}
                </li>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
};

export default Autocomplete;
