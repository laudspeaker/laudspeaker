import { GenericButton } from "components/Elements";
import PositionSVG from "@heroicons/react/20/solid/ArrowsPointingOutIcon";
import CanvasSVG from "@heroicons/react/20/solid/ComputerDesktopIcon";
import TitleSVG from "@heroicons/react/20/solid/Bars3BottomLeftIcon";
import BodySVG from "@heroicons/react/20/solid/Bars4Icon";
import MediaSVG from "@heroicons/react/20/solid/VideoCameraIcon";
import DismissSVG from "@heroicons/react/20/solid/XCircleIcon";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import PrimarySVG from "@heroicons/react/20/solid/CheckCircleIcon";

export enum EditorMenuOptions {
  MAIN = "MAIN",
  POSITION = "POSITION",
  CANVAS = "CANVAS",
  TITLE = "TITLE",
  BODY = "BODY",
  MEDIA = "MEDIA",
  DISMISS = "DISMISS",
  PRIMARY = "PRIMARY",
}

interface IMainMenuProps {
  onOptionPick: (mode: EditorMenuOptions) => () => void;
}

const editorMenu = [
  {
    title: "DESIGN",
    elements: [
      {
        name: "Position",
        icon: <PositionSVG />,
        option: EditorMenuOptions.POSITION,
      },
      {
        name: "Canvas",
        icon: <CanvasSVG />,
        option: EditorMenuOptions.CANVAS,
      },
      {
        name: "Title",
        icon: <TitleSVG />,
        option: EditorMenuOptions.TITLE,
      },
      {
        name: "Body",
        icon: <BodySVG />,
        option: EditorMenuOptions.BODY,
      },
      {
        name: "Media",
        icon: <MediaSVG />,
        option: EditorMenuOptions.MEDIA,
      },
    ],
  },
  {
    title: "INTERACTIONS",
    elements: [
      {
        name: "Dismiss",
        icon: <DismissSVG />,
        option: EditorMenuOptions.DISMISS,
      },
      {
        name: "Primary Button",
        icon: <PrimarySVG />,
        option: EditorMenuOptions.PRIMARY,
      },
    ],
  },
];

const ModalEditorMainMenu = ({ onOptionPick }: IMainMenuProps) => {
  return (
    <>
      {editorMenu.map((block, i) => (
        <span key={i}>
          <div className="text-white/80 min-w-full mb-[4px]">{block.title}</div>
          <div className="flex flex-wrap w-full ">
            {block.elements.map((el, i2) => (
              <div key={i2} className="w-1/2 pr-[6px] pb-[6px]">
                <GenericButton
                  customClasses={`relative w-full flex text-[12px] !border-[2px] !border-[#2f4a43] !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-[8px] !p-[6px] flex align-center whitespace-nowrap overflow-hidden ${
                    false ? "!bg-[#19362e]" : "!bg-[#2f4a43]" //TODO: add style change when option added to layout
                  }`}
                  onClick={onOptionPick(el.option)}
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

export default ModalEditorMainMenu;
