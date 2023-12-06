import { ReactNode, useEffect } from "react";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import {
  ModalDismissPositionOutRight,
  ModalDismissPositionOutLeft,
  ModalDismissPositionInRight,
  ModalDismissPositionInLeft,
  ModalDismissPositionCenterRight,
  ModalDismissPositionCenterLeft,
} from "./Icons/ModalBuilderIcons";
import { DismissPosition, DismissType, ModalState, SizeUnit } from "./types";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import ReactSlider from "react-slider";
import RemoveComponentButton from "./Elements/RemoveComponentButton";

interface IModalEditorDismissMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  returnBack: () => void;
}

export const modalPositions = [
  DismissPosition.OUTSIDE_RIGHT,
  DismissPosition.OUTSIDE_LEFT,
  DismissPosition.INSIDE_RIGHT,
  DismissPosition.INSIDE_LEFT,
  DismissPosition.CENTER_RIGHT,
  DismissPosition.CENTER_LEFT,
];

export const modalPositionIconMap: Record<DismissPosition, ReactNode> = {
  [DismissPosition.OUTSIDE_RIGHT]: <ModalDismissPositionOutRight />,
  [DismissPosition.OUTSIDE_LEFT]: <ModalDismissPositionOutLeft />,
  [DismissPosition.INSIDE_RIGHT]: <ModalDismissPositionInRight />,
  [DismissPosition.INSIDE_LEFT]: <ModalDismissPositionInLeft />,
  [DismissPosition.CENTER_RIGHT]: <ModalDismissPositionCenterRight />,
  [DismissPosition.CENTER_LEFT]: <ModalDismissPositionCenterLeft />,
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

const ModalEditorDismissMenu = ({
  modalState,
  setModalState,
  returnBack,
}: IModalEditorDismissMenuProps) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      dismiss: { ...modalState.dismiss, hidden: false },
    });
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
                  modalState.dismiss.type === el
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
                  setModalState({
                    ...modalState,
                    dismiss: { ...modalState.dismiss, type: el },
                  })
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
            {modalPositions.map((position) => (
              <li key={position}>
                <div
                  className={`flex justify-center items-center relative w-[35px] h-[35px] hover:border hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-[#111827] ${
                    position === modalState.dismiss.position
                      ? "bg-[#C7D2FE]"
                      : ""
                  }`}
                  onClick={() =>
                    setModalState({
                      ...modalState,
                      dismiss: { ...modalState.dismiss, position: position },
                    })
                  }
                >
                  {modalPositionIconMap[position]}
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
            <ModalBuilderColorPicker
              className="!min-w-[150px]"
              color={modalState.dismiss.color}
              onChange={(color) =>
                setModalState({
                  ...modalState,
                  dismiss: {
                    ...modalState.dismiss,
                    color,
                  },
                })
              }
            />
          </div>
        </div>
        {modalState.dismiss.type === DismissType.CROSS ? (
          <div className="flex w-full items-start justify-between">
            <div className="w-full">Cross size:</div>
            <div className="w-full flex flex-col">
              <div className="w-full pl-[5px]">
                <ReactSlider
                  className="h-[20px] flex items-center justify-center mb-[8px]"
                  trackClassName="h-[4px] bg-[#818CF8] rounded"
                  min={5}
                  max={25}
                  value={modalState.dismiss.textSize}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      dismiss: {
                        ...modalState.dismiss,
                        textSize: value,
                      },
                    })
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
                <ModalBuilderNumberInput
                  id="crossSize"
                  name="crossSize"
                  value={modalState.dismiss.textSize}
                  unit={SizeUnit.PIXEL}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      dismiss: {
                        ...modalState.dismiss,
                        textSize: value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>Text size:</div>
            <div className="flex items-center pl-[5px] gap-[10px]">
              <ModalBuilderNumberInput
                className="min-w-[150px]"
                id="fontSize"
                name="fontSize"
                unit={SizeUnit.PIXEL}
                value={modalState.dismiss.textSize}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    dismiss: {
                      ...modalState.dismiss,
                      textSize: value,
                    },
                  })
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
                  modalState.dismiss.timedDismiss.enabled === el.value
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
                  setModalState({
                    ...modalState,
                    dismiss: {
                      ...modalState.dismiss,
                      timedDismiss: {
                        ...modalState.dismiss.timedDismiss,
                        enabled: el.value,
                      },
                    },
                  })
                }
              >
                {el.name}
              </div>
            ))}
          </div>
        </div>
        {modalState.dismiss.timedDismiss.enabled && (
          <>
            <div className="flex items-center justify-between mt-[10px] gap-[10px]">
              <div className="w-full">Duration in seconds:</div>
              <div className="flex w-full items-center gap-[10px]">
                <ModalBuilderNumberInput
                  className="min-w-[150px]"
                  id="fontSize"
                  name="fontSize"
                  unit={SizeUnit.NONE}
                  value={modalState.dismiss.timedDismiss.duration}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      dismiss: {
                        ...modalState.dismiss,
                        timedDismiss: {
                          ...modalState.dismiss.timedDismiss,
                          duration: value,
                        },
                      },
                    })
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
                      modalState.dismiss.timedDismiss.displayTimer === el.value
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
                      setModalState({
                        ...modalState,
                        dismiss: {
                          ...modalState.dismiss,
                          timedDismiss: {
                            ...modalState.dismiss.timedDismiss,
                            displayTimer: el.value,
                          },
                        },
                      })
                    }
                  >
                    {el.displayTimerText}
                  </div>
                ))}
              </div>
            </div>
            {modalState.dismiss.timedDismiss.displayTimer && (
              <div className="flex items-center justify-between mt-[10px]">
                <div className="w-full">Timer Color:</div>
                <div className="flex w-full pl-[5px] items-center gap-[10px]">
                  <ModalBuilderColorPicker
                    className="!min-w-[180px] w-full"
                    color={modalState.dismiss.timedDismiss.timerColor}
                    onChange={(color) =>
                      setModalState({
                        ...modalState,
                        dismiss: {
                          ...modalState.dismiss,
                          timedDismiss: {
                            ...modalState.dismiss.timedDismiss,
                            timerColor: color,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
        <RemoveComponentButton
          onClick={() => {
            setModalState({
              ...modalState,
              dismiss: {
                ...modalState.dismiss,
                hidden: true,
              },
            });
            returnBack();
          }}
        >
          Remove dismiss
        </RemoveComponentButton>
      </div>
    </div>
  );
};

export default ModalEditorDismissMenu;
