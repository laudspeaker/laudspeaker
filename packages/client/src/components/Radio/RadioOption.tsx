import { RadioGroup, RadioOptionProps as ROProps } from "@headlessui/react";

type RadioOptionProps<T> = ROProps<any, T> & {
  radioText: string | React.ReactElement;
};

const RadioOption = <T,>({
  value,
  radioText,
  className,
  ...props
}: RadioOptionProps<T>) => {
  return (
    <RadioGroup.Option
      value={value}
      className={`flex items-center select-none ${className || ""}`}
      id="radioButton"
      {...props}
    >
      {({ checked }) => (
        <>
          <div
            className={`${
              checked ? "border-[#6366F1]" : "border-[#D9D9D9]"
            } w-[16px] h-[16px] border  rounded-full transition-all relative mr-2`}
          >
            <div
              className={`${
                checked ? "bg-[#6366F1]" : "bg-transparent"
              } w-[8px] h-[8px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full`}
            />
          </div>
          <div
            className={`font-roboto text-[14px] leading-[22px] text-[#000000D9]`}
          >
            {radioText}
          </div>
        </>
      )}
    </RadioGroup.Option>
  );
};

export default RadioOption;
