import CheckBox from "components/Elements/Checkbox/Checkbox";
import { useEffect } from "react";
import { ModalState } from "./ModalBuilder";
import { IActionOpenURLData } from "./ModalEditor";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { SubMenuOptions } from "./types";

interface IModalEditorOpenURLProps {
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

const ModalEditorOpenURL = ({
  modalState,
  onOptionPick,
  previousMode,
  setModalState,
  currentMainMode,
  actionData,
}: IModalEditorOpenURLProps) => {
  const handleOpenURLChange = ({
    link,
    isNewTab,
  }: {
    link?: string;
    isNewTab?: boolean;
  }) => {
    actionData[currentMainMode].OPENURL.enabled = true;

    if (link !== undefined)
      actionData[currentMainMode].OPENURL.object!.url = link;
    if (isNewTab !== undefined)
      actionData[currentMainMode].OPENURL.object!.openNewTab = isNewTab;

    setModalState({ ...modalState });
  };

  useEffect(() => {
    actionData[currentMainMode].NOACTION.enabled = false;
    actionData[currentMainMode].OPENURL.enabled = true;

    setModalState({ ...modalState });
  }, []);

  return (
    <>
      <div className="text-white text-[14px] my-[10px]">Action URL:</div>
      <textarea
        value={actionData[currentMainMode].OPENURL.object?.url || ""}
        className="resize-none w-full border-[1px] text-white border-white focus:border-white rounded-[5px] bg-transparent outline-none focus:outline-none shadow-none text-[12px]"
        placeholder="URL (google.com)"
        onChange={(ev) => handleOpenURLChange({ link: ev.target.value || "" })}
      />
      <div className="flex mt-[16px] w-full">
        <div className="text-white text-[14px] w-full">Open in a new Tab:</div>
        <div className="w-full"></div>
      </div>
    </>
  );
};

export default ModalEditorOpenURL;
