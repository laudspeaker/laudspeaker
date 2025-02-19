import { ReactNode, useEffect } from "react";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import {
  InAppDismissPositionOutRight,
  InAppDismissPositionOutLeft,
  InAppDismissPositionInRight,
  InAppDismissPositionInLeft,
  InAppDismissPositionCenterRight,
  InAppDismissPositionCenterLeft,
} from "./Icons/InAppBuilderIcons";
import { DismissPosition, DismissType, InAppState, SizeUnit } from "./types";
import InAppBuilderColorPicker from "./Elements/InAppBuilderColorPicker";
import ReactSlider from "react-slider";
import RemoveComponentButton from "./Elements/RemoveComponentButton";

interface IInAppEditorDismissMenuProps {
  inAppState: InAppState;
  setInAppState: (
    state: InAppState | ((prevState: InAppState) => InAppState)
  ) => void;
  returnBack: () => void;
}

export const inAppPositions = [
  DismissPosition.OUTSIDE_RIGHT,
  DismissPosition.OUTSIDE_LEFT,
  DismissPosition.INSIDE_RIGHT,
  DismissPosition.INSIDE_LEFT,
  DismissPosition.CENTER_RIGHT,
  DismissPosition.CENTER_LEFT,
];

export const inAppPositionIconMap: Record<DismissPosition, ReactNode> = {
  [DismissPosition.OUTSIDE_RIGHT]: <InAppDismissPositionOutRight />,
  [DismissPosition.OUTSIDE_LEFT]: <InAppDismissPositionOutLeft />,
  [DismissPosition.INSIDE_RIGHT]: <InAppDismissPositionInRight />,
  [DismissPosition.INSIDE_LEFT]: <InAppDismissPositionInLeft />,
  [DismissPosition.CENTER_RIGHT]: <InAppDismissPositionCenterRight />,
  [DismissPosition.CENTER_LEFT]: <InAppDismissPositionCenterLeft />,
};

export const mediaDismissTypes = [DismissType.CROSS, DismissType.TEXT];

const timedDismissList = [
  {
    name: "On",
    displayTimerText: "Yes",
    value: true,
  },
  {
    name: "Off",
    displayTimerText: "No",
    value: false,
  },
];

