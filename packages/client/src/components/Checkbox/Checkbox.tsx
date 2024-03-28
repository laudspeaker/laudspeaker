import { useEffect, useState } from "react";

interface CheckBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string | React.ReactElement;
  initValue?: boolean;
  propControl?: boolean;
  onCheck: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckBox = ({
  text,
  className,
  initValue,
  propControl,
  onCheck,
  disabled,
  ...props
}: CheckBoxProps) => {
  const [checked, setChecked] = useState(!!initValue);

  const handleCheck = () => {
    if (!propControl) setChecked((prev) => !prev);
    onCheck(!checked);
  };

  useEffect(() => {
    if (propControl) {
      setChecked(!!initValue);
    }
  }, [initValue]);

  return (
    <div
      className={`flex items-center select-none ${
        disabled ? "pointer-events-none grayscale opacity-70" : ""
      } ${className || ""}`}
      onClick={handleCheck}
      {...props}
    >
      <>
        <div
          className={`${
            checked ? "border-[#6366F1] bg-[#6366F1]" : "border-[#D9D9D9]"
          } w-[16px] h-[16px] border  rounded-sm transition-all relative mr-2`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            className={`${
              checked ? "text-white" : "text-transparent"
            } font-bold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
          >
            <path
              d="M5.10533 7.60407L5.08771 7.62169L0.687866 3.22185L2.12054 1.78917L5.10539 4.77402L9.87941 0L11.3121 1.43268L5.12301 7.62175L5.10533 7.60407Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div
          className={`font-roboto text-[14px] leading-[22px] text-[#000000D9]`}
        >
          {text}
        </div>
      </>
    </div>
  );
};

export default CheckBox;
