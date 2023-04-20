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
  Shroud,
  Size,
  SizeUnit,
  SolidBackground,
  StylesVariants,
  SubMenuOptions,
  TextBox,
} from "./types";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { GenericButton } from "components/Elements";
import { useNavigate } from "react-router-dom";

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
  shroud: Shroud;
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
  const navigate = useNavigate();

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
    shroud: {
      hidden: false,
      color: "#000000",
      opacity: 0.8,
      blur: 2,
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
    <div className="min-h-screen fixed top-0 left-0">
      <div className="relative">
        <div
          className="h-[60px] flex items-center bg-[#19362e] text-[#BAC3C0] text-[10px]"
          id="modalHeader"
        >
          <button
            className="w-[60px] border-r-[1px] border-white hover:text-white"
            onClick={() => navigate("/home")}
          >
            <div className="flex flex-col justify-between items-center">
              <svg
                className="rotate-180"
                viewBox="989 17 20 16"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
              >
                <path
                  d="M1007.051 33h-16.41c-.906 0-1.641-.716-1.641-1.6V18.6c0-.884.735-1.6 1.641-1.6h16.41c.907 0 1.641.716 1.641 1.6v12.8c0 .884-.734 1.6-1.64 1.6zm-8.387-8.33l-4.081-2.796a.43.43 0 0 0-.434-.031.409.409 0 0 0-.23.359v5.591a.41.41 0 0 0 .23.36.43.43 0 0 0 .434-.032l4.08-2.796a.396.396 0 0 0 .177-.328.396.396 0 0 0-.176-.327zm8.387-5.67c0-.22-.183-.4-.41-.4h-3.282c-.227 0-.41.18-.41.4v12c0 .22.183.4.41.4h3.282c.227 0 .41-.18.41-.4V19z"
                  fill="currentColor"
                  fill-rule="evenodd"
                ></path>
              </svg>
              <div>BACK</div>
            </div>
          </button>
          <button
            className="w-[60px] text-white flex justify-center items-center hover:text-white"
            onClick={() => {}}
          >
            <div className="border-b-[1px] w-fit">
              <div>
                <svg viewBox="0 0 48 38" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#FFF" fill-rule="evenodd">
                    <path
                      d="M44 38H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4zm-2.5-3c1.933 0 3.5-1.508 3.5-3.368V6.368C45 4.508 43.433 3 41.5 3h-35C4.567 3 3 4.508 3 6.368v25.264C3 33.492 4.567 35 6.5 35h35z"
                      fill-rule="nonzero"
                    ></path>
                    <path d="M12.017 30.474l1.102-3.673a4.361 4.361 0 0 1 1.093-1.83l14-14.002a.545.545 0 0 1 .772 0l3.045 3.046a.545.545 0 0 1 0 .77l-14 14.002c-.51.51-1.14.887-1.833 1.095l-3.67 1.1a.41.41 0 0 1-.509-.508zM34.024 7.477l1.499 1.5a1.63 1.63 0 0 1 0 2.304l-1.827 1.826a.543.543 0 0 1-.769 0l-3.035-3.035a.543.543 0 0 1 0-.768l1.827-1.827a1.63 1.63 0 0 1 2.305 0z"></path>
                  </g>
                </svg>
                <div>EDIT</div>
              </div>
            </div>
          </button>
          <button
            className="w-[60px] flex justify-center items-center hover:text-white"
            onClick={() => {}}
          >
            <div className="w-fit flex justify-center items-center flex-col">
              <svg
                viewBox="0 0 48 38"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
              >
                <g fill="currentColor" fill-rule="evenodd">
                  <path
                    d="M44 38H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4zm-2.5-3c1.933 0 3.5-1.508 3.5-3.368V6.368C45 4.508 43.433 3 41.5 3h-35C4.567 3 3 4.508 3 6.368v25.264C3 33.492 4.567 35 6.5 35h35z"
                    fill-rule="nonzero"
                  ></path>
                  <path d="M16.375 10.1l17.1 8.55a.95.95 0 0 1 0 1.7l-17.1 8.55A.95.95 0 0 1 15 28.05v-17.1a.95.95 0 0 1 1.375-.85z"></path>
                </g>
              </svg>
              <div>PREVIEW</div>
            </div>
          </button>
        </div>
        <div className="relative h-[calc(100vh-60px)]">
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
      </div>
    </div>
  );
};

export default ModalBuilder;
