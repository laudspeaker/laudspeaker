import React, { FC, ReactNode, useState } from "react";
import { ModalState } from "./ModalBuilder";
import LeftArrowSVG from "@heroicons/react/20/solid/ChevronLeftIcon";
import AlignCenterSVG from "@heroicons/react/20/solid/Bars3Icon";
import AlignLeftSVG from "@heroicons/react/20/solid/Bars3BottomLeftIcon";
import AlignRightSVG from "@heroicons/react/20/solid/Bars3BottomRightIcon";
import Draggable from "react-draggable";
import ModalEditorMainMenu, { EditorMenuOptions } from "./ModalEditorMainMenu";
import ModalEditorTitleMenu from "./ModalEditorTitileMenu";
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

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

interface IMenuOption {
  name: string;
  description?: string;
  layout: React.ReactNode;
}

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

export interface IActionOpenURLData {
  [key: string]: {
    [AdditionalClickOptions.OPENURL]: IAdditionalClick;
    [AdditionalClickOptions.NOACTION]: IAdditionalClick;
  };
}

const ModalEditor: FC<ModalEditorProps> = ({ modalState, setModalState }) => {
  const [editorMode, setEditorMode] = useState<
    EditorMenuOptions | SubMenuOptions
  >(EditorMenuOptions.MAIN);
  const [previousMode, setPreviousMode] = useState<
    EditorMenuOptions | SubMenuOptions | null
  >(null);
  const [currentMainMode, setCurrentMainMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );

  const actionData: IActionOpenURLData = {
    [EditorMenuOptions.MEDIA]: {
      OPENURL: modalState.media.additionalClick.OPENURL,
      NOACTION: modalState.media.additionalClick.NOACTION,
    },
  };


  // TODO: fix routing between tabs for no action as example
  const handleEditorModeSet = (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious = false
  ) => {
    return () => {
      // TODO: hidden property update
      // if (mode === EditorMenuOptions.TITLE)
      //   setModalState({
      //     ...modalState,
      //     title: { ...modalState.title, hidden: false },
      //   });

      if (
        Object.values(EditorMenuOptions).some((el) => el === editorMode) &&
        mode !== EditorMenuOptions.MAIN
      )
        setCurrentMainMode(editorMode as EditorMenuOptions);

      if (setPrevious) setPreviousMode(editorMode);
      else if (editorMode !== SubMenuOptions.OpenUrl) setPreviousMode(null);

      setEditorMode(mode);
    };
  };

  const menuOptions: { [key: string]: IMenuOption } = {
    [EditorMenuOptions.MAIN]: {
      name: "Menu",
      layout: <ModalEditorMainMenu onOptionPick={handleEditorModeSet} />,
    },
    [EditorMenuOptions.TITLE]: {
      name: "Title",
      description: "Sometimes this is all that a user will read; make it count",
      layout: (
        <ModalEditorTitleMenu
          modalState={modalState}
          setModalState={setModalState}
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
          previousMode={previousMode}
          onOptionPick={handleEditorModeSet}
          actionData={actionData}
          currentMainMode={currentMainMode}
        />
      ),
    },
    [SubMenuOptions.Personalization]: {
      name: "Inset Variable",
      description:
        "Personalize text for each user by inserting a user property",
      layout: <>person</>, // TODO: add on pearson initialization
    },
    [SubMenuOptions.OpenUrl]: {
      name: "Open URL",
      layout: (
        <ModalEditorOpenURL
          modalState={modalState}
          setModalState={setModalState}
          currentMainMode={currentMainMode}
          onOptionPick={handleEditorModeSet}
          previousMode={previousMode}
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
      <div className="fixed w-[360px] z-[999999999] max-h-[80vh]  pb-[20px] rounded-xl shadow-lg bg-[#19362e]">
        <div className="w-full p-[4px] mb-[10px]">
          <div
            id="draggableHead"
            className="w-full bg-[url(pages/ModalBuilder/Icons/DraggerBG.svg)] bg-no-repeat bg-right cursor-move py-[20px] flex flex-col px-[20px] font-medium text-white justify-center bg-[#2f4a43] rounded-xl"
          >
            <div className="flex items-center text-[18px] mb-[4px]">
              {editorMode !== EditorMenuOptions.MAIN && (
                <LeftArrowSVG
                  className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                  onClick={
                    previousMode !== null
                      ? handleEditorModeSet(previousMode)
                      : handleEditorModeSet(EditorMenuOptions.MAIN)
                  }
                />
              )}
              <span>{menuOptions[editorMode]?.name}</span>
            </div>
            <small className="block min-w-full text-[11px]">
              {menuOptions[editorMode]?.description}
            </small>
          </div>
        </div>
        <div className="px-[24px] h-full overflow-y-scroll overflow-x-hidden">
          {menuOptions[editorMode]?.layout}
        </div>
        <div></div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
