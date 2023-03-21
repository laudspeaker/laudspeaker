import { ModalState } from "./ModalBuilder";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import LinkSVG from "@heroicons/react/20/solid/ArrowTopRightOnSquareIcon";
import NoSymbolIcon from "@heroicons/react/20/solid/NoSymbolIcon";
import { AdditionalClickOptions, SubMenuOptions } from "./types";
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
        for (const key in actionData[currentMainMode]) {
          actionData[currentMainMode][key as AdditionalClickOptions].hidden =
            true;
        }
        actionData[currentMainMode].NOACTION.hidden = false;

        setModalState({ ...modalState });

        handleBackClick();
      } else if (page !== null) {
        onOptionPick(page, true)();
      }
    };
  };

  return (
    <>
      {AdditionClickMenu.map((block, i) => (
        <span key={i}>
          <div className="text-white/80 min-w-full mb-[6px] mt-[10px]">
            {block.blockLabel}
          </div>
          <div className="flex flex-wrap w-full ">
            {block.options.map((el, i2) => (
              <div key={i2} className="w-1/2 pr-[6px] pb-[6px]">
                <GenericButton
                  customClasses={`relative w-full flex text-[12px] !border-[2px] !border-[#2f4a43] !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-[8px] !p-[6px] flex align-center whitespace-nowrap overflow-hidden ${
                    actionData[currentMainMode][el.action].hidden
                      ? "!bg-[#19362e]"
                      : "!bg-[#2f4a43]"
                  }`}
                  onClick={handleOptionClick(el.pageType, el.action)}
                >
                  <span className="min-w-[16px] max-w-[16px] block mr-[4px]">
                    {el.icon}
                  </span>
                  <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden">
                    {el.name}
                  </span>
                  <div className="absolute opacity-0 hover:!opacity-100 bg-opacity-40 bg-white top-0 left-0 w-full h-full !rounded-[8px] transition-all border-[2px] border-white">
                    <EditIconSVG className="absolute w-[20px] right-[10px] top-1/2 -translate-y-1/2 !text-white shadow-2xl rounded-full" />
                  </div>
                </GenericButton>
              </div>
            ))}
          </div>
        </span>
      ))}
    </>
  );
};

export default ModalEditorAdditionalClicks;