const InAppEditorDismissMenu = ({
  inAppState,
  setInAppState,
  returnBack,
}: IInAppEditorDismissMenuProps) => {
  useEffect(() => {
    setInAppState((prevState) => ({
      ...prevState,
      dismiss: { ...prevState.dismiss, hidden: false },
    }));
  }, []);

  return (
    <div className="flex flex-col text-[14px] font-normal">
      <div className="p-5 flex flex-col gap-[10px]">
        <div>
          <div>Type:</div>
          <div className="flex select-none">
            {mediaDismissTypes.map((el, i) => (
              <div
                key={el}
                className={`flex justify-center items-center w-full h-[32px] border-[#E5E7EB] border cursor-pointer ${
                  inAppState.dismiss.type === el
                    ? "bg-[#6366F1] text-white"
                    : "hover:bg-white hover:bg-opacity-25"
                } ${
                  i === 0
                    ? "rounded-l-[2px]"
                    : i === mediaDismissTypes.length - 1
                    ? "rounded-r-[2px]"
                    : 0
                }`}
                onClick={() =>
                  setInAppState(
                    (prevState: InAppState): InAppState => ({
                      ...prevState,
                      dismiss: { ...prevState.dismiss, type: el },
                    })
                  )
                }
              >
                {el}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-[10px]">Position</div>
          <ul className="flex w-full items-center justify-between">
            {inAppPositions.map((position) => (
              <li key={position}>
                <div
                  className={`flex justify-center items-center relative w-[35px] h-[35px] hover:border hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-[#111827] ${
                    position === inAppState.dismiss.position
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setInAppState(
                      (prevState: InAppState): InAppState => ({
                        ...prevState,
                        dismiss: { ...prevState.dismiss, position: position },
                      })
                    )
                  }
                >
                  {inAppPositionIconMap[position]}
                  <div className="absolute z-[123] text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                    {position}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between">
          <div>Color</div>
          <div className="flex items-center gap-[10px]">
            <InAppBuilderColorPicker
              className="!min-w-[150px]"
              color={inAppState.dismiss.color}
              onChange={(color) =>
                setInAppState(
                  (prevState: InAppState): InAppState => ({
                    ...prevState,
                    dismiss: {
                      ...prevState.dismiss,
                      color,
                    },
                  })
                )
              }
            />
          </div>
        </div>
        {inAppState.dismiss.type === DismissType.CROSS ? (
          <div className="flex w-full items-start justify-between">
            <div className="w-full">Cross size:</div>
            <div className="w-full flex flex-col">
              <div className="w-full pl-[5px]">
                <ReactSlider
                  className="h-[20px] flex items-center justify-center mb-[8px]"
                  trackClassName="h-[4px] bg-[#818CF8] rounded"
                  min={5}
                  max={25}
                  value={inAppState.dismiss.textSize}
                  onChange={(value) =>
                    setInAppState(
                      (prevState: InAppState): InAppState => ({
                        ...prevState,
                        dismiss: {
                          ...prevState.dismiss,
                          textSize: value,
                        },
                      })
                    )
                  }
                  renderThumb={(props) => (
                    <div
                      {...props}
                      className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border-2 border-[#818CF8]"
                    />
                  )}
                />
              </div>
              <div className="flex w-full items-center pl-[5px] gap-[10px]">
                <InAppBuilderNumberInput
                  id="crossSize"
                  name="crossSize"
                  value={inAppState.dismiss.textSize}
                  unit={SizeUnit.PIXEL}
                  onChange={(value) =>
                    setInAppState(
                      (prevState: InAppState): InAppState => ({
                        ...prevState,
                        dismiss: {
                          ...prevState.dismiss,
                          textSize: value,
                        },
                      })
                    )
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>Text size:</div>
            <div className="flex items-center pl-[5px] gap-[10px]">
              <InAppBuilderNumberInput
                className="min-w-[150px]"
                id="fontSize"
                name="fontSize"
                unit={SizeUnit.PIXEL}
                value={inAppState.dismiss.textSize}
                onChange={(value) =>
                  setInAppState(
                    (prevState: InAppState): InAppState => ({
                      ...prevState,
                      dismiss: {
                        ...prevState.dismiss,
                        textSize: value,
                      },
                    })
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t-[1px] border-[#E5E7EB]" />

      <div className="p-5 flex flex-col gap-[10px]">
        <div className="w-full flex items-center justify-between gap-[10px]">
          <div className="">Timed Dismiss:</div>
          <div className="flex w-[180px] select-none">
            {timedDismissList.map((el, i) => (
              <div
                key={el.name}
                className={`flex justify-center items-center w-full h-[32px] border-[#E5E7EB] border cursor-pointer ${
                  inAppState.dismiss.timedDismiss.enabled === el.value
                    ? "bg-[#6366F1] text-white"
                    : ""
                } ${
                  i === 0
                    ? "rounded-l-[2px]"
                    : i === mediaDismissTypes.length - 1
                    ? "rounded-r-[2px]"
                    : 0
                }`}
                onClick={() =>
                  setInAppState(
                    (prevState: InAppState): InAppState => ({
                      ...prevState,
                      dismiss: {
                        ...prevState.dismiss,
                        timedDismiss: {
                          ...prevState.dismiss.timedDismiss,
                          enabled: el.value,
                        },
                      },
                    })
                  )
                }
              >
                {el.name}
              </div>
            ))}
          </div>
        </div>
        {inAppState.dismiss.timedDismiss.enabled && (
          <>
            <div className="flex items-center justify-between mt-[10px] gap-[10px]">
              <div className="w-full">Duration in seconds:</div>
              <div className="flex w-full items-center gap-[10px]">
                <InAppBuilderNumberInput
                  className="min-w-[150px]"
                  id="fontSize"
                  name="fontSize"
                  unit={SizeUnit.NONE}
                  value={inAppState.dismiss.timedDismiss.duration}
                  onChange={(value) =>
                    setInAppState(
                      (prevState: InAppState): InAppState => ({
                        ...prevState,
                        dismiss: {
                          ...prevState.dismiss,
                          timedDismiss: {
                            ...prevState.dismiss.timedDismiss,
                            duration: value,
                          },
                        },
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="w-full flex justify-between items-center mt-[10px] gap-[10px]">
              <div className="">Display Timer:</div>
              <div className="flex w-[180px] select-none">
                {timedDismissList.map((el, i) => (
                  <div
                    key={el.displayTimerText}
                    className={`flex justify-center items-center w-full h-[32px] border-[#E5E7EB] border cursor-pointer ${
                      inAppState.dismiss.timedDismiss.displayTimer === el.value
                        ? "bg-[#6366F1] text-white"
                        : ""
                    } ${
                      i === 0
                        ? "rounded-l-[2px]"
                        : i === mediaDismissTypes.length - 1
                        ? "rounded-r-[2px]"
                        : 0
                    }`}
                    onClick={() =>
                      setInAppState(
                        (prevState: InAppState): InAppState => ({
                          ...prevState,
                          dismiss: {
                            ...prevState.dismiss,
                            timedDismiss: {
                              ...prevState.dismiss.timedDismiss,
                              displayTimer: el.value,
                            },
                          },
                        })
                      )
                    }
                  >
                    {el.displayTimerText}
                  </div>
                ))}
              </div>
            </div>
            {inAppState.dismiss.timedDismiss.displayTimer && (
              <div className="flex items-center justify-between mt-[10px]">
                <div className="w-full">Timer Color:</div>
                <div className="flex w-full pl-[5px] items-center gap-[10px]">
                  <InAppBuilderColorPicker
                    className="!min-w-[180px] w-full"
                    color={inAppState.dismiss.timedDismiss.timerColor}
                    onChange={(color) =>
                      setInAppState(
                        (prevState: InAppState): InAppState => ({
                          ...prevState,
                          dismiss: {
                            ...prevState.dismiss,
                            timedDismiss: {
                              ...prevState.dismiss.timedDismiss,
                              timerColor: color,
                            },
                          },
                        })
                      )
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
        <RemoveComponentButton
          onClick={() => {
            setInAppState(
              (prevState: InAppState): InAppState => ({
                ...prevState,
                dismiss: {
                  ...prevState.dismiss,
                  hidden: true,
                },
              })
            );
            returnBack();
          }}
        >
          Remove dismiss
        </RemoveComponentButton>
      </div>
    </div>
  );
};

export default InAppEditorDismissMenu;
