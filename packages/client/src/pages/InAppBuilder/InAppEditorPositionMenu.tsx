import { ReactNode } from "react";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import {
  InAppPositionBottomCenterIcon,
  InAppPositionBottomLeftIcon,
  InAppPositionBottomRightIcon,
  InAppPositionCenterIcon,
  InAppPositionTopCenterIcon,
  InAppPositionTopLeftIcon,
  InAppPositionTopRightIcon,
} from "./Icons/InAppBuilderIcons";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import { InAppPosition, InAppState } from "./types";

interface IInAppPositionBodyMenuProps {
  inAppState: InAppState;
  setInAppState: (inAppState: InAppState) => void;
}

const InAppPositionBodyMenu = ({
  inAppState,
  setInAppState,
}: IInAppPositionBodyMenuProps) => {
  const inAppPositions = [
    InAppPosition.TOP_LEFT,
    InAppPosition.TOP_CENTER,
    InAppPosition.TOP_RIGHT,
    InAppPosition.CENTER,
    InAppPosition.BOTTOM_LEFT,
    InAppPosition.BOTTOM_CENTER,
    InAppPosition.BOTTOM_RIGHT,
  ];

  const inAppPositionIconMap: Record<InAppPosition, ReactNode> = {
    [InAppPosition.TOP_LEFT]: <InAppPositionTopLeftIcon />,
    [InAppPosition.TOP_CENTER]: <InAppPositionTopCenterIcon />,
    [InAppPosition.TOP_RIGHT]: <InAppPositionTopRightIcon />,
    [InAppPosition.CENTER]: <InAppPositionCenterIcon />,
    [InAppPosition.BOTTOM_LEFT]: <InAppPositionBottomLeftIcon />,
    [InAppPosition.BOTTOM_CENTER]: <InAppPositionBottomCenterIcon />,
    [InAppPosition.BOTTOM_RIGHT]: <InAppPositionBottomRightIcon />,
  };

  return (
    <div className="w-full p-5 text-[14px] font-normal">
      <div className="mb-[10px]">Position</div>
      <ul className="flex items-center justify-between mb-[10px]">
        {inAppPositions.map((position) => (
          <li key={position}>
            <div
              className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:border rounded-md cursor-pointer text-transparent hover:text-[#374151] ${
                position === inAppState.position
                  ? "bg-[#C7D2FE]"
                  : "hover:border-[#818CF8]"
              }`}
              onClick={() => setInAppState({ ...inAppState, position })}
            >
              {inAppPositionIconMap[position]}
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
          <InAppBuilderNumberInput
            id="x-axis-offset"
            name="x-axis-offset"
            value={inAppState.xOffset.value}
            onChange={(value) =>
              setInAppState({
                ...inAppState,
                xOffset: { ...inAppState.xOffset, value },
              })
            }
            unit={inAppState.xOffset.unit}
            className="!w-[130px]"
          />
          <SizeUnitPicker
            value={inAppState.xOffset.unit}
            onChange={(unit) =>
              setInAppState({
                ...inAppState,
                xOffset: { ...inAppState.xOffset, unit },
              })
            }
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Y axis offset:</div>
        <div className="flex items-center gap-[10px]">
          <InAppBuilderNumberInput
            id="y-axis-offset"
            name="y-axis-offset"
            value={inAppState.yOffset.value}
            onChange={(value) =>
              setInAppState({
                ...inAppState,
                yOffset: { ...inAppState.yOffset, value },
              })
            }
            unit={inAppState.yOffset.unit}
            className="!w-[130px]"
          />
          <SizeUnitPicker
            value={inAppState.yOffset.unit}
            onChange={(unit) =>
              setInAppState({
                ...inAppState,
                yOffset: { ...inAppState.yOffset, unit },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default InAppPositionBodyMenu;
