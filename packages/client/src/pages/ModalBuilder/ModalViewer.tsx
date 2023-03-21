import React, { FC } from "react";
import { ModalState } from "./ModalBuilder";
import { BackgroundType, ModalPosition } from "./types";

interface ModalViewerProps {
  modalState: ModalState;
}

const positionMargin = 20;
const centerPosition = "50%";

const modalPositionMap: Record<
  ModalPosition,
  {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
  }
> = {
  [ModalPosition.BOTTOM_CENTER]: {
    bottom: positionMargin,
    left: centerPosition,
  },
  [ModalPosition.BOTTOM_LEFT]: {
    left: positionMargin,
    bottom: positionMargin,
  },
  [ModalPosition.BOTTOM_RIGHT]: {
    right: positionMargin,
    bottom: positionMargin,
  },
  [ModalPosition.CENTER]: {
    left: centerPosition,
    top: centerPosition,
  },
  [ModalPosition.TOP_CENTER]: {
    top: positionMargin,
    left: centerPosition,
  },
  [ModalPosition.TOP_LEFT]: {
    top: positionMargin,
    left: positionMargin,
  },
  [ModalPosition.TOP_RIGHT]: {
    top: positionMargin,
    right: positionMargin,
  },
};

const ModalViewer: FC<ModalViewerProps> = ({ modalState }) => {
  return (
    <div
      style={{
        zIndex: 999999999,
        position: "fixed",
        top: modalPositionMap[modalState.position].top,
        left: modalPositionMap[modalState.position].left,
        right: modalPositionMap[modalState.position].right,
        bottom: modalPositionMap[modalState.position].bottom,
        width: `${modalState.width.value}${modalState.width.unit}`,
        transform: `translateX(${modalState.xOffset.value}${modalState.xOffset.unit}) translateY(${modalState.yOffset.value}${modalState.yOffset.unit})`,
        borderRadius: `${modalState.borderRadius.value}${modalState.borderRadius.unit}`,
        background:
          modalState.background.type === BackgroundType.SOLID
            ? `${modalState.background.color}${
                (modalState.background.opacity * 255).toString(16).split(".")[0]
              }`
            : "",
      }}
      className={`${
        [
          ModalPosition.BOTTOM_CENTER,
          ModalPosition.CENTER,
          ModalPosition.TOP_CENTER,
        ].includes(modalState.position)
          ? "!-translate-x-1/2"
          : ""
      } ${
        modalState.position === ModalPosition.CENTER ? "!-translate-y-1/2" : ""
      }`}
    >
      {!modalState.title.hidden && modalState.title.content}
      {!modalState.body.hidden && modalState.body.content}
    </div>
  );
};

export default ModalViewer;
