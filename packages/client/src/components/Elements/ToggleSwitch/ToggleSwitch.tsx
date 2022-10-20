import XMarkIcon from "@heroicons/react/20/solid/XMarkIcon";
import CheckIcon from "@heroicons/react/20/solid/CheckIcon";
import { Switch as HeadlessSwitch } from "@headlessui/react";

export default function ToggleSwitch({ checked, onChange }: any) {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onChange}
      className={`${checked ? "bg-[#223343]" : "bg-[#e5e7eb]"}
          relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`${checked ? "translate-x-full" : "translate-x-0"}
            relative pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {checked ? (
            <CheckIcon className="w-[12px] h-[12px]" />
          ) : (
            <XMarkIcon className="w-[12px] h-[12px]" />
          )}
        </span>
      </span>
    </HeadlessSwitch>
  );
}
