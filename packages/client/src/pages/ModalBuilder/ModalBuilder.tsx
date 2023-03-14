import Header from "components/Header";
import React, { useState } from "react";
import ModalEditor from "./ModalEditor";
import ModalViewer from "./ModalViewer";

export enum ModalPosition {
  TOP_LEFT = "Top-left",
  TOP_CENTER = "Top-center",
  TOP_RIGHT = "Top-right",
  CENTER = "Center",
  BOTTOM_LEFT = "Bottom-left",
  BOTTOM_CENTER = "Bottom-center",
  BOTTOM_RIGHT = "Bottom-right",
}

export enum SizeUnit {
  PIXEL = "px",
  PERCENTAGE = "%",
}

export interface Size {
  value: number;
  unit: SizeUnit;
}

export enum BackgroundType {
  SOLID = "solid",
  GRADIENT = "gradient",
  IMAGE = "image",
}

export type Color = string;

export interface SolidBackground {
  type: BackgroundType.SOLID;
  color: Color;
  opacity: number;
}

export interface GradientBackground {
  type: BackgroundType.GRADIENT;
  color1: Color;
  color2: Color;
  opacity: number;
}

export interface ImageBackground {
  type: BackgroundType.IMAGE;
  imageSrc: string;
}

export interface ModalState {
  position: ModalPosition;
  xOffset: Size;
  yOffset: Size;
  width: Size;
  borderRadius: Size;
  background: SolidBackground | GradientBackground | ImageBackground;
}

const ModalBuilder = () => {
  const [modalState, setModalState] = useState<ModalState>({
    position: ModalPosition.CENTER,
    xOffset: { value: 0, unit: SizeUnit.PIXEL },
    yOffset: { value: 0, unit: SizeUnit.PIXEL },
    width: { value: 400, unit: SizeUnit.PIXEL },
    borderRadius: { value: 20, unit: SizeUnit.PIXEL },
    background: {
      type: BackgroundType.SOLID,
      color: "#003C80",
      opacity: 1,
    },
  });

  return (
    <div className="relative">
      <Header />
      <ModalEditor modalState={modalState} setModalState={setModalState} />
      <ModalViewer modalState={modalState} />
    </div>
  );
};

export default ModalBuilder;
