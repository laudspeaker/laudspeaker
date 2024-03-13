import { Popover } from "@headlessui/react";
import XCircle from "@heroicons/react/24/solid/XCircleIcon";
import React, { ReactNode, useCallback, useRef } from "react";

interface SelectProps<T, U = any> {
  value: T;
  options: {
    key: T;
    title: string | ReactNode;
    groupLabel?: boolean;
    nonSelectable?: boolean;
    additionalData?: U;
  }[];
  onChange: (value: T, i?: number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  isLoading?: boolean;
  searchValue?: string;
  renderCustomOption?: (
    props: { className: string; onClick: () => void; "data-option": T },
    data?: U
  ) => React.ReactNode;
  onSearchValueChange?: (value: string) => void;
  onScrollToEnd?: () => void;
  buttonClassName?: string;
  buttonInnerWrapperClassName?: string;
  panelClassName?: string;
  noDataPlaceholder?: string;
  customBTN?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  dataTestId?: string;
}

const Select = <T, U = any>({
  value,
  options,
  onChange,
  placeholder,
  className,
  buttonClassName,
  panelClassName,
  noDataPlaceholder,
  id,
  isLoading,
  onSearchValueChange,
  onScrollToEnd,
  renderCustomOption,
  searchValue,
  searchPlaceholder,
  buttonInnerWrapperClassName,
  customBTN,
  disabled,
  dataTestId,
}: SelectProps<T, U>) => {
  const scrollableRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (scrollableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
      if (scrollTop + clientHeight >= scrollHeight) {
        onScrollToEnd?.();
      }
    }
  }, [onScrollToEnd]);

  return (
    <Popover
      className={`relative w-full font-roboto font-normal text-[14px] leading-[22px] text-[#111827] ${
        className ? className : ""
      }`}
      data-testid={`${dataTestId}-popover`}
    >
      {({ close }) => (
        <>
          <Popover.Button
            className={`${buttonClassName ?? ""}`}
            id={id}
            disabled={disabled}
            data-testid={`${dataTestId}-button`}
          >
            {customBTN ?? (
              <div
                className={`${
                  buttonInnerWrapperClassName || ""
                } border border-[#E5E7EB] rounded-sm ${
                  disabled ? "bg-[#F3F4F6] select-none" : "bg-white"
                } px-[12px] py-[4px] flex items-center justify-between gap-[6px]`}
              >
                <div
                  className={`${
                    value ? "text-ellipsis" : "text-muted"
                  } max-w-full overflow-hidden  whitespace-nowrap`}
                >
                  {options.find((option) => option.key === value)?.title ||
                    placeholder}
                </div>
                <div>
                  <svg
                    width="11"
                    height="8"
                    viewBox="0 0 11 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.8919 0.572271H9.88744C9.81914 0.572271 9.75485 0.605754 9.71467 0.660664L5.90976 5.90531L2.10485 0.660664C2.06467 0.605754 2.00038 0.572271 1.93208 0.572271H0.927617C0.840563 0.572271 0.789671 0.671379 0.840563 0.742361L5.56289 7.25263C5.73431 7.48834 6.08521 7.48834 6.2553 7.25263L10.9776 0.742361C11.0299 0.671379 10.979 0.572271 10.8919 0.572271Z"
                      fill="#9CA3AF"
                    />
                  </svg>
                </div>
              </div>
            )}
          </Popover.Button>

          <Popover.Panel
            className={`absolute translate-y-[5px] z-10 shadow-[0px_9px_28px_8px_rgba(0,_0,_0,_0.05),_0px_6px_16px_0px_rgba(0,_0,_0,_0.08),_0px_3px_6px_-4px_rgba(0,_0,_0,_0.12)] ${
              panelClassName ? panelClassName : ""
            }`}
            data-testid={`${dataTestId}-panel`}
          >
            <div className="bg-white py-[4px] max-w-full">
              {searchValue !== undefined && (
                <div className="p-[10px] relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="absolute top-[19px] left-[22px] pointer-events-none"
                  >
                    <g clipPath="url(#clip0_174_28917)">
                      <path
                        d="M13.2127 12.3535L9.15493 8.2957C9.78462 7.48164 10.1252 6.48633 10.1252 5.43945C10.1252 4.18633 9.63618 3.01133 8.75181 2.12539C7.86743 1.23945 6.68931 0.751953 5.43774 0.751953C4.18618 0.751953 3.00806 1.24102 2.12368 2.12539C1.23774 3.00977 0.750244 4.18633 0.750244 5.43945C0.750244 6.69102 1.23931 7.86914 2.12368 8.75352C3.00806 9.63945 4.18462 10.127 5.43774 10.127C6.48462 10.127 7.47837 9.78633 8.29243 9.1582L12.3502 13.2145C12.3621 13.2264 12.3763 13.2358 12.3918 13.2422C12.4074 13.2487 12.424 13.252 12.4409 13.252C12.4577 13.252 12.4744 13.2487 12.4899 13.2422C12.5055 13.2358 12.5196 13.2264 12.5315 13.2145L13.2127 12.5348C13.2246 12.5229 13.2341 12.5087 13.2405 12.4932C13.247 12.4776 13.2503 12.461 13.2503 12.4441C13.2503 12.4273 13.247 12.4106 13.2405 12.3951C13.2341 12.3795 13.2246 12.3654 13.2127 12.3535ZM7.91274 7.91445C7.25024 8.57539 6.37212 8.93945 5.43774 8.93945C4.50337 8.93945 3.62524 8.57539 2.96274 7.91445C2.30181 7.25195 1.93774 6.37383 1.93774 5.43945C1.93774 4.50508 2.30181 3.62539 2.96274 2.96445C3.62524 2.30352 4.50337 1.93945 5.43774 1.93945C6.37212 1.93945 7.25181 2.30195 7.91274 2.96445C8.57368 3.62695 8.93774 4.50508 8.93774 5.43945C8.93774 6.37383 8.57368 7.25352 7.91274 7.91445Z"
                        fill="#9CA3AF"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_174_28917">
                        <rect width="14" height="14" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <input
                    type="text"
                    placeholder={searchPlaceholder || "value"}
                    value={searchValue}
                    onChange={(e) =>
                      onSearchValueChange?.(e.target.value || "")
                    }
                    className="w-full max-h-[32px] pl-[30px] pr-[26px] py-[5px] font-inter font-normal text-[14px] leading-[22px] border border-[#E5E7EB] placeholder:font-inter placeholder:font-normal placeholder:text-[14px] placeholder:leading-[22px] placeholder:text-[#9CA3AF] rounded-sm"
                    data-testid="select-input"
                  />
                  {!!searchValue.length && (
                    <XCircle
                      className="absolute w-[18px] h-[18px] right-[17px] top-[17px] cursor-pointer"
                      onClick={() => onSearchValueChange?.("")}
                    />
                  )}
                </div>
              )}
              {isLoading ? (
                <div className="py-[5px] px-[10px] flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="31"
                    height="30"
                    viewBox="0 0 31 30"
                    fill="none"
                    className="animate-spin"
                  >
                    <g clipPath="url(#clip0_174_28645)">
                      <path
                        d="M15.5 30C13.4756 30 11.5098 29.6045 9.66113 28.8223C7.87402 28.0664 6.27148 26.9824 4.89453 25.6055C3.51758 24.2285 2.43359 22.626 1.67773 20.8389C0.895508 18.9902 0.5 17.0244 0.5 15C0.5 14.417 0.97168 13.9453 1.55469 13.9453C2.1377 13.9453 2.60938 14.417 2.60938 15C2.60938 16.7402 2.94922 18.4277 3.62305 20.0186C4.27344 21.5537 5.20215 22.9336 6.38574 24.1172C7.56934 25.3008 8.94922 26.2324 10.4844 26.8799C12.0723 27.5508 13.7598 27.8906 15.5 27.8906C17.2402 27.8906 18.9277 27.5508 20.5186 26.877C22.0537 26.2266 23.4336 25.2979 24.6172 24.1143C25.8008 22.9307 26.7324 21.5508 27.3799 20.0156C28.0508 18.4277 28.3906 16.7402 28.3906 15C28.3906 13.2598 28.0508 11.5723 27.377 9.98145C26.7288 8.44998 25.7907 7.05824 24.6143 5.88281C23.4401 4.70483 22.0481 3.76651 20.5156 3.12012C18.9277 2.44922 17.2402 2.10938 15.5 2.10938C14.917 2.10938 14.4453 1.6377 14.4453 1.05469C14.4453 0.47168 14.917 0 15.5 0C17.5244 0 19.4902 0.395508 21.3389 1.17773C23.126 1.93359 24.7285 3.01758 26.1055 4.39453C27.4824 5.77148 28.5635 7.37695 29.3193 9.16113C30.1016 11.0098 30.4971 12.9756 30.4971 15C30.4971 17.0244 30.1016 18.9902 29.3193 20.8389C28.5664 22.626 27.4824 24.2285 26.1055 25.6055C24.7285 26.9824 23.123 28.0635 21.3389 28.8193C19.4902 29.6045 17.5244 30 15.5 30Z"
                        fill="#9CA3AF"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_174_28645">
                        <rect
                          width="30"
                          height="30"
                          fill="white"
                          transform="translate(0.5)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              ) : options.length === 0 ? (
                <div className="px-[12px] py-[5px] select-none text-[#4B5563] font-inter text-[14px] leading-[22px]">
                  {noDataPlaceholder}
                </div>
              ) : (
                <div
                  className="h-full max-h-[344px] overflow-y-auto"
                  ref={scrollableRef}
                  onScroll={handleScroll}
                >
                  {options.map((option, i) => {
                    const props = {
                      className: `${
                        option.groupLabel
                          ? "bg-[#F3F4F6] !py-[2px] !cursor-auto !text-[#4B5563] leading-5 font-inter !text-[12px]"
                          : ""
                      }
                      ${
                        option.nonSelectable
                          ? "hover:bg-white !cursor-auto"
                          : ""
                      }
                      overflow-hidden text-ellipsis whitespace-nowrap px-[12px] py-[5px] hover:bg-[#F3F4F6] select-none cursor-pointer`,
                      onClick: () => {
                        if (option.groupLabel || option.nonSelectable) return;

                        onChange(option.key, i);
                        close();
                      },
                      ["data-option"]: option.key,
                    };

                    return (
                      <React.Fragment key={i}>
                        {renderCustomOption ? (
                          renderCustomOption(props, option.additionalData)
                        ) : (
                          <div
                            {...props}
                            data-testid={`${dataTestId}-option-${option.title}`}
                          >
                            {option.title}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export default Select;
