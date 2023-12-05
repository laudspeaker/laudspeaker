import { GenericButton } from "components/Elements";
import PositionSVG from "@heroicons/react/20/solid/ArrowsPointingOutIcon";
import CanvasSVG from "@heroicons/react/20/solid/ComputerDesktopIcon";
import TitleSVG from "@heroicons/react/20/solid/Bars3BottomLeftIcon";
import BodySVG from "@heroicons/react/20/solid/Bars4Icon";
import MediaSVG from "@heroicons/react/20/solid/VideoCameraIcon";
import DismissSVG from "@heroicons/react/20/solid/XCircleIcon";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import PrimarySVG from "@heroicons/react/20/solid/CheckCircleIcon";
import ShroudSVG from "@heroicons/react/20/solid/SunIcon";
import { FC } from "react";
import { ModalState } from "./types";

export enum EditorMenuOptions {
  MAIN = "MAIN",
  POSITION = "POSITION",
  CANVAS = "CANVAS",
  TITLE = "TITLE",
  BODY = "BODY",
  MEDIA = "MEDIA",
  DISMISS = "DISMISS",
  PRIMARY = "PRIMARY",
  SHROUD = "SHROUD",
}

interface MainMenuProps {
  onOptionPick: (mode: EditorMenuOptions, isNewTab: boolean) => () => void;
  modalState: ModalState;
}

