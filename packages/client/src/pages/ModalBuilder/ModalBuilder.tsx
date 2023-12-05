import React, { ReactNode, useEffect, useLayoutEffect, useState } from "react";
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
  GeneralClickAction,
  GradientBackground,
  ImageBackground,
  Media,
  MediaClickAction,
  MediaPosition,
  MediaType,
  ModalPosition,
  ModalState,
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
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ApiConfig } from "../../constants";
import ApiService from "services/api.service";
import { TemplateType } from "types/Template";
import { useDebounce } from "react-use";
import ModalPreview from "./ModalPreview";
import { Modal } from "./Elements/Modal";

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
    text: "No action",
    actionOnClick: MediaClickAction.NONE,
  },
  {
    text: "Complete tour",
    actionOnClick: MediaClickAction.COMPLETE,
  },
];

export const PrimaryButtonClickActions = [
  {
    text: "No action",
    actionOnClick: GeneralClickAction.NONE,
  },
  {
    text: "Complete tour",
    actionOnClick: GeneralClickAction.COMPLETE,
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

export enum SaveState {
  EDITING = "Editing",
  SAVING = "Saving",
  SAVED = "Saved",
  ERROR = "Error",
}

export const defaultModalState = {
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
    content: "Read more",
    fillColor: "#1A86FF",
    borderColor: "#64CF67",
    textColor: "#FFFFFF",
    borderRadius: { value: 8, unit: SizeUnit.PIXEL },
    position: PrimaryButtonPosition.BOTTOM_CENTER,
    clickAction: GeneralClickAction.NONE,
    additionalClick: JSON.parse(JSON.stringify(defaultAdditionalClicksObj)),
  },
  dismiss: {
    hidden: true,
    content: "close",
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
};

const ModalBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [modalState, setModalState] = useState<ModalState>(defaultModalState);
  const [editorMode, setEditorMode] = useState<
    EditorMenuOptions | SubMenuOptions
  >(EditorMenuOptions.MAIN);
  const [previousModes, setPreviousModes] = useState<PreviousModes>([
    EditorMenuOptions.MAIN,
  ]);
  const [currentMainMode, setCurrentMainMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );
  const [templateId, setTemplateId] = useState<string>();
  const [saveState, setSaveState] = useState<SaveState>(SaveState.SAVED);
  const [isPreview, setIsPreview] = useState(false);
  const [firstRender, setFirstRender] = useState(true);

  useLayoutEffect(() => {
    (async () => {
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllTemplates}/${id}`,
        });

        setTemplateId(data.id);
        setModalState(data.modalState || modalState);
      } finally {
        setFirstRender(false);
      }
    })();
  }, []);

  const onSave = async () => {
    if (firstRender) return;
    setSaveState(SaveState.SAVING);
    try {
      const reqBody = {
        name,
        type: TemplateType.MODAL,
        modalState,
      };

      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${id}`,
        options: {
          ...reqBody,
        },
      });
      setSaveState(SaveState.SAVED);
    } catch (e) {
      toast.error("Error while saving");
      setSaveState(SaveState.ERROR);
    }
  };

  useEffect(() => {
    if (firstRender) return;
    setSaveState(SaveState.EDITING);
  }, [modalState]);

  useDebounce(onSave, 500, [modalState]);

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
    <div className="min-h-screen w-full fixed top-0 left-0">
      <div className="relative w-full">
        <div
          className="w-full h-[60px] px-5 py-[19px] flex  justify-between items-center bg-[#F9FAFB] font-inter font-normal text-[14px] leading-[22px] text-[#111827]"
          id="modalHeader"
        >
          {isPreview ? (
            <div
              className="bg-[#6366F1] text-white border border-[#6366F1] px-[15px] py-[4px] rounded font-roboto select-none cursor-pointer"
              onClick={() => setIsPreview(false)}
            >
              Back to edit
            </div>
          ) : (
            <>
              <div className="flex gap-[40px]">
                <div
                  className="flex gap-[5px] items-center select-none cursor-pointer"
                  onClick={() => navigate("/templates")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.8125 14.625L6.1875 9L11.8125 3.375"
                      stroke="black"
                      strokeWidth="1.125"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>Back</div>
                </div>

                <div
                  className="border border-[#E5E7EB] py-[4px] px-[10px] flex items-center gap-[5px] select-none cursor-pointer"
                  onClick={() => setIsPreview(true)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5271 9.2415C1.47534 9.08594 1.47534 8.91781 1.5271 8.76225C2.56735 5.6325 5.5201 3.375 9.0001 3.375C12.4786 3.375 15.4298 5.63025 16.4723 8.7585C16.5248 8.91375 16.5248 9.08175 16.4723 9.23775C15.4328 12.3675 12.4801 14.625 9.0001 14.625C5.5216 14.625 2.5696 12.3697 1.5271 9.2415Z"
                      stroke="#4B5563"
                      strokeWidth="1.125"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M11.25 9C11.25 9.59674 11.0129 10.169 10.591 10.591C10.169 11.0129 9.59674 11.25 9 11.25C8.40326 11.25 7.83097 11.0129 7.40901 10.591C6.98705 10.169 6.75 9.59674 6.75 9C6.75 8.40326 6.98705 7.83097 7.40901 7.40901C7.83097 6.98705 8.40326 6.75 9 6.75C9.59674 6.75 10.169 6.98705 10.591 7.40901C11.0129 7.83097 11.25 8.40326 11.25 9Z"
                      stroke="#4B5563"
                      strokeWidth="1.125"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <div className="font-roboto">Preview</div>
                </div>
              </div>
              <div className="ml-auto mr-[10px] text-[#4B5563]">
                Status: {saveState}
              </div>
            </>
          )}
        </div>
        <div className="relative h-[calc(100vh-60px)]">
          {isPreview ? (
            <Modal modalState={modalState} />
          ) : (
            <>
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
                handleDismissTextChange={(text) =>
                  setModalState({
                    ...modalState,
                    dismiss: { ...modalState.dismiss, content: text },
                  })
                }
                handlePrimaryButtonTextChange={(text) =>
                  setModalState({
                    ...modalState,
                    primaryButton: {
                      ...modalState.primaryButton,
                      content: text,
                    },
                  })
                }
                handleEditorModeSet={handleEditorModeSet}
                editorMode={editorMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalBuilder;
