import { Switch } from "@headlessui/react";
import { useEffect } from "react";
import { IAdditionalActionData, PreviousModes } from "./ModalEditor";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { ModalState, SubMenuOptions } from "./types";

interface IModalEditorOpenURLProps {
  modalState: ModalState;
  previousModes: PreviousModes;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
}

const ModalEditorOpenURL = ({
  modalState,
  onOptionPick,
  previousModes,
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
    if (actionData[currentMainMode]?.OPENURL?.object) {
      actionData[currentMainMode].OPENURL.hidden = false;

      if (link !== undefined)
        actionData[currentMainMode].OPENURL.object!.url = link;
      if (isNewTab !== undefined)
        actionData[currentMainMode].OPENURL.object!.openNewTab = isNewTab;
    }

    setModalState({ ...modalState });
  };

  useEffect(() => {
    if (actionData[currentMainMode]) {
      actionData[currentMainMode].NOACTION.hidden = true;
      actionData[currentMainMode].OPENURL.hidden = false;
    }

    setModalState({ ...modalState });
  }, []);

  return (
    <div className="p-5">
      <div className="text-[14px] mb-[10px]">Action URL:</div>
      <textarea
        value={actionData[currentMainMode]?.OPENURL.object?.url || ""}
        className="resize-none w-full border border-[#D9D9D9] bg-white rounded-sm outline-none focus:outline-none shadow-none text-[12px]"
        placeholder="URL (google.com)"
        onChange={(ev) => handleOpenURLChange({ link: ev.target.value || "" })}
      />
      <div className="flex mt-[16px] w-full">
        <div className="text-[14px] w-full">Open in a new Tab:</div>
        <div className="w-full flex justify-end">
          <Switch
            checked={actionData[currentMainMode]?.OPENURL.object?.openNewTab}
            onChange={(ev: boolean) => handleOpenURLChange({ isNewTab: ev })}
            className={`${
              actionData[currentMainMode]?.OPENURL.object?.openNewTab
                ? "bg-[#6366F1]"
                : "bg-[#bac3c0]"
            } relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span className="sr-only">Enable notifications</span>
            <span
              className={`${
                actionData[currentMainMode]?.OPENURL?.object?.openNewTab
                  ? "translate-x-6"
                  : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default ModalEditorOpenURL;
