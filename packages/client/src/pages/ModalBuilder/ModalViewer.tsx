import React, { CSSProperties, FC, ReactNode } from "react";
import {
  Alignment,
  BackgroundType,
  DismissPosition,
  DismissType,
  MediaPosition,
  MediaType,
  ModalPosition,
  ModalState,
  PrimaryButtonPosition,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import ReactMarkdown from "react-markdown";
import ModalViewerTextArea from "./Elements/ModalViewerTextArea";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  YouTubeEmbed,
  FacebookEmbed,
  InstagramEmbed,
  TwitterEmbed,
} from "react-social-media-embed";
import { getSocialMediaPlatform, SocialMedia } from "helpers/socialMedia";

interface ModalViewerProps {
  modalState: ModalState;
  handleBodyChange: (body: string) => void;
  handleTitleChange: (title: string) => void;
  handlePrimaryButtonTextChange: (text: string) => void;
  handleDismissTextChange: (text: string) => void;
  handleEditorModeSet: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  editorMode: EditorMenuOptions | SubMenuOptions;
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

const mediaPositionMap: Record<MediaPosition, string> = {
  [MediaPosition.TOP]: "flex-col",
  [MediaPosition.BOTTOM]: "flex-col-reverse",
  [MediaPosition.LEFT]: "flex-row",
  [MediaPosition.RIGHT]: "flex-row-reverse",
};

const dismissPositionMap: Record<DismissPosition, string> = {
  [DismissPosition.CENTER_LEFT]: "left-[10px] top-1/2 -translate-y-1/2",
  [DismissPosition.CENTER_RIGHT]: "right-[10px] top-1/2 -translate-y-1/2",
  [DismissPosition.INSIDE_LEFT]: "left-[20px] top-[10px]",
  [DismissPosition.INSIDE_RIGHT]: "right-[20px] top-[10px]",
  [DismissPosition.OUTSIDE_LEFT]: "left-[-20px] top-0",
  [DismissPosition.OUTSIDE_RIGHT]: "right-[-20px] top-0",
};

const primaryButtomPositionMap: Record<PrimaryButtonPosition, string> = {
  [PrimaryButtonPosition.BOTTOM_CENTER]: "w-fit mx-auto",
  [PrimaryButtonPosition.BOTTOM_LEFT]: "float-left",
  [PrimaryButtonPosition.BOTTOM_RIGHT]: "float-right",
  [PrimaryButtonPosition.CENTER_RIGHT]: "",
};

const alignmentStyleMap: Record<Alignment, "left" | "center" | "right"> = {
  [Alignment.LEFT]: "left",
  [Alignment.CENTER]: "center",
  [Alignment.RIGHT]: "right",
};

const ModalViewer: FC<ModalViewerProps> = ({
  modalState,
  handleBodyChange,
  handleTitleChange,
  handleEditorModeSet,
  editorMode,
  handleDismissTextChange,
  handlePrimaryButtonTextChange,
}) => {
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
    [BackgroundType.IMAGE]: `url(${
      modalState.background[BackgroundType.IMAGE].imageSrc
    })`,
  };

