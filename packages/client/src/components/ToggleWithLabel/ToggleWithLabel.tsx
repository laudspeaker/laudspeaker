import { useState } from "react";
import { Switch } from "@headlessui/react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface IToggleWithLabelProps {
  label: string;
  default: boolean;
}

const ToggleWithLabel = (props: IToggleWithLabelProps) => {
  const [enabled, setEnabled] = useState<boolean>(props.default);
  return (
    <Switch.Group
      as="div"
      className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-b sm:border-gray-200 sm:py-5"
    >
      <Switch.Label
        as="dt"
        className="text-sm font-medium text-gray-500"
        passive
      >
        {props.label}
      </Switch.Label>
      <dd className="mt-1 flex text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={classNames(
            enabled ? "bg-purple-600" : "bg-gray-200",
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-auto"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              enabled ? "translate-x-5" : "translate-x-0",
              "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            )}
          />
        </Switch>
      </dd>
    </Switch.Group>
  );
};

export default ToggleWithLabel;