const ModalEditorMainMenu: FC<MainMenuProps> = ({
  onOptionPick,
  modalState,
}) => {
  const editorMenu = [
    {
      title: "Design",
      elements: [
        {
          name: "Position",
          icon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.125 1.125V4.875M1.125 1.125H4.875M1.125 1.125L5.5 5.5M1.125 14.875V11.125M1.125 14.875H4.875M1.125 14.875L5.5 10.5M14.875 1.125H11.125M14.875 1.125V4.875M14.875 1.125L10.5 5.5M14.875 14.875H11.125M14.875 14.875V11.125M14.875 14.875L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.POSITION,
          hidden: false,
        },
        {
          name: "Canvas",
          icon: (
            <svg
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 14.875H14M7.75 12.375V14.875M10.25 12.375V14.875M1.8125 12.375H16.1875C16.705 12.375 17.125 11.955 17.125 11.4375V2.0625C17.125 1.545 16.705 1.125 16.1875 1.125H1.8125C1.295 1.125 0.875 1.545 0.875 2.0625V11.4375C0.875 11.955 1.295 12.375 1.8125 12.375Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.CANVAS,
          hidden: false,
        },
        {
          name: "Title",
          icon: (
            <svg
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.125 7H14.875M1.125 10.125H14.875M1.125 13.25H14.875M2.6875 0.75H13.3125C13.7269 0.75 14.1243 0.91462 14.4174 1.20765C14.7104 1.50067 14.875 1.8981 14.875 2.3125C14.875 2.7269 14.7104 3.12433 14.4174 3.41735C14.1243 3.71038 13.7269 3.875 13.3125 3.875H2.6875C2.2731 3.875 1.87567 3.71038 1.58265 3.41735C1.28962 3.12433 1.125 2.7269 1.125 2.3125C1.125 1.8981 1.28962 1.50067 1.58265 1.20765C1.87567 0.91462 2.2731 0.75 2.6875 0.75Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.TITLE,
          hidden: modalState.title.hidden,
        },
        {
          name: "Body",
          icon: (
            <svg
              width="16"
              height="10"
              viewBox="0 0 16 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.125 0.625H14.875M1.125 5H14.875M1.125 9.375H8"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.BODY,
          hidden: modalState.body.hidden,
        },
        {
          name: "Media",
          icon: (
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.875 10.125L5.17417 5.82583C5.34828 5.65172 5.55498 5.51361 5.78246 5.41938C6.00995 5.32515 6.25377 5.27665 6.5 5.27665C6.74623 5.27665 6.99005 5.32515 7.21754 5.41938C7.44502 5.51361 7.65172 5.65172 7.82583 5.82583L12.125 10.125M10.875 8.875L12.0492 7.70083C12.2233 7.52672 12.43 7.38861 12.6575 7.29438C12.885 7.20015 13.1288 7.15165 13.375 7.15165C13.6212 7.15165 13.865 7.20015 14.0925 7.29438C14.32 7.38861 14.5267 7.52672 14.7008 7.70083L17.125 10.125M2.125 13.25H15.875C16.2065 13.25 16.5245 13.1183 16.7589 12.8839C16.9933 12.6495 17.125 12.3315 17.125 12V2C17.125 1.66848 16.9933 1.35054 16.7589 1.11612C16.5245 0.881696 16.2065 0.75 15.875 0.75H2.125C1.79348 0.75 1.47554 0.881696 1.24112 1.11612C1.0067 1.35054 0.875 1.66848 0.875 2V12C0.875 12.3315 1.0067 12.6495 1.24112 12.8839C1.47554 13.1183 1.79348 13.25 2.125 13.25ZM10.875 3.875H10.8817V3.88167H10.875V3.875ZM11.1875 3.875C11.1875 3.95788 11.1546 4.03737 11.096 4.09597C11.0374 4.15458 10.9579 4.1875 10.875 4.1875C10.7921 4.1875 10.7126 4.15458 10.654 4.09597C10.5954 4.03737 10.5625 3.95788 10.5625 3.875C10.5625 3.79212 10.5954 3.71263 10.654 3.65403C10.7126 3.59542 10.7921 3.5625 10.875 3.5625C10.9579 3.5625 11.0374 3.59542 11.096 3.65403C11.1546 3.71263 11.1875 3.79212 11.1875 3.875Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.MEDIA,
          hidden: modalState.media.hidden,
        },
        {
          name: "Shroud",
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 1.5V3.375M14.3033 3.69667L12.9775 5.0225M16.5 9H14.625M14.3033 14.3033L12.9775 12.9775M9 14.625V16.5M5.0225 12.9775L3.69667 14.3033M3.375 9H1.5M5.0225 5.0225L3.69667 3.69667M12.125 9C12.125 9.8288 11.7958 10.6237 11.2097 11.2097C10.6237 11.7958 9.8288 12.125 9 12.125C8.1712 12.125 7.37634 11.7958 6.79029 11.2097C6.20424 10.6237 5.875 9.8288 5.875 9C5.875 8.1712 6.20424 7.37634 6.79029 6.79029C7.37634 6.20424 8.1712 5.875 9 5.875C9.8288 5.875 10.6237 6.20424 11.2097 6.79029C11.7958 7.37634 12.125 8.1712 12.125 9Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.SHROUD,
          hidden: modalState.shroud.hidden,
        },
      ],
    },
    {
      title: "Interactions",
      elements: [
        {
          name: "Dismiss",
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.125 7.125L10.875 10.875M10.875 7.125L7.125 10.875M16.5 9C16.5 9.98491 16.306 10.9602 15.9291 11.8701C15.5522 12.7801 14.9997 13.6069 14.3033 14.3033C13.6069 14.9997 12.7801 15.5522 11.8701 15.9291C10.9602 16.306 9.98491 16.5 9 16.5C8.01509 16.5 7.03982 16.306 6.12987 15.9291C5.21993 15.5522 4.39314 14.9997 3.6967 14.3033C3.00026 13.6069 2.44781 12.7801 2.0709 11.8701C1.69399 10.9602 1.5 9.98491 1.5 9C1.5 7.01088 2.29018 5.10322 3.6967 3.6967C5.10322 2.29018 7.01088 1.5 9 1.5C10.9891 1.5 12.8968 2.29018 14.3033 3.6967C15.7098 5.10322 16.5 7.01088 16.5 9Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.DISMISS,
          hidden: modalState.dismiss.hidden,
        },
        {
          name: "Primary Button",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.8584 8.19104C13.9163 8.11133 13.958 8.02099 13.981 7.92518C14.004 7.82938 14.0079 7.72998 13.9925 7.63266C13.977 7.53535 13.9426 7.44202 13.8911 7.35801C13.8396 7.274 13.7721 7.20096 13.6924 7.14304C13.6127 7.08513 13.5224 7.04348 13.4265 7.02048C13.3307 6.99748 13.2313 6.99358 13.134 7.00899C13.0367 7.02441 12.9434 7.05884 12.8594 7.11032C12.7754 7.16181 12.7023 7.22933 12.6444 7.30904L9.1614 12.099L7.2814 10.219C7.21219 10.1474 7.1294 10.0903 7.03788 10.0511C6.94636 10.0118 6.84793 9.99118 6.74835 9.99036C6.64876 9.98954 6.55001 10.0086 6.45786 10.0463C6.36571 10.0841 6.28199 10.1398 6.21161 10.2103C6.14122 10.2807 6.08557 10.3645 6.0479 10.4567C6.01024 10.5489 5.99131 10.6476 5.99222 10.7472C5.99313 10.8468 6.01387 10.9452 6.05322 11.0367C6.09257 11.1282 6.14974 11.2109 6.2214 11.28L8.72141 13.78C8.79803 13.8567 8.89037 13.9159 8.99205 13.9534C9.09373 13.991 9.20235 14.006 9.31042 13.9976C9.41848 13.9891 9.52343 13.9573 9.61803 13.9044C9.71264 13.8515 9.79464 13.7787 9.85841 13.691L13.8584 8.19104Z"
                fill="currentColor"
              />
              <path
                d="M17.5 10C17.5 10.9849 17.306 11.9602 16.9291 12.8701C16.5522 13.7801 15.9997 14.6069 15.3033 15.3033C14.6069 15.9997 13.7801 16.5522 12.8701 16.9291C11.9602 17.306 10.9849 17.5 10 17.5C9.01509 17.5 8.03982 17.306 7.12987 16.9291C6.21993 16.5522 5.39314 15.9997 4.6967 15.3033C4.00026 14.6069 3.44781 13.7801 3.0709 12.8701C2.69399 11.9602 2.5 10.9849 2.5 10C2.5 8.01088 3.29018 6.10322 4.6967 4.6967C6.10322 3.29018 8.01088 2.5 10 2.5C11.9891 2.5 13.8968 3.29018 15.3033 4.6967C16.7098 6.10322 17.5 8.01088 17.5 10Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          option: EditorMenuOptions.PRIMARY,
          hidden: modalState.primaryButton.hidden,
        },
      ],
    },
  ];

  return (
    <div className="w-full p-5">
      {editorMenu.map((block, i) => (
        <span key={i}>
          <div
            className={`min-w-full font-semibold leading-[24px] ${
              i === 0 ? "" : "mt-[10px]"
            }`}
          >
            {block.title}
          </div>
          <div className="flex justify-between flex-wrap w-full">
            {block.elements.map((el, i2) => (
              <div key={i2} className="w-[155px] mt-[10px]">
                <GenericButton
                  customClasses={`relative w-full flex !text-[14px] !leading-[22px] !border-2 !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-lg !px-[10px] !py-[9px] flex align-center whitespace-nowrap overflow-hidden ${
                    el.hidden
                      ? "!bg-[#FFFFFF] border-[#E5E7EB] !text-[#4B5563] hover:border-[#6366F1] hover:!text-[#6366F1]"
                      : "!bg-[#EEF2FF] !border-[#6366F1] hover:border-[#6366F1] !text-[#4338CA]"
                  }`}
                  onClick={onOptionPick(el.option, true)}
                >
                  <span className="min-w-[16px] max-w-[16px] block mr-[10px]">
                    {el.icon}
                  </span>
                  <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden">
                    {el.name}
                  </span>
                  <div className="absolute opacity-0 hover:!opacity-100 bg-opacity-40 top-0 left-0 w-full h-full !rounded-lg transition-all border-2 border-white">
                    <EditIconSVG className="absolute w-[20px] right-[10px] top-1/2 -translate-y-1/2 shadow-2xl rounded-full" />
                  </div>
                </GenericButton>
              </div>
            ))}
          </div>
        </span>
      ))}
    </div>
  );
};

export default ModalEditorMainMenu;
