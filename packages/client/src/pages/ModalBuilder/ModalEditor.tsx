import React, { FC, ReactNode } from "react";
import { ModalState } from "./ModalBuilder";
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
  SubMenuOptions,
} from "./types";
import ModalEditorDismissMenu from "./ModalEditorDismissMenu";
import ModalEditorPrimaryMenu from "./ModalEditorPrimaryMenu";
import ModalEditorAdditionalClicks from "./ModalEditorAdditionalClicks";
import ModalEditorOpenURL from "./ModalEditorOpenURL";
import { Scrollbars } from "react-custom-scrollbars-2";
import ModalEditorShroudMenu from "./ModalEditorShroudMenu";
import ModalEditorPersonalization from "./ModalEditorPersonalization";

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
  [Alignment.LEFT]: <AlignLeftSVG className="!text-white" />,
  [Alignment.CENTER]: <AlignCenterSVG className="!text-white" />,
  [Alignment.RIGHT]: <AlignRightSVG className="!text-white" />,
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
      name: "Inset Variable",
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
        x: 40,
        y: 40,
      }}
    >
      <div
        className="fixed rounded-[8px] w-[360px] z-[2147483646] min-h-[475px] max-h-[600px] pb-[20px] shadow-lg bg-[#F9FAFB] text-[#111827] font-semibold leading-[28px]"
        style={{
          fontFamily: "Segoe UI",
        }}
      >
        <div className="h-[8px] bg-[#4338CA] rounded-t-[8px]" />
        <div className="w-full border-b-[1px] border-[#E5E7EB]">
          <div
            id="draggableHead"
            className="w-full cursor-move flex flex-col font-medium justify-center"
          >
            <div className="flex items-center text-[20px] px-[20px] py-[15px]">
              <div>
                <div className="flex">
                  {editorMode !== EditorMenuOptions.MAIN && (
                    <LeftArrowSVG
                      className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                      onClick={handleBackClick}
                    />
                  )}
                  <span className="mb-[5px]">
                    {menuOptions[editorMode]?.name}
                  </span>
                </div>
                <span className="block min-w-full text-[12px] leading-[20px] font-normal text-[#4B5563]">
                  {menuOptions[editorMode]?.description}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Scrollbars
            className="w-full min-h-[400px] max-h-[530px]"
            renderThumbVertical={(props) => (
              <div {...props} className="!bg-[#E5E7EB]/20" />
            )}
          >
            <div className="p-[20px] w-[360px] overflow-x-hidden">
              {menuOptions[editorMode]?.layout}
            </div>
          </Scrollbars>
        </div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
