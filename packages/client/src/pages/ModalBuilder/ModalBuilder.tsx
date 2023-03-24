import Header from "components/Header";
import React, { ReactNode, useState } from "react";
import ModalEditor, { PreviousModes } from "./ModalEditor";
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
  AdditionalClickOptions,
  AdditionalClicks,
  Alignment,
  Background,
  BackgroundType,
  Dismiss,
  DismissPosition,
  DismissType,
  GeneralClickActions,
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
  SubMenuOptions,
  TextBox,
} from "./types";
import { EditorMenuOptions } from "./ModalEditorMainMenu";

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
  key: null,
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

export const defaultAdditionalClicksObj: AdditionalClicks = {
  [AdditionalClickOptions.OPENURL]: {
    action: AdditionalClickOptions.OPENURL,
    hidden: true,
    object: {
      openNewTab: true,
      url: "google.com",
    },
  },
  [AdditionalClickOptions.NOACTION]: {
    action: AdditionalClickOptions.NOACTION,
    hidden: true,
    object: undefined,
  },
};

const ModalBuilder = () => {
  const [modalState, setModalState] = useState<ModalState>({
    position: ModalPosition.CENTER,
    xOffset: { value: 0, unit: SizeUnit.PIXEL },
    yOffset: { value: 0, unit: SizeUnit.PIXEL },
    width: { value: 400, unit: SizeUnit.PIXEL },
    borderRadius: { value: 20, unit: SizeUnit.PIXEL },
    background: {
      selected: BackgroundType.SOLID,
      [BackgroundType.SOLID]: defaultSolidBackground,
      [BackgroundType.GRADIENT]: defaultGradientBackground,
      [BackgroundType.IMAGE]: defaultImageBackground,
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
      imageSrc: "",
      key: null,
      altText: "",
      actionOnClick: MediaClickAction.NONE,
      height: { value: 60, unit: SizeUnit.PERCENTAGE },
      position: MediaPosition.TOP,
      videoUrl: null,
      additionalClick: JSON.parse(JSON.stringify(defaultAdditionalClicksObj)),
    },
    primaryButton: {
      hidden: false,
      fillColor: "#1A86FF",
      borderColor: "#64CF67",
      textColor: "#FFFFFF",
      borderRadius: { value: 8, unit: SizeUnit.PIXEL },
      position: PrimaryButtonPosition.BOTTOM_CENTER,
      clickAction: GeneralClickActions.NONE,
      additionalClick: JSON.parse(JSON.stringify(defaultAdditionalClicksObj)),
    },
    dismiss: {
      hidden: true,
      type: DismissType.CROSS,
      textSize: 14,
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

  const [editorMode, setEditorMode] = useState<
    EditorMenuOptions | SubMenuOptions
  >(EditorMenuOptions.MAIN);

  const [previousModes, setPreviousModes] = useState<PreviousModes>([
    EditorMenuOptions.MAIN,
  ]);

  const [currentMainMode, setCurrentMainMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );

  const handleEditorModeSet = (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious = false
  ) => {
    return () => {
      if (
        Object.values(EditorMenuOptions).some((el) => el === mode) &&
        mode !== EditorMenuOptions.MAIN
      )
        setCurrentMainMode(mode as EditorMenuOptions);

      if (setPrevious) setPreviousModes((prev) => [...prev, mode]);
      setEditorMode(mode);
    };
  };

  return (
    <div className="relative">
      <Header />
      <ModalEditor
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        modalState={modalState}
        setModalState={setModalState}
        previousModes={previousModes}
        currentMainMode={currentMainMode}
        handleEditorModeSet={handleEditorModeSet}
        setPreviousModes={setPreviousModes}
      />
      <ModalViewer
        modalState={modalState}
        handleTitleChange={(title) =>
          setModalState({
            ...modalState,
            title: { ...modalState.title, content: title },
          })
        }
        handleBodyChange={(body) =>
          setModalState({
            ...modalState,
            body: { ...modalState.body, content: body },
          })
        }
        handleEditorModeSet={handleEditorModeSet}
        editorMode={editorMode}
      />
    </div>
  );
};

export default ModalBuilder;
