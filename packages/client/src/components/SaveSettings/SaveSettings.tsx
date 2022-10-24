interface ISaveSettingsProps {
  onClick: () => void;
}

const SaveSettings = (props: ISaveSettingsProps) => {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:pt-5">
      <span className="flex-grow">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md bg-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          {...props}
        >
          Save
        </button>
      </span>
    </div>
  );
};

export default SaveSettings;
