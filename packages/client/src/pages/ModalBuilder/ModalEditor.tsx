import React, { FC, ReactNode } from "react";
import LeftArrowSVG from "@heroicons/react/20/solid/ChevronLeftIcon";
import AlignCenterSVG from "@heroicons/react/20/solid/Bars3Icon";
import AlignLeftSVG from "@heroicons/react/20/solid/Bars3BottomLeftIcon";
import AlignRightSVG from "@heroicons/react/20/solid/Bars3BottomRightIcon";
import Draggable from "react-draggable";
import ModalEditorMainMenu, { EditorMenuOptions } from "./ModalEditorMainMenu";
import ModalEditorTitleMenu from "./ModalEditorTitleMenu";
import ModalEditorBodyMenu from "./ModalEditorBodyMenu";
import ModalEditorCanvasMenu from "./ModalEditorCanvasMenu";
import ModalPositionBodyMenu from "./ModalEditorPositionMenu";
import ModalEditorMediaMenu from "./ModalEditorMediaMenu";
import {
  AdditionalClickOptions,
  Alignment,
  IAdditionalClick,
  ModalState,
  SubMenuOptions,
} from "./types";
import ModalEditorDismissMenu from "./ModalEditorDismissMenu";
import ModalEditorPrimaryMenu from "./ModalEditorPrimaryMenu";
import ModalEditorAdditionalClicks from "./ModalEditorAdditionalClicks";
import ModalEditorOpenURL from "./ModalEditorOpenURL";
import { Scrollbars } from "react-custom-scrollbars-2";
import ModalEditorShroudMenu from "./ModalEditorShroudMenu";
import ModalEditorPersonalization from "./ModalEditorPersonalization";
import getWidth from "utils/getWidth";

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  editorMode: EditorMenuOptions | SubMenuOptions;
  setEditorMode: (mode: EditorMenuOptions | SubMenuOptions) => void;
  previousModes: PreviousModes;
  currentMainMode: EditorMenuOptions;
  handleEditorModeSet: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  setPreviousModes: (prevModes: PreviousModes) => void;
}

interface IMenuOption {
  name: string;
  description?: string;
  layout: React.ReactNode;
}

export type PreviousModes = (EditorMenuOptions | SubMenuOptions)[] | [];

export const textAlignment = [
  Alignment.LEFT,
  Alignment.CENTER,
  Alignment.RIGHT,
];

export const textAlignmentIcons: Record<Alignment, ReactNode> = {
  [Alignment.LEFT]: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 26 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.75 3.18945H16.25C16.3875 3.18945 16.5 3.07695 16.5 2.93945V1.18945C16.5 1.05195 16.3875 0.939453 16.25 0.939453H0.75C0.6125 0.939453 0.5 1.05195 0.5 1.18945V2.93945C0.5 3.07695 0.6125 3.18945 0.75 3.18945ZM0.75 16.4395H16.25C16.3875 16.4395 16.5 16.327 16.5 16.1895V14.4395C16.5 14.302 16.3875 14.1895 16.25 14.1895H0.75C0.6125 14.1895 0.5 14.302 0.5 14.4395V16.1895C0.5 16.327 0.6125 16.4395 0.75 16.4395ZM25.25 20.8145H0.75C0.6125 20.8145 0.5 20.927 0.5 21.0645V22.8145C0.5 22.952 0.6125 23.0645 0.75 23.0645H25.25C25.3875 23.0645 25.5 22.952 25.5 22.8145V21.0645C25.5 20.927 25.3875 20.8145 25.25 20.8145ZM25.25 7.56445H0.75C0.6125 7.56445 0.5 7.67695 0.5 7.81445V9.56445C0.5 9.70195 0.6125 9.81445 0.75 9.81445H25.25C25.3875 9.81445 25.5 9.70195 25.5 9.56445V7.81445C25.5 7.67695 25.3875 7.56445 25.25 7.56445Z"
        fill="#374151"
      />
    </svg>
  ),
  [Alignment.CENTER]: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 26 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.25 3.18945H20.75C20.8875 3.18945 21 3.07695 21 2.93945V1.18945C21 1.05195 20.8875 0.939453 20.75 0.939453H5.25C5.1125 0.939453 5 1.05195 5 1.18945V2.93945C5 3.07695 5.1125 3.18945 5.25 3.18945ZM20.75 16.4395C20.8875 16.4395 21 16.327 21 16.1895V14.4395C21 14.302 20.8875 14.1895 20.75 14.1895H5.25C5.1125 14.1895 5 14.302 5 14.4395V16.1895C5 16.327 5.1125 16.4395 5.25 16.4395H20.75ZM25.25 20.8145H0.75C0.6125 20.8145 0.5 20.927 0.5 21.0645V22.8145C0.5 22.952 0.6125 23.0645 0.75 23.0645H25.25C25.3875 23.0645 25.5 22.952 25.5 22.8145V21.0645C25.5 20.927 25.3875 20.8145 25.25 20.8145ZM25.25 7.56445H0.75C0.6125 7.56445 0.5 7.67695 0.5 7.81445V9.56445C0.5 9.70195 0.6125 9.81445 0.75 9.81445H25.25C25.3875 9.81445 25.5 9.70195 25.5 9.56445V7.81445C25.5 7.67695 25.3875 7.56445 25.25 7.56445Z"
        fill="#374151"
      />
    </svg>
  ),
  [Alignment.RIGHT]: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 26 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25.25 0.939453H9.75C9.6125 0.939453 9.5 1.05195 9.5 1.18945V2.93945C9.5 3.07695 9.6125 3.18945 9.75 3.18945H25.25C25.3875 3.18945 25.5 3.07695 25.5 2.93945V1.18945C25.5 1.05195 25.3875 0.939453 25.25 0.939453ZM25.25 14.1895H9.75C9.6125 14.1895 9.5 14.302 9.5 14.4395V16.1895C9.5 16.327 9.6125 16.4395 9.75 16.4395H25.25C25.3875 16.4395 25.5 16.327 25.5 16.1895V14.4395C25.5 14.302 25.3875 14.1895 25.25 14.1895ZM25.25 20.8145H0.75C0.6125 20.8145 0.5 20.927 0.5 21.0645V22.8145C0.5 22.952 0.6125 23.0645 0.75 23.0645H25.25C25.3875 23.0645 25.5 22.952 25.5 22.8145V21.0645C25.5 20.927 25.3875 20.8145 25.25 20.8145ZM25.25 7.56445H0.75C0.6125 7.56445 0.5 7.67695 0.5 7.81445V9.56445C0.5 9.70195 0.6125 9.81445 0.75 9.81445H25.25C25.3875 9.81445 25.5 9.70195 25.5 9.56445V7.81445C25.5 7.67695 25.3875 7.56445 25.25 7.56445Z"
        fill="#374151"
      />
    </svg>
  ),
};

