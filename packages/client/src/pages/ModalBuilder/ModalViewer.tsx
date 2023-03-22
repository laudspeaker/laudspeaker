import React, { CSSProperties, FC } from "react";
import { ModalState } from "./ModalBuilder";
import { BackgroundType, ModalPosition, SizeUnit } from "./types";

interface ModalViewerProps {
  modalState: ModalState;
}

const modalPositionMap: Record<ModalPosition, CSSProperties> = {
  [ModalPosition.BOTTOM_CENTER]: {
    justifyContent: "center",
    alignItems: "end",
  },
  [ModalPosition.BOTTOM_LEFT]: {
    justifyContent: "start",
    alignItems: "end",
  },
  [ModalPosition.BOTTOM_RIGHT]: {
    justifyContent: "end",
    alignItems: "end",
  },
  [ModalPosition.CENTER]: {
    justifyContent: "center",
    alignItems: "center",
  },
  [ModalPosition.TOP_CENTER]: {
    justifyContent: "center",
    alignItems: "start",
  },
  [ModalPosition.TOP_LEFT]: {
    justifyContent: "start",
    alignItems: "start",
  },
  [ModalPosition.TOP_RIGHT]: {
    justifyContent: "end",
    alignItems: "start",
  },
};

const ModalViewer: FC<ModalViewerProps> = ({ modalState }) => {
  const CanvasBackground: Record<BackgroundType, string> = {
    [BackgroundType.SOLID]: `${
      modalState.background[BackgroundType.SOLID].color
    }${
      (modalState.background[BackgroundType.SOLID].opacity * 255)
        .toString(16)
        .split(".")[0]
    }`,
    [BackgroundType.GRADIENT]: `linear-gradient(45deg, ${
      modalState.background[BackgroundType.GRADIENT].color1
    }${
      (modalState.background[BackgroundType.GRADIENT].opacity * 255)
        .toString(16)
        .split(".")[0]
    } 0%, ${modalState.background[BackgroundType.GRADIENT].color2}${
      (modalState.background[BackgroundType.GRADIENT].opacity * 255)
        .toString(16)
        .split(".")[0]
    }) 100%`,
    // TODO: update when will work with image upload
    [BackgroundType.IMAGE]:
      "url(https://cdn.pixabay.com/photo/2015/04/19/08/32/marguerite-729510__340.jpg)",
  };

  return (
    <div
      style={{ ...modalPositionMap[modalState.position] }}
      className="left-0 top-0 min-h-screen w-screen flex fixed z-[2147483645]"
    >
      <div
        style={{
          top: `${modalState.yOffset.value}${
            modalState.yOffset.unit === SizeUnit.PERCENTAGE
              ? "vw"
              : SizeUnit.PIXEL
          }`,
          left: `${modalState.xOffset.value}${
            modalState.xOffset.unit === SizeUnit.PERCENTAGE
              ? "vw"
              : SizeUnit.PIXEL
          }`,
          width: `${modalState.width.value}${
            modalState.width.unit === SizeUnit.PERCENTAGE
              ? "vw"
              : SizeUnit.PIXEL
          }`,
          // transform: `translateX() translateY(${modalState.yOffset.value}${modalState.yOffset.unit})`,
          borderRadius: `${modalState.borderRadius.value}${modalState.borderRadius.unit}`,
          background: CanvasBackground[modalState.background.selected],
        }}
        className={`relative p-[18px]`}
      >
        {!modalState.title.hidden && modalState.title.content}
        {!modalState.body.hidden && modalState.body.content}
      </div>
    </div>
  );
};

export default ModalViewer;
