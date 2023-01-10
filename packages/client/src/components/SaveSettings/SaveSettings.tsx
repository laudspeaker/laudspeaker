import { GenericButton } from "components/Elements";
import { ReactNode } from "react";

interface ISaveSettingsProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  additionalButtons?: ReactNode;
}

const SaveSettings = (props: ISaveSettingsProps) => {
  const { additionalButtons, ...otherProps } = props;
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:pt-5">
      <span className="flex flex-grow gap-[10px]">
        <GenericButton
          customClasses={`inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
            props.disabled ? "grayscale" : ""
          }`}
          {...otherProps}
        >
          Save
        </GenericButton>
        {additionalButtons}
      </span>
    </div>
  );
};

export default SaveSettings;
