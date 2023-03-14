import React, { FC, useState } from "react";
import { ModalState } from "./ModalBuilder";
import LeftArrowSVG from "@heroicons/react/20/solid/ChevronLeftIcon";
import Draggable from "react-draggable";
import MainMenu, { EditorMenuOptions } from "./MainMenu";

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

interface IMenuOption {
  name: string;
  description?: string;
  layout: React.ReactNode;
}

const ModalEditor: FC<ModalEditorProps> = () => {
  const [editorMode, setEditorMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );

  const handleEditorModeSet = (mode: EditorMenuOptions) => {
    return () => {
      setEditorMode(mode);
    };
  };

  const menuOptions: { [key: string]: IMenuOption } = {
    [EditorMenuOptions.MAIN]: {
      name: "Menu",
      layout: <MainMenu onOptionPick={handleEditorModeSet} />,
    },
    [EditorMenuOptions.TITLE]: {
      name: "Title",
      description: "Sometimes this is all that a user will read; make it count",
      layout: <span>Title</span>,
    },
    [EditorMenuOptions.BODY]: {
      name: "Body",
      description: "Keep it succinct; we recommend max 2-3 lines",
      layout: <span>Body</span>,
    },
    [EditorMenuOptions.CANVAS]: {
      name: "Canvas",
      description: "Configure Step background and size",
      layout: <span>Canvas</span>,
    },
    [EditorMenuOptions.POSITION]: {
      name: "Position",
      description: "We recommend anchoring to page where possible",
      layout: <span>Position</span>,
    },
    [EditorMenuOptions.MEDIA]: {
      name: "Media",
      description: "Use to engage, not to explain",
      layout: <span>Media</span>,
    },
    [EditorMenuOptions.DISMISS]: {
      name: "Dismiss",
      description: "Let users easily Exit or Snooze the Tour",
      layout: <span>Dismiss</span>,
    },
    [EditorMenuOptions.PRIMARY]: {
      name: "Primary button",
      description: "Configure design and behavior",
      layout: <span>Primary</span>,
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
        id="draggableHead"
        className="fixed w-[360px] z-[999999999] h-[600px] rounded-xl shadow-lg bg-[#19362e]"
      >
        <div className="w-full p-[4px] mb-[10px]">
          <div className="w-full cursor-move py-[20px] flex flex-col px-[20px] font-medium text-white justify-center bg-[#2f4a43] rounded-xl">
            <div className="flex items-center text-[18px] mb-[4px]">
              {editorMode !== EditorMenuOptions.MAIN && (
                <LeftArrowSVG
                  className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                  onClick={handleEditorModeSet(EditorMenuOptions.MAIN)}
                />
              )}
              <span>{menuOptions[editorMode].name}</span>
            </div>
            <small className="block min-w-full">
              {menuOptions[editorMode].description}
            </small>
          </div>
        </div>
        <div className=" px-[24px] max-h-[75vh] overflow-y-scroll">
          {menuOptions[editorMode].layout}
        </div>
        <div></div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
