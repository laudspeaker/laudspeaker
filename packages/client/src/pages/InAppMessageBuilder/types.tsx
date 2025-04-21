import { DrawerAction } from "pages/FlowBuilderv2/Drawer/drawer.fixtures";
import { OnboardingAction } from "pages/Onboardingv2/OnboardingSandbox";

export interface FlowBuilderDrawerFixture {
  groupName: string;
  children: {
    id: DrawerAction | OnboardingAction;
    icon: JSX.Element;
    text: string;
    disabled?: boolean;
    targetId?: string;
  }[];
}

export interface FlowBuilderDrawerProps {
  fixtures?: FlowBuilderDrawerFixture[];
  disableStepsCreation?: boolean;
}

export enum fontWeight {
  NORMAL = "400",
  SEMIBOLD = "500",
  BOLD = "600",
}

export enum fontStyle {
  NORMAL = "normal",
  ITALIC = "italic",
}
export enum textDecoration {
  NONE = "none",
  UNDERLINE = "underline",
  STRIKETHROUGH = "line-through",
}
export enum textAlign {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
}

export enum units {
  PX = "px",
  PERCENT = "%",
}

export enum action {
  NO_ACTION = "no action",
  OPEN_URL = "open url",
}

export enum position {
  ABOVE = "above",
  RIGHT = "right",
  BELOW = "bellow",
  LEFT = "left",
}

export interface ITextElement {
  value: string;
  bottomMargin: number;
  fontSize: number;
  fontWeight: fontWeight;
  color: string;
  textAlign: textAlign;
  fontStyle: fontStyle;
  textDecoration: textDecoration[];
  lineHeightPx?: number;
  lineHeight?: number;
}

export interface ICanvas {
  width: IWidth;
  height: IWidth;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  paddingBottom?: number;
  fill: IColor;
  border: IColor;
}

export interface IImageElement {
  src: string;
  action: action;
  width: IWidth;
  height: number;
  borderRadius: number;
  bottomMargin: number;
  position: position;
}

export interface IColor {
  color: string;
  opacity: number;
  isVisible: boolean;
}

export interface IWidth {
  value: number;
  units: units;
}

export enum dismissButtonPosition {
  RIGHT_INSIDE = "right inside",
  LEFT_INSIDE = "left inside",
  BOTTOM = "bottom",
  RIGHT_OUTSIDE = "right outside",
  LEFT_OUTSIDE = "left outside",
}

export enum buttonPosition {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
}

export interface IDismissButton {
  width: IWidth;
  height: number;
  position: dismissButtonPosition;
  positionCoordinates: { x: number; y: number };
  fill: IColor;
  border: IColor;
}

export interface IButton {
  value: string;
  fontSize: number;
  fontColor: string;
  action: { type: action; url?: string };
  width: IWidth;
  height: number;
  borderRadius: number;
  bottomMargin: number;
  position: buttonPosition;
  fill: IColor;
  border: IColor;
  isAbsolute?: boolean; //used for horizontal alignment of buttons
  absolutePosition?: { x: number; y: number }; //x is right for primary button and lefT for secondary button
}

export interface ILayout {
  type?: string;
  overlayColor?: IColor;
  title?: ITextElement;
  canvas: ICanvas;
  dismissButton?: IDismissButton;
  image?: IImageElement;
  bodyText?: ITextElement;
  primaryButton?: IButton;
  secondaryButton?: IButton;
  order?: (
    | "dismissButton"
    | "image"
    | "title"
    | "bodyText"
    | "primaryButton"
    | "secondaryButton"
  )[];
}

export interface ITemplate {
  id: string;
  layout: ILayout;
}
