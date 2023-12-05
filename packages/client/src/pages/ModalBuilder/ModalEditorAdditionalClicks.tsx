import { EditorMenuOptions } from "./ModalEditorMainMenu";
import LinkSVG from "@heroicons/react/20/solid/ArrowTopRightOnSquareIcon";
import NoSymbolIcon from "@heroicons/react/20/solid/NoSymbolIcon";
import { AdditionalClickOptions, ModalState, SubMenuOptions } from "./types";
import { GenericButton } from "components/Elements";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { IAdditionalActionData } from "./ModalEditor";

interface IModalEditorAdditionalClicksProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
  handleBackClick: () => void;
}

export const AdditionalClickOptionsRecord = {
  [AdditionalClickOptions.NOACTION]: {
    icon: <NoSymbolIcon />,
    name: "No action",
    pageType: null,
    action: AdditionalClickOptions.NOACTION,
  },
  [AdditionalClickOptions.OPENURL]: {
    icon: <LinkSVG />,
    name: "Open URL",
    pageType: SubMenuOptions.OpenUrl,
    action: AdditionalClickOptions.OPENURL,
  },
};

const AdditionClickMenu = [
  {
    blockLabel: "",
    options: [
      { ...AdditionalClickOptionsRecord[AdditionalClickOptions.NOACTION] },
    ],
  },
  {
    blockLabel: "Navigation",
    options: [
      { ...AdditionalClickOptionsRecord[AdditionalClickOptions.OPENURL] },
    ],
  },
];

const ModalEditorAdditionalClicks = ({
  modalState,
  setModalState,
  onOptionPick,
  actionData,
  handleBackClick,
  currentMainMode,
}: IModalEditorAdditionalClicksProps) => {
  const handleOptionClick = (
    page: SubMenuOptions | null,
    action: AdditionalClickOptions
  ) => {
    return () => {
      if (page === null && action === AdditionalClickOptions.NOACTION) {
        if (actionData[currentMainMode]) {
          for (const key in actionData[currentMainMode]) {
            actionData[currentMainMode][key as AdditionalClickOptions].hidden =
              true;
          }
          actionData[currentMainMode].NOACTION.hidden = false;
        }

        setModalState({ ...modalState });

        handleBackClick();
      } else if (page !== null) {
        onOptionPick(page, true)();
      }
    };
  };

  return (
    <div className="p-5">
      {AdditionClickMenu.map((block, i) => (
        <span key={i}>
          <div
            className="text-[#111827] text-[14px] min-w-full mb-[6px] mt-[10px]"
            style={{
              fontFamily: "Segoe UI",
            }}
          >
            {block.blockLabel}
          </div>
          <div className="flex flex-wrap w-full ">
            {block.options.map((el, i2) => (
              <div key={i2} className="w-1/2 pr-[6px] pb-[6px]">
                <GenericButton
                  customClasses={`relative w-full flex text-[12px] !border !shadow-none !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-sm !p-[6px] flex align-center whitespace-nowrap overflow-hidden ${
                    actionData[currentMainMode]?.[el.action]?.hidden
                      ? "!bg-white !border-[#E5E7EB] !text-black"
                      : "!bg-[#EEF2FF] !border-[#6366F1] !text-[#4338CA]"
                  }`}
                  onClick={handleOptionClick(el.pageType, el.action)}
                >
                  <span className="min-w-[16px] max-w-[16px] block mr-[4px]">
                    {el.icon}
                  </span>
                  <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden">
                    {el.name}
                  </span>
                </GenericButton>
              </div>
            ))}
          </div>
        </span>
      ))}
    </div>
  );
};

export default ModalEditorAdditionalClicks;
