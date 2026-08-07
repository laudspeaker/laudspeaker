import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import { MediaClickActions, PrimaryButtonClickActions } from "./InAppBuilder";
import {
  InAppPrimaryPositionBottomLeft,
  InAppPrimaryPositionBottomCenter,
  InAppPrimaryPositionBottomRight,
  InAppPrimaryPositionCenterRight,
} from "./Icons/InAppBuilderIcons";
import {
  DismissType,
  InAppState,
  PrimaryButtonPosition,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import InAppBuilderColorPicker from "./Elements/InAppBuilderColorPicker";
import AdditionalActionOption from "./AdditionalActionOption";
import { EditorMenuOptions } from "./InAppEditorMainMenu";
import { IAdditionalActionData } from "./InAppEditor";
import { useEffect } from "react";
import RemoveComponentButton from "./Elements/RemoveComponentButton";

interface IInAppEditorPrimaryMenuProps {
  inAppState: InAppState;
  setInAppState: (
    state: InAppState | ((prevState: InAppState) => InAppState)
  ) => void;
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
    icon: <InAppPrimaryPositionBottomLeft />,
    name: "Bottom left",
  },
  {
    type: PrimaryButtonPosition.BOTTOM_CENTER,
    icon: <InAppPrimaryPositionBottomCenter />,
    name: "Bottom center",
  },
  {
    type: PrimaryButtonPosition.BOTTOM_RIGHT,
    icon: <InAppPrimaryPositionBottomRight />,
    name: "Bottom right",
  },
  {
    type: PrimaryButtonPosition.CENTER_RIGHT,
    icon: <InAppPrimaryPositionCenterRight />,
    name: "Center right",
  },
];

const InAppEditorPrimaryMenu = ({
  inAppState,
  setInAppState,
  actionData,
  currentMainMode,
  onOptionPick,
  returnBack,
}: IInAppEditorPrimaryMenuProps) => {
  useEffect(() => {
    setInAppState((prevState) => ({
      ...prevState,
      primaryButton: { ...prevState.primaryButton, hidden: false },
    }));
  }, []);

  return (
    <div className="text-[14px] font-normal">
      <div className="flex flex-col gap-[10px] p-5">
        <div className="flex items-center justify-between">
          <div>Fill:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <InAppBuilderColorPicker
              className="!min-w-[150px]"
              color={inAppState.primaryButton.fillColor}
              onChange={(color) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  primaryButton: {
                    ...prevState.primaryButton,
                    fillColor: color,
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Border:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <InAppBuilderColorPicker
              className="!min-w-[150px]"
              color={inAppState.primaryButton.borderColor}
              onChange={(color) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  primaryButton: {
                    ...prevState.primaryButton,
                    borderColor: color,
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Text:</div>
          <div className="flex items-center pl-[5px] gap-[10px]">
            <InAppBuilderColorPicker
              className="!min-w-[150px]"
              color={inAppState.primaryButton.textColor}
              onChange={(color) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  primaryButton: {
                    ...prevState.primaryButton,
                    textColor: color,
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-[10px]">
          <div className="w-full">Corner:</div>
          <div className="flex w-full items-center gap-[10px]">
            <InAppBuilderNumberInput
              className="min-w-[150px]"
              id="fontSize"
              name="fontSize"
              unit={SizeUnit.PIXEL}
              value={inAppState.primaryButton.borderRadius.value}
              onChange={(value) =>
                setInAppState((prevState) => ({
                  ...prevState,
                  primaryButton: {
                    ...prevState.primaryButton,
                    borderRadius: {
                      unit: SizeUnit.PIXEL,
                      value,
                    },
                  },
                }))
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
                    el.type === inAppState.primaryButton.position
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setInAppState((prevState) => ({
                      ...prevState,
                      primaryButton: {
                        ...prevState.primaryButton,
                        position: el.type,
                      },
                    }))
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
                    inAppState.primaryButton.clickAction === el.actionOnClick
                      ? "bg-[#6366F1] text-white"
                      : ""
                  }`}
                  onClick={() =>
                    setInAppState(
                      (prevState: InAppState): InAppState => ({
                        ...prevState,
                        primaryButton: {
                          ...prevState.primaryButton,
                          clickAction: el.actionOnClick,
                        },
                      })
                    )
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
            setInAppState((prevState) => ({
              ...prevState,
              primaryButton: {
                ...prevState.primaryButton,
                hidden: true,
              },
            }));
            returnBack();
          }}
        >
          Remove primary button
        </RemoveComponentButton>
      </div>
    </div>
  );
};

export default InAppEditorPrimaryMenu;
