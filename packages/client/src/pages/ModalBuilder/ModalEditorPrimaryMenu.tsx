import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import { MediaClickActions, ModalState } from "./ModalBuilder";
import {
  ModalPrimaryPositionBottomLeft,
  ModalPrimaryPositionBottomCenter,
  ModalPrimaryPositionBottomRight,
  ModalPrimaryPositionCenterRight,
} from "./Icons/ModalBuilderIcons";
import {
  DismissType,
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
    <div className="flex flex-col text-[14px] font-normal">
      <div className="flex items-center justify-between mb-[10px]">
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
      <div className="flex items-center justify-between mb-[10px]">
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
      <div className="flex items-center justify-between mb-[10px]">
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
      <div className="flex justify-between items-center w-full pt-[10px]">
        <div className="flex items-center">Position:</div>
        <ul className="flex w-[180px] items-center justify-between">
          {primaryPostions.map((el) => (
            <li key={el.type}>
              <div
                className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:border-[1px] hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-white ${
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
      <div className="flex w-full justify-between items-center">
        <div className="flex w-full flex-col">
          <span>Action:</span>
        </div>
        <div className="w-full flex">
          <ul className="flex w-full items-center justify-start gap-[10px] py-[10px]">
            {MediaClickActions.map((el) => (
              <li key={el.actionOnClick}>
                <div
                  className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:border-[1px] hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-white ${
                    el.actionOnClick === modalState.media.actionOnClick
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setModalState({
                      ...modalState,
                      media: {
                        ...modalState.media,
                        actionOnClick: el.actionOnClick,
                      },
                    })
                  }
                >
                  {el.icon}
                  <div className="absolute text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                    {el.actionOnClick}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t-[1px] border-[#5D726D] my-[10px]" />
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
  );
};

export default ModalEditorPrimaryMenu;
