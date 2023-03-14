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

export type Background = SolidBackground | GradientBackground | ImageBackground;

export enum Alignment {
  LEFT = "align-left",
  CENTER = "align-center",
  RIGHT = "align-right",
}

export interface TextBox {
  hidden: boolean;
  alignment: Alignment;
  content: string;
  textColor: Color;
  linkColor: Color;
  fontSize: number;
}

export enum MediaType {
  IMAGE = "Image",
  VIDEO = "Video",
}

export enum MediaPosition {
  TOP = "Top",
  RIGHT = "Right",
  BOTTOM = "Bottom",
  LEFT = "Left",
}

export interface CommonMedia {
  hidden: boolean;
  position: MediaPosition;
  height: Size;
}

export interface ImageMedia extends CommonMedia {
  type: MediaType.IMAGE;
  imageSrc: string;
  altText: string;
}

export interface VideoMedia extends CommonMedia {
  type: MediaType.VIDEO;
  videoUrl: string;
}

export type Media = ImageMedia | VideoMedia;

export enum PrimaryButtonPosition {
  BOTTOM_LEFT = "Bottom left",
  BOTTOM_CENTER = "Bottom center",
  BOTTOM_RIGHT = "Bottom right",
  CENTER_RIGHT = "Center right",
}

export interface PrimaryButton {
  hidden: boolean;
  fillColor: Color;
  borderColor: Color;
  textColor: Color;
  borderRadius: Size;
  position: PrimaryButtonPosition;
}

export enum DismissType {
  CROSS = "Cross",
  TEXT = "Text",
}

export enum DismissPosition {
  OUTSIDE_RIGHT = "Outside right",
}

export interface CommonDismiss {
  position: DismissPosition;
}

export interface CrossDismiss extends CommonDismiss {
  type: DismissType.CROSS;
  crossSize: Size;
}

export interface TextDismiss extends CommonDismiss {
  type: DismissType.TEXT;
  textSize: number;
}

export type Dismiss = CrossDismiss | TextDismiss;

export interface ModalState {
  position: ModalPosition;
  xOffset: Size;
  yOffset: Size;
  width: Size;
  borderRadius: Size;
  background: Background;
  title: TextBox;
  body: TextBox;
  media: Media;
  dismiss: Dismiss;
  primaryButton: PrimaryButton;
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
    title: {
      hidden: true,
      alignment: Alignment.CENTER,
      content: "",
      fontSize: 14,
      textColor: "#FFFFFF",
      linkColor: "#515E7D",
    },
    body: {
      hidden: false,
      alignment: Alignment.CENTER,
      content: `## **Say hi to our new look** 👋

We've made some changes to our styling and our navigation. We did this to speed up your workflows and save you some clicks. Take a few moments to get familiar with the changes.
`,
      fontSize: 14,
      textColor: "#FFFFFF",
      linkColor: "#515E7D",
    },
    media: {
      hidden: false,
      type: MediaType.IMAGE,
      imageSrc:
        "https://fast.chmln-cdn.com/attachments/6139382e12c3e30011a475f5/original.svg",
      altText: "",
      height: { value: 60, unit: SizeUnit.PERCENTAGE },
      position: MediaPosition.TOP,
    },
    primaryButton: {
      hidden: false,
      fillColor: "#1A86FF",
      borderColor: "#64CF67",
      textColor: "#FFFFFF",
      borderRadius: { value: 8, unit: SizeUnit.PIXEL },
      position: PrimaryButtonPosition.BOTTOM_CENTER,
    },
    dismiss: {
      type: DismissType.CROSS,
      crossSize: { value: 14, unit: SizeUnit.PIXEL },
      position: DismissPosition.OUTSIDE_RIGHT,
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