  return (
    <div
      style={{
        ...modalPositionMap[modalState.position],
        ...(modalState.shroud.hidden
          ? {}
          : {
              backgroundColor: `${modalState.shroud.color}${
                (modalState.shroud.opacity * 255).toString(16).split(".")[0]
              }`,
              backdropFilter: `blur(${modalState.shroud.blur}px)`,
            }),
      }}
      className="h-full w-screen flex z-[2147483645] p-5"
    >
      <style>
        {`
        h1 {
          font-size: 2em;
        }
        h2 {
          font-size: 1.4em;
        }
        #modal-viewer-title-wrapper a {
          color: ${modalState.title.linkColor} !important
        }
        #modal-viewer-body-wrapper a {
          color: ${modalState.body.linkColor} !important
        }
        `}
      </style>
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
        id="modalView"
        className={`relative p-[18px]`}
        onClick={(e) => {
          e.stopPropagation();
          handleEditorModeSet(
            EditorMenuOptions.CANVAS,
            editorMode === EditorMenuOptions.MAIN
          )();
        }}
      >
        <div
          className={`absolute select-none cursor-pointer ${
            dismissPositionMap[modalState.dismiss.position]
          } ${modalState.dismiss.hidden && "hidden"}`}
          style={{
            color: modalState.dismiss.color,
            fontSize: modalState.dismiss.textSize,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleEditorModeSet(
              EditorMenuOptions.DISMISS,
              editorMode === EditorMenuOptions.MAIN
            )();
          }}
        >
          {modalState.dismiss.type === DismissType.CROSS ? (
            <div
              id="dismiss-wrapper"
              style={
                modalState.dismiss.timedDismiss.enabled &&
                modalState.dismiss.timedDismiss.displayTimer
                  ? {
                      borderRadius: "100%",
                      position: "relative",
                    }
                  : {}
              }
            >
              <svg
                className={`absolute top-1/2 left-1/2 -translate-x-[calc(50%-0.5px)] -translate-y-[calc(50%-1px)] ${
                  modalState.dismiss.timedDismiss.enabled &&
                  modalState.dismiss.timedDismiss.displayTimer
                    ? ""
                    : "hidden"
                }`}
                style={{
                  width: modalState.dismiss.textSize + 2,
                  height: modalState.dismiss.textSize + 2,
                }}
              >
                <circle
                  style={{
                    color: modalState.dismiss.timedDismiss.timerColor,
                  }}
                  strokeWidth="2"
                  strokeDasharray={modalState.dismiss.textSize * Math.PI}
                  strokeDashoffset={
                    modalState.dismiss.textSize * Math.PI -
                    1 * modalState.dismiss.textSize * Math.PI
                  }
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={modalState.dismiss.textSize / 2}
                  cx={modalState.dismiss.textSize / 2 + 1}
                  cy={modalState.dismiss.textSize / 2 + 1}
                />
              </svg>
              <span
                className="text-xl"
                style={{
                  color: modalState.dismiss.color,
                }}
              >
                <PlusIcon
                  className="rotate-45"
                  width={modalState.dismiss.textSize}
                />
              </span>
            </div>
          ) : (
            <div className="relative rotate-180">
              <div className="text-transparent p-[5px] rotate-180">
                {modalState.dismiss.content}
              </div>

              {editorMode === EditorMenuOptions.DISMISS ? (
                <input
                  type="text"
                  value={modalState.dismiss.content}
                  onChange={(e) => handleDismissTextChange(e.target.value)}
                  style={{
                    fontSize: "inherit",
                    fontWeight: "inherit",
                  }}
                  className="absolute z-[9999] top-0 left-0 bg-transparent p-[5px] max-w-full h-full border-transparent rotate-180"
                />
              ) : (
                <div className="absolute z-[9999] top-0 left-0 h-full p-[5px] rotate-180">
                  {modalState.dismiss.content}
                </div>
              )}

              <div
                className="absolute rounded top-0 left-0 h-full"
                style={{
                  background:
                    modalState.dismiss.timedDismiss.enabled &&
                    modalState.dismiss.timedDismiss.displayTimer
                      ? modalState.dismiss.timedDismiss.timerColor
                      : "",
                  width: "100%",
                }}
              />
            </div>
          )}
        </div>
        <div>
          <div
            id="modal-viewer-title-wrapper"
            className={modalState.title.hidden ? "hidden" : undefined}
          >
            {editorMode === EditorMenuOptions.TITLE ? (
              <ModalViewerTextArea
                value={modalState.title.content}
                onChange={handleTitleChange}
                style={{
                  textAlign: alignmentStyleMap[modalState.title.alignment],
                  color: modalState.title.textColor,
                  fontSize: modalState.title.fontSize,
                }}
                id="modal-builder-title-textarea"
              />
            ) : (
              <p
                style={{
                  textAlign: alignmentStyleMap[modalState.title.alignment],
                  color: modalState.title.textColor,
                  fontSize: modalState.title.fontSize,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditorModeSet(
                    EditorMenuOptions.TITLE,
                    editorMode === EditorMenuOptions.MAIN
                  )();
                }}
                className="min-h-[20px]"
              >
                <ReactMarkdown className="whitespace-pre-line">
                  {modalState.title.content}
                </ReactMarkdown>
              </p>
            )}
          </div>
          <div
            className={
              modalState.primaryButton.position ===
              PrimaryButtonPosition.CENTER_RIGHT
                ? "flex items-center justify-between gap-[10px]"
                : ""
            }
          >
            <div
              className={`flex ${
                mediaPositionMap[modalState.media.position]
              } justify-center items-center`}
            >
              <div
                className={
                  modalState.media.hidden
                    ? "hidden"
                    : "flex justify-center items-center"
                }
                style={{
                  width: `${modalState.media.height.value}${modalState.media.height.unit}`,
                }}
              >
                {modalState.media.type === MediaType.IMAGE && (
                  <img
                    className="w-full"
                    src={modalState.media.imageSrc || ""}
                    alt={modalState.media.altText}
                  />
                )}
                {modalState.media.type === MediaType.VIDEO && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {(() => {
                      const platform = getSocialMediaPlatform(
                        modalState.media.videoUrl || ""
                      );

                      const coorelation: { [key: string]: ReactNode } = {
                        [SocialMedia.YouTube]: (
                          <YouTubeEmbed
                            height={"100%"}
                            url={modalState.media.videoUrl || ""}
                            width={
                              modalState.media.height.value +
                              modalState.media.height.unit
                            }
                          />
                        ),
                        [SocialMedia.Facebook]: (
                          <FacebookEmbed
                            url={modalState.media.videoUrl || ""}
                            width={
                              modalState.media.height.value +
                              modalState.media.height.unit
                            }
                          />
                        ),
                        [SocialMedia.Instagram]: (
                          <InstagramEmbed
                            url={modalState.media.videoUrl || ""}
                            width={
                              modalState.media.height.value +
                              modalState.media.height.unit
                            }
                          />
                        ),
                        [SocialMedia.Twitter]: (
                          <TwitterEmbed
                            url={modalState.media.videoUrl || ""}
                            width={
                              modalState.media.height.value +
                              modalState.media.height.unit
                            }
                          />
                        ),
                      };

                      return coorelation[platform] || <></>;
                    })()}
                  </div>
                )}
              </div>
              <div
                id="modal-viewer-body-wrapper"
                className={modalState.body.hidden ? "hidden" : undefined}
              >
                {editorMode === EditorMenuOptions.BODY ? (
                  <ModalViewerTextArea
                    value={modalState.body.content}
                    onChange={handleBodyChange}
                    style={{
                      textAlign: alignmentStyleMap[modalState.body.alignment],
                      color: modalState.body.textColor,
                      fontSize: modalState.body.fontSize,
                    }}
                    id="modal-builder-body-textarea"
                  />
                ) : (
                  <p
                    style={{
                      textAlign: alignmentStyleMap[modalState.body.alignment],
                      color: modalState.body.textColor,
                      fontSize: modalState.body.fontSize,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditorModeSet(
                        EditorMenuOptions.BODY,
                        editorMode === EditorMenuOptions.MAIN
                      )();
                    }}
                    className="min-h-[20px]"
                  >
                    <ReactMarkdown className="whitespace-pre-line">
                      {modalState.body.content}
                    </ReactMarkdown>
                  </p>
                )}
              </div>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleEditorModeSet(
                  EditorMenuOptions.PRIMARY,
                  editorMode === EditorMenuOptions.MAIN
                )();
              }}
              className={`flex justify-center items-center whitespace-nowrap h-fit p-[5px_9px_3px_9px] select-none cursor-pointer border-2 mt-[18px] ${
                primaryButtomPositionMap[modalState.primaryButton.position]
              } ${modalState.primaryButton.hidden && "hidden"}`}
              style={{
                backgroundColor: modalState.primaryButton.fillColor,
                color: modalState.primaryButton.textColor,
                borderColor: modalState.primaryButton.borderColor,
                borderRadius: `${modalState.primaryButton.borderRadius.value}${modalState.primaryButton.borderRadius.unit}`,
              }}
            >
              {editorMode === EditorMenuOptions.PRIMARY ? (
                <input
                  type="text"
                  value={modalState.primaryButton.content}
                  onChange={(e) =>
                    handlePrimaryButtonTextChange(e.target.value)
                  }
                  className="bg-transparent p-0 max-w-full h-full border-transparent"
                />
              ) : (
                <button>{modalState.primaryButton.content}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalViewer;
