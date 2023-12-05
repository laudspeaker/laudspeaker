import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import { MediaClickActions, PrimaryButtonClickActions } from "./ModalBuilder";
import {
  ModalPrimaryPositionBottomLeft,
  ModalPrimaryPositionBottomCenter,
  ModalPrimaryPositionBottomRight,
  ModalPrimaryPositionCenterRight,
} from "./Icons/ModalBuilderIcons";
import {
  DismissType,
  ModalState,
  PrimaryButtonPosition,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import AdditionalActionOption from "./AdditionalActionOption";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { IAdditionalActionData } from "./ModalEditor";
import { useEffect } from "react";
import RemoveComponentButton from "./Elements/RemoveComponentButton";

interface IModalEditorPrimaryMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
  returnBack: () => void;
}

export const mediaDismissTypes = [DismissType.CROSS, DismissType.TEXT];

export const primaryPostions = [
  {
    type: PrimaryButtonPosition.BOTTOM_LEFT,
    icon: <ModalPrimaryPositionBottomLeft />,
    name: "Bottom left",
  },
  {
    type: PrimaryButtonPosition.BOTTOM_CENTER,
    icon: <ModalPrimaryPositionBottomCenter />,
    name: "Bottom center",
  },
  {
    type: PrimaryButtonPosition.BOTTOM_RIGHT,
    icon: <ModalPrimaryPositionBottomRight />,
    name: "Bottom right",
  },
  {
    type: PrimaryButtonPosition.CENTER_RIGHT,
    icon: <ModalPrimaryPositionCenterRight />,
    name: "Center right",
  },
];

const ModalEditorPrimaryMenu = ({
  modalState,
  setModalState,
  actionData,
  currentMainMode,
  onOptionPick,
  returnBack,
}: IModalEditorPrimaryMenuProps) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      primaryButton: { ...modalState.primaryButton, hidden: false },
    });
  }, []);

  return (
    <div className="text-[14px] font-normal">
      <div className="flex flex-col gap-[10px] p-5">
        <div className="flex items-center justify-between">
          <div>Fill:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <ModalBuilderColorPicker
              className="!min-w-[150px]"
              color={modalState.primaryButton.fillColor}
              onChange={(color) =>
                setModalState({
                  ...modalState,
                  primaryButton: {
                    ...modalState.primaryButton,
                    fillColor: color,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Border:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <ModalBuilderColorPicker
              className="!min-w-[150px]"
              color={modalState.primaryButton.borderColor}
              onChange={(color) =>
                setModalState({
                  ...modalState,
                  primaryButton: {
                    ...modalState.primaryButton,
                    borderColor: color,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Text:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <ModalBuilderColorPicker
              className="!min-w-[150px]"
              color={modalState.primaryButton.textColor}
              onChange={(color) =>
                setModalState({
                  ...modalState,
                  primaryButton: {
                    ...modalState.primaryButton,
                    textColor: color,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-[10px]">
          <div className="w-full">Corner:</div>
          <div className="flex w-full items-center gap-[10px]">
            <ModalBuilderNumberInput
              className="min-w-[150px]"
              id="fontSize"
              name="fontSize"
              unit={SizeUnit.PIXEL}
              value={modalState.primaryButton.borderRadius.value}
              onChange={(value) =>
                setModalState({
                  ...modalState,
                  primaryButton: {
                    ...modalState.primaryButton,
                    borderRadius: {
                      unit: SizeUnit.PIXEL,
                      value,
                    },
                  },
                })
              }
            />
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">Position:</div>
          <ul className="flex w-[180px] items-center justify-between">
            {primaryPostions.map((el) => (
              <li key={el.type}>
                <div
                  className={`flex justify-center items-center relative w-[28px] h-[28px] hover:border hover:border-[#818CF8] rounded cursor-pointer text-transparent hover:text-white ${
                    el.type === modalState.primaryButton.position
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setModalState({
                      ...modalState,
                      primaryButton: {
                        ...modalState.primaryButton,
                        position: el.type,
                      },
                    })
                  }
                >
                  {el.icon}
                  <div className="absolute text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                    {el.name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5 flex flex-col gap-[10px]">
        <div className="flex w-full justify-between items-center">
          <div className="flex w-full flex-col">
            <span>Action:</span>
          </div>
          <div className="w-full flex">
            <ul className="flex w-[214px] border-[#E5E7EB] border items-center justify-start">
              {PrimaryButtonClickActions.map((el, i) => (
                <li
                  key={i}
                  className={`flex text-[14px] justify-center items-center w-full h-[32px] cursor-pointer ${
                    modalState.primaryButton.clickAction === el.actionOnClick
                      ? "bg-[#6366F1] text-white"
                      : ""
                  }`}
                  onClick={() =>
                    setModalState({
                      ...modalState,
                      primaryButton: {
                        ...modalState.primaryButton,
                        clickAction: el.actionOnClick,
                      },
                    })
                  }
                >
                  {el.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AdditionalActionOption
          actionData={actionData}
          currentMainMode={currentMainMode}
          onOptionPick={onOptionPick}
        />

        <RemoveComponentButton
          onClick={() => {
            setModalState({
              ...modalState,
              primaryButton: {
                ...modalState.primaryButton,
                hidden: true,
              },
            });
            returnBack();
          }}
        >
          Remove primary button
        </RemoveComponentButton>
      </div>
    </div>
  );
};

export default ModalEditorPrimaryMenu;
