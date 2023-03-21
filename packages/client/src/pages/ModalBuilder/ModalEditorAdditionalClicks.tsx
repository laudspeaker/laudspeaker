import { ModalState } from "./ModalBuilder";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import LinkSVG from "@heroicons/react/20/solid/ArrowTopRightOnSquareIcon";
import NoSymbolIcon from "@heroicons/react/20/solid/NoSymbolIcon";
import { AdditionalClickOptions, SubMenuOptions } from "./types";
import { GenericButton } from "components/Elements";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { IActionOpenURLData } from "./ModalEditor";

interface IModalEditorAdditionalClicksProps {
  modalState: ModalState;
  previousMode: EditorMenuOptions | SubMenuOptions | null;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IActionOpenURLData;
}

const AdditionClickMenu = [
  {
    blockLabel: "",
    options: [
      {
        icon: <NoSymbolIcon />,
        name: "No action",
        pageType: null,
        action: AdditionalClickOptions.NOACTION,
      },
    ],
  },
  {
    blockLabel: "Navigation",
    options: [
      {
        icon: <LinkSVG />,
        name: "Open URL",
        pageType: SubMenuOptions.OpenUrl,
        action: AdditionalClickOptions.OPENURL,
      },
    ],
  },
];

const ModalEditorAdditionalClicks = ({
  modalState,
  setModalState,
  previousMode,
  onOptionPick,
  actionData,
  currentMainMode,
}: IModalEditorAdditionalClicksProps) => {
  const handleOptionClick = (
    page: SubMenuOptions | null,
    action: AdditionalClickOptions
  ) => {
    return () => {
      console.log(page, previousMode, action);
      if (
        page === null &&
        previousMode !== null &&
        action === AdditionalClickOptions.NOACTION
      ) {
        for (const key in actionData[currentMainMode]) {
          actionData[currentMainMode][key as AdditionalClickOptions].enabled =
            false;
        }
        actionData[currentMainMode].NOACTION.enabled = true;

        console.log(actionData[currentMainMode], currentMainMode);
        setModalState({ ...modalState });

        onOptionPick(previousMode, false)();
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
                    !actionData[currentMainMode][el.action].enabled
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