export interface IAdditionalActionData {
  [key: string]: {
    [AdditionalClickOptions.OPENURL]: IAdditionalClick;
    [AdditionalClickOptions.NOACTION]: IAdditionalClick;
  };
}

const ModalEditor: FC<ModalEditorProps> = ({
  modalState,
  setModalState,
  editorMode,
  setEditorMode,
  currentMainMode,
  handleEditorModeSet,
  previousModes,
  setPreviousModes,
}) => {
  const actionData: IAdditionalActionData = {
    [EditorMenuOptions.MEDIA]: {
      OPENURL: modalState.media.additionalClick.OPENURL,
      NOACTION: modalState.media.additionalClick.NOACTION,
    },
    [EditorMenuOptions.PRIMARY]: {
      OPENURL: modalState.primaryButton.additionalClick.OPENURL,
      NOACTION: modalState.primaryButton.additionalClick.NOACTION,
    },
  };

  const handleBackClick = () => {
    const prev = [...previousModes];
    prev.pop();
    setPreviousModes(prev);
    setEditorMode(prev[prev.length - 1]);
  };

  const menuOptions: { [key: string]: IMenuOption } = {
    [EditorMenuOptions.MAIN]: {
      name: "Menu",
      layout: (
        <ModalEditorMainMenu
          modalState={modalState}
          onOptionPick={handleEditorModeSet}
        />
      ),
    },
    [EditorMenuOptions.TITLE]: {
      name: "Title",
      description: "Sometimes this is all that a user will read; make it count",
      layout: (
        <ModalEditorTitleMenu
          modalState={modalState}
          setModalState={setModalState}
          returnBack={handleBackClick}
          handleEditorModeSet={handleEditorModeSet}
        />
      ),
    },
    [EditorMenuOptions.BODY]: {
      name: "Body",
      description: "Keep it succinct; we recommend max 2-3 lines",
      layout: (
        <ModalEditorBodyMenu
          modalState={modalState}
          setModalState={setModalState}
          returnBack={handleBackClick}
          handleEditorModeSet={handleEditorModeSet}
        />
      ),
    },
    [EditorMenuOptions.CANVAS]: {
      name: "Canvas",
      description: "Configure Step background and size",
      layout: (
        <ModalEditorCanvasMenu
          modalState={modalState}
          setModalState={setModalState}
          currentMainMode={currentMainMode}
        />
      ),
    },
    [EditorMenuOptions.POSITION]: {
      name: "Position",
      description: "We recommend anchoring to page where possible",
      layout: (
        <ModalPositionBodyMenu
          modalState={modalState}
          setModalState={setModalState}
        />
      ),
    },
    [EditorMenuOptions.MEDIA]: {
      name: "Media",
      description: "Use to engage, not to explain",
      layout: (
        <ModalEditorMediaMenu
          modalState={modalState}
          setModalState={setModalState}
          onOptionPick={handleEditorModeSet}
          actionData={actionData}
          currentMainMode={currentMainMode}
          returnBack={handleBackClick}
        />
      ),
    },
    [EditorMenuOptions.DISMISS]: {
      name: "Dismiss",
      description: "Let users easily Exit or Snooze the Tour",
      layout: (
        <ModalEditorDismissMenu
          modalState={modalState}
          setModalState={setModalState}
          returnBack={handleBackClick}
        />
      ),
    },
    [EditorMenuOptions.PRIMARY]: {
      name: "Primary button",
      description: "Configure design and behavior",
      layout: (
        <ModalEditorPrimaryMenu
          modalState={modalState}
          setModalState={setModalState}
          onOptionPick={handleEditorModeSet}
          actionData={actionData}
          currentMainMode={currentMainMode}
          returnBack={handleBackClick}
        />
      ),
    },
    [EditorMenuOptions.SHROUD]: {
      name: "Shroud",
      description: "Add a non-clickable overlay behind your Experience",
      layout: (
        <ModalEditorShroudMenu
          modalState={modalState}
          setModalState={setModalState}
          returnBack={handleBackClick}
        />
      ),
    },
    [SubMenuOptions.AdditionalClicks]: {
      name: "Additional Click",
      description: "Customize behavior of each button differently",
      layout: (
        <ModalEditorAdditionalClicks
          modalState={modalState}
          setModalState={setModalState}
          onOptionPick={handleEditorModeSet}
          actionData={actionData}
          currentMainMode={currentMainMode}
          handleBackClick={handleBackClick}
        />
      ),
    },
    [SubMenuOptions.Personalization]: {
      name: "Insert Variable",
      description:
        "Personalize text for each user by inserting a user property",
      layout: (
        <ModalEditorPersonalization
          modalState={modalState}
          setModalState={setModalState}
          currentMainMode={currentMainMode}
          onOptionPick={handleEditorModeSet}
          previousModes={previousModes}
          actionData={actionData}
        />
      ),
    },
    [SubMenuOptions.OpenUrl]: {
      name: "Open URL",
      layout: (
        <ModalEditorOpenURL
          modalState={modalState}
          setModalState={setModalState}
          currentMainMode={currentMainMode}
          onOptionPick={handleEditorModeSet}
          previousModes={previousModes}
          actionData={actionData}
        />
      ),
    },
  };

  return (
    <Draggable
      axis="both"
      handle="#draggableHead"
      defaultPosition={{
        x: getWidth() - 370,
        y: 10,
      }}
    >
      <div className="fixed rounded-lg w-[360px] z-[2147483646] min-h-[475px] max-h-[600px] shadow-lg bg-[#F9FAFB] text-[#111827] font-semibold leading-[22px] font-segoe">
        <div className="h-[8px] bg-[#4338CA] rounded-t-[8px]" />
        <div className="w-full border-b-[1px] border-[#E5E7EB]">
          <div
            id="draggableHead"
            className="w-full cursor-move flex flex-col font-medium justify-center"
          >
            <div className="flex items-center text-[20px] px-5 py-[15px]">
              <div>
                <div className="flex">
                  {editorMode !== EditorMenuOptions.MAIN && (
                    <LeftArrowSVG
                      className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                      onClick={handleBackClick}
                    />
                  )}
                  <span className="mb-[5px] leading-[28px]">
                    {menuOptions[editorMode]?.name}
                  </span>
                </div>
                <span className="block min-w-full text-[12px] leading-5 font-normal text-[#4B5563]">
                  {menuOptions[editorMode]?.description}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Scrollbars
            className={`w-full ${
              (
                [
                  EditorMenuOptions.TITLE,
                  EditorMenuOptions.BODY,
                  EditorMenuOptions.MEDIA,
                ] as (EditorMenuOptions | SubMenuOptions)[]
              ).includes(editorMode)
                ? "min-h-[500px]"
                : "min-h-[400px]"
            } max-h-[500px]`}
            renderThumbVertical={(props) => (
              <div {...props} className="!bg-[#E5E7EB] rounded-md" />
            )}
          >
            <div className="w-[360px] overflow-x-hidden font-normal">
              {menuOptions[editorMode]?.layout}
            </div>
          </Scrollbars>
        </div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
