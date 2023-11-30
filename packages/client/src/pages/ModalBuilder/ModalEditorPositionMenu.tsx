import { ReactNode } from "react";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import {
  ModalPositionBottomCenterIcon,
  ModalPositionBottomLeftIcon,
  ModalPositionBottomRightIcon,
  ModalPositionCenterIcon,
  ModalPositionTopCenterIcon,
  ModalPositionTopLeftIcon,
  ModalPositionTopRightIcon,
} from "./Icons/ModalBuilderIcons";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import { ModalPosition, ModalState } from "./types";

interface IModalPositionBodyMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

const ModalPositionBodyMenu = ({
  modalState,
  setModalState,
}: IModalPositionBodyMenuProps) => {
  const modalPositions = [
    ModalPosition.TOP_LEFT,
    ModalPosition.TOP_CENTER,
    ModalPosition.TOP_RIGHT,
    ModalPosition.CENTER,
    ModalPosition.BOTTOM_LEFT,
    ModalPosition.BOTTOM_CENTER,
    ModalPosition.BOTTOM_RIGHT,
  ];

  const modalPositionIconMap: Record<ModalPosition, ReactNode> = {
    [ModalPosition.TOP_LEFT]: <ModalPositionTopLeftIcon />,
    [ModalPosition.TOP_CENTER]: <ModalPositionTopCenterIcon />,
    [ModalPosition.TOP_RIGHT]: <ModalPositionTopRightIcon />,
    [ModalPosition.CENTER]: <ModalPositionCenterIcon />,
    [ModalPosition.BOTTOM_LEFT]: <ModalPositionBottomLeftIcon />,
    [ModalPosition.BOTTOM_CENTER]: <ModalPositionBottomCenterIcon />,
    [ModalPosition.BOTTOM_RIGHT]: <ModalPositionBottomRightIcon />,
  };

  return (
    <div className="w-full p-5 text-[14px] font-normal">
      <div className="mb-[10px]">Position</div>
      <ul className="flex items-center justify-between mb-[10px]">
        {modalPositions.map((position) => (
          <li key={position}>
            <div
              className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:border rounded-md cursor-pointer text-transparent hover:text-[#374151] ${
                position === modalState.position
                  ? "bg-[#C7D2FE]"
                  : "hover:border-[#818CF8]"
              }`}
              onClick={() => setModalState({ ...modalState, position })}
            >
              {modalPositionIconMap[position]}
              <div className="absolute z-[1111] text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                {position}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between mb-[10px]">
        <div>X axis offset:</div>
        <div className="flex items-center gap-[10px]">
          <ModalBuilderNumberInput
            id="x-axis-offset"
            name="x-axis-offset"
            value={modalState.xOffset.value}
            onChange={(value) =>
              setModalState({
                ...modalState,
                xOffset: { ...modalState.xOffset, value },
              })
            }
            unit={modalState.xOffset.unit}
            className="!w-[130px]"
          />
          <SizeUnitPicker
            value={modalState.xOffset.unit}
            onChange={(unit) =>
              setModalState({
                ...modalState,
                xOffset: { ...modalState.xOffset, unit },
              })
            }
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Y axis offset:</div>
        <div className="flex items-center gap-[10px]">
          <ModalBuilderNumberInput
            id="y-axis-offset"
            name="y-axis-offset"
            value={modalState.yOffset.value}
            onChange={(value) =>
              setModalState({
                ...modalState,
                yOffset: { ...modalState.yOffset, value },
              })
            }
            unit={modalState.yOffset.unit}
            className="!w-[130px]"
          />
          <SizeUnitPicker
            value={modalState.yOffset.unit}
            onChange={(unit) =>
              setModalState({
                ...modalState,
                yOffset: { ...modalState.yOffset, unit },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ModalPositionBodyMenu;
