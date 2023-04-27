import { getCustomerKeys } from "pages/Segment/SegmentHelpers";
import React, { FC, useState } from "react";
import { useDebounce } from "react-use";
import { ModalState } from "./ModalBuilder";
import { IAdditionalActionData, PreviousModes } from "./ModalEditor";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { SubMenuOptions } from "./types";

interface ModalEditorPersonalizationProps {
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

const ModalEditorPersonalization: FC<ModalEditorPersonalizationProps> = ({
  actionData,
  currentMainMode,
  modalState,
  onOptionPick,
  previousModes,
  setModalState,
}) => {
  const [searchStr, setSeatchStr] = useState("");
  const [fetchedCustomerKeys, setFetchedCustomerKeys] = useState<
    { key: string }[]
  >([]);

  const fetchKeys = async () => {
    const data = await getCustomerKeys(searchStr, null, false);
    setFetchedCustomerKeys(data);
  };

  useDebounce(fetchKeys, 200, [searchStr]);

  return (
    <div className="text-white">
      <input
        type="text"
        value={searchStr}
        onChange={(e) => setSeatchStr(e.target.value)}
        className="bg-transparent"
      />
      <div className="select-none">
        {fetchedCustomerKeys.map((item) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              if (currentMainMode === EditorMenuOptions.BODY) {
                setModalState({
                  ...modalState,
                  body: {
                    ...modalState.body,
                    content: modalState.body.content + `{{ ${item.key} }}`,
                  },
                });
              } else {
                setModalState({
                  ...modalState,
                  title: {
                    ...modalState.title,
                    content: modalState.title.content + `{{ ${item.key} }}`,
                  },
                });
              }

              previousModes.pop();
              onOptionPick(currentMainMode, true)();
            }}
          >
            {item.key}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModalEditorPersonalization;
