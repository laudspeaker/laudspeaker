import Header from "components/Header";
import React, { ReactNode, useState } from "react";
import ModalEditor from "./ModalEditor";
import ModalViewer from "./ModalViewer";
import {
  ModalBoldTextStyleIcon,
  ModalItalicTextStyleIcon,
  ModalH1TextStyleIcon,
  ModalLinkTextStyleIcon,
  ModalMediaPositionTopIcon,
  ModalMediaPositionRightIcon,
  ModalMediaPositionBotIcon,
  ModalMediaPositionLeftIcon,
  ModalMediaActionClickNone,
  ModalMediaActionClickComplete,
} from "./Icons/ModalBuilderIcons";
import {
  NoSymbolIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";
import {
  AdditionalClickOptions,
  Alignment,
  Background,
  BackgroundType,
  Dismiss,
  DismissPosition,
  DismissType,
  GradientBackground,
  ImageBackground,
  Media,
  MediaClickAction,
  MediaPosition,
  MediaType,
  ModalPosition,
  PrimaryButton,
  PrimaryButtonPosition,
  Size,
  SizeUnit,
  SolidBackground,
  StylesVariants,
  TextBox,
} from "./types";

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

export const defaultSolidBackground: SolidBackground = {
  type: BackgroundType.SOLID,
  color: "#003C80",
  opacity: 1,
};

export const defaultGradientBackground: GradientBackground = {
  type: BackgroundType.GRADIENT,
  color1: "#FFFFFF",
  color2: "#767676",
  opacity: 1,
};

export const defaultImageBackground: ImageBackground = {
  type: BackgroundType.IMAGE,
  imageSrc: "",
};

export const textStyles = [
  StylesVariants.BOLD,
  StylesVariants.ITALIC,
  StylesVariants.H1,
  StylesVariants.LINK,
];

export const textStylesIcons: Record<StylesVariants, ReactNode> = {
  [StylesVariants.BOLD]: <ModalBoldTextStyleIcon />,
  [StylesVariants.ITALIC]: <ModalItalicTextStyleIcon />,
  [StylesVariants.H1]: <ModalH1TextStyleIcon />,
  [StylesVariants.LINK]: <ModalLinkTextStyleIcon />,
};

export const mediaTypes = [MediaType.IMAGE, MediaType.VIDEO];

export const MediaPositionMap = [
  {
    position: MediaPosition.TOP,
    icon: <ModalMediaPositionTopIcon />,
  },
  {
    position: MediaPosition.RIGHT,
    icon: <ModalMediaPositionRightIcon />,
  },
  {
    position: MediaPosition.BOTTOM,
    icon: <ModalMediaPositionBotIcon />,
  },
  {
    position: MediaPosition.LEFT,
    icon: <ModalMediaPositionLeftIcon />,
  },
];

export const MediaClickActions = [
  {
    actionOnClick: MediaClickAction.NONE,
    icon: <ModalMediaActionClickNone />,
  },
  {
    actionOnClick: MediaClickAction.COMPLETE,
    icon: <ModalMediaActionClickComplete />,
  },
];

export const AdditionalClickOptionsMenu = [
  {
    blockTitle: null,
    blockDescription: null,
    options: [
      {
        name: "No action",
        icon: <NoSymbolIcon />,
        option: AdditionalClickOptions.NOACTION,
      },
    ],
  },
  {
    blockTitle: "Product navigation",
    blockDescription: "You can only select one",
    options: [
      {
        name: "Open URL",
        icon: <ArrowTopRightOnSquareIcon />,
        option: AdditionalClickOptions.OPENURL,
      },
    ],
  },
];

const ModalBuilder = () => {
  const [modalState, setModalState] = useState<ModalState>({
    position: ModalPosition.CENTER,
    xOffset: { value: 0, unit: SizeUnit.PIXEL },
    yOffset: { value: 0, unit: SizeUnit.PIXEL },
    width: { value: 400, unit: SizeUnit.PIXEL },
    borderRadius: { value: 20, unit: SizeUnit.PIXEL },
    background: defaultSolidBackground,
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
      actionOnClick: MediaClickAction.NONE,
      height: { value: 60, unit: SizeUnit.PERCENTAGE },
      position: MediaPosition.TOP,
      videoUrl: null,
      additionalClick: [
        {
          action: AdditionalClickOptions.NOACTION,
          enabled: true,
        },
      ],
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
      color: "#FFFFFF",
      position: DismissPosition.INSIDE_RIGHT,
      timedDismiss: {
        enabled: false,
        duration: 3,
        displayTimer: false,
        timerColor: "#1CC88A",
      },
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
