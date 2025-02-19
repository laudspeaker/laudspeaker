import React, { CSSProperties, FC, ReactNode } from "react";
import {
  Alignment,
  BackgroundType,
  DismissPosition,
  DismissType,
  MediaPosition,
  MediaType,
  InAppPosition,
  InAppState,
  PrimaryButtonPosition,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import ReactMarkdown from "react-markdown";
import InAppViewerTextArea from "./Elements/InAppViewerTextArea";
import { EditorMenuOptions } from "./InAppEditorMainMenu";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  YouTubeEmbed,
  FacebookEmbed,
  InstagramEmbed,
  TwitterEmbed,
} from "react-social-media-embed";
import { getSocialMediaPlatform, SocialMedia } from "helpers/socialMedia";

interface InAppViewerProps {
  inAppState: InAppState;
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

const inAppPositionMap: Record<InAppPosition, CSSProperties> = {
  [InAppPosition.BOTTOM_CENTER]: {
    justifyContent: "center",
    alignItems: "end",
  },
  [InAppPosition.BOTTOM_LEFT]: {
    justifyContent: "start",
    alignItems: "end",
  },
  [InAppPosition.BOTTOM_RIGHT]: {
    justifyContent: "end",
    alignItems: "end",
  },
  [InAppPosition.CENTER]: {
    justifyContent: "center",
    alignItems: "center",
  },
  [InAppPosition.TOP_CENTER]: {
    justifyContent: "center",
    alignItems: "start",
  },
  [InAppPosition.TOP_LEFT]: {
    justifyContent: "start",
    alignItems: "start",
  },
  [InAppPosition.TOP_RIGHT]: {
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

const InAppViewer: FC<InAppViewerProps> = ({
  inAppState,
  handleBodyChange,
  handleTitleChange,
  handleEditorModeSet,
  editorMode,
  handleDismissTextChange,
  handlePrimaryButtonTextChange,
}) => {
  const { emailHtml } = inAppState;

  if (emailHtml) {
    return (
      <div
        style={{
          ...inAppPositionMap[inAppState.position],
          ...(inAppState.shroud.hidden
            ? {}
            : {
                backgroundColor: `${inAppState.shroud.color}${Math.round(
                  inAppState.shroud.opacity * 255
                )
                  .toString(16)
                  .padStart(2, "0")}`,
                backdropFilter: `blur(${inAppState.shroud.blur}px)`,
              }),
        }}
        className="h-full w-screen flex z-[2147483645] p-5"
      >
        <div
          style={{
            top: `${inAppState.yOffset.value}${
              inAppState.yOffset.unit === SizeUnit.PERCENTAGE
                ? "vw"
                : SizeUnit.PIXEL
            }`,
            left: `${inAppState.xOffset.value}${
              inAppState.xOffset.unit === SizeUnit.PERCENTAGE
                ? "vw"
                : SizeUnit.PIXEL
            }`,
            width: `${inAppState.width.value}${
              inAppState.width.unit === SizeUnit.PERCENTAGE
                ? "vw"
                : SizeUnit.PIXEL
            }`,
            borderRadius: `${inAppState.borderRadius.value}${inAppState.borderRadius.unit}`,
          }}
          className="relative p-[18px]"
        >
          <div
            className="email-html-content"
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        </div>
      </div>
    );
  }

  const CanvasBackground: Record<BackgroundType, string> = {
    [BackgroundType.SOLID]: `${
      inAppState.background[BackgroundType.SOLID].color
    }${
      (inAppState.background[BackgroundType.SOLID].opacity * 255)
        .toString(16)
        .split(".")[0]
    }`,
    [BackgroundType.GRADIENT]: `linear-gradient(45deg, ${
      inAppState.background[BackgroundType.GRADIENT].color1
    }${
      (inAppState.background[BackgroundType.GRADIENT].opacity * 255)
        .toString(16)
        .split(".")[0]
    } 0%, ${inAppState.background[BackgroundType.GRADIENT].color2}${
      (inAppState.background[BackgroundType.GRADIENT].opacity * 255)
        .toString(16)
        .split(".")[0]
    }) 100%`,
    [BackgroundType.IMAGE]: `url(${
      inAppState.background[BackgroundType.IMAGE].imageSrc
    })`,
  };

  return (
    <>
      {emailHtml ? (
        <div
          className="email-html-content"
          dangerouslySetInnerHTML={{ __html: emailHtml }}
        />
      ) : (
        <div
          style={{
            ...inAppPositionMap[inAppState.position],
            ...(inAppState.shroud.hidden
              ? {}
              : {
                  backgroundColor: `${inAppState.shroud.color}${
                    (inAppState.shroud.opacity * 255).toString(16).split(".")[0]
                  }`,
                  backdropFilter: `blur(${inAppState.shroud.blur}px)`,
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
        #inApp-viewer-title-wrapper a {
          color: ${inAppState.title.linkColor} !important
        }
        #inApp-viewer-body-wrapper a {
          color: ${inAppState.body.linkColor} !important
        }
        `}
          </style>
          <div
            style={{
              top: `${inAppState.yOffset.value}${
                inAppState.yOffset.unit === SizeUnit.PERCENTAGE
                  ? "vw"
                  : SizeUnit.PIXEL
              }`,
              left: `${inAppState.xOffset.value}${
                inAppState.xOffset.unit === SizeUnit.PERCENTAGE
                  ? "vw"
                  : SizeUnit.PIXEL
              }`,
              width: `${inAppState.width.value}${
                inAppState.width.unit === SizeUnit.PERCENTAGE
                  ? "vw"
                  : SizeUnit.PIXEL
              }`,
              // transform: `translateX() translateY(${inAppState.yOffset.value}${inAppState.yOffset.unit})`,
              borderRadius: `${inAppState.borderRadius.value}${inAppState.borderRadius.unit}`,
              background: CanvasBackground[inAppState.background.selected],
            }}
            id="inAppView"
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
                dismissPositionMap[inAppState.dismiss.position]
              } ${inAppState.dismiss.hidden && "hidden"}`}
              style={{
                color: inAppState.dismiss.color,
                fontSize: inAppState.dismiss.textSize,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEditorModeSet(
                  EditorMenuOptions.DISMISS,
                  editorMode === EditorMenuOptions.MAIN
                )();
              }}
            >
              {inAppState.dismiss.type === DismissType.CROSS ? (
                <div
                  id="dismiss-wrapper"
                  style={
                    inAppState.dismiss.timedDismiss.enabled &&
                    inAppState.dismiss.timedDismiss.displayTimer
                      ? {
                          borderRadius: "100%",
                          position: "relative",
                        }
                      : {}
                  }
                >
                  <svg
                    className={`absolute top-1/2 left-1/2 -translate-x-[calc(50%-0.5px)] -translate-y-[calc(50%-1px)] ${
                      inAppState.dismiss.timedDismiss.enabled &&
                      inAppState.dismiss.timedDismiss.displayTimer
                        ? ""
                        : "hidden"
                    }`}
                    style={{
                      width: inAppState.dismiss.textSize + 2,
                      height: inAppState.dismiss.textSize + 2,
                    }}
                  >
                    <circle
                      style={{
                        color: inAppState.dismiss.timedDismiss.timerColor,
                      }}
                      strokeWidth="2"
                      strokeDasharray={inAppState.dismiss.textSize * Math.PI}
                      strokeDashoffset={
                        inAppState.dismiss.textSize * Math.PI -
                        1 * inAppState.dismiss.textSize * Math.PI
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r={inAppState.dismiss.textSize / 2}
                      cx={inAppState.dismiss.textSize / 2 + 1}
                      cy={inAppState.dismiss.textSize / 2 + 1}
                    />
                  </svg>
                  <span
                    className="text-xl"
                    style={{
                      color: inAppState.dismiss.color,
                    }}
                  >
                    <PlusIcon
                      className="rotate-45"
                      width={inAppState.dismiss.textSize}
                    />
                  </span>
                </div>
              ) : (
                <div className="relative rotate-180">
                  <div className="text-transparent p-[5px] rotate-180">
                    {inAppState.dismiss.content}
                  </div>

                  {editorMode === EditorMenuOptions.DISMISS ? (
                    <input
                      type="text"
                      value={inAppState.dismiss.content}
                      onChange={(e) => handleDismissTextChange(e.target.value)}
                      style={{
                        fontSize: "inherit",
                        fontWeight: "inherit",
                      }}
                      className="absolute z-[9999] top-0 left-0 bg-transparent p-[5px] max-w-full h-full border-transparent rotate-180"
                    />
                  ) : (
                    <div className="absolute z-[9999] top-0 left-0 h-full p-[5px] rotate-180">
                      {inAppState.dismiss.content}
                    </div>
                  )}

                  <div
                    className="absolute rounded top-0 left-0 h-full"
                    style={{
                      background:
                        inAppState.dismiss.timedDismiss.enabled &&
                        inAppState.dismiss.timedDismiss.displayTimer
                          ? inAppState.dismiss.timedDismiss.timerColor
                          : "",
                      width: "100%",
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <div
                id="inApp-viewer-title-wrapper"
                className={inAppState.title.hidden ? "hidden" : undefined}
              >
                {editorMode === EditorMenuOptions.TITLE ? (
                  <InAppViewerTextArea
                    value={inAppState.title.content}
                    onChange={(title) => handleTitleChange(title)}
                    style={{
                      textAlign: alignmentStyleMap[inAppState.title.alignment],
                      color: inAppState.title.textColor,
                      fontSize: inAppState.title.fontSize,
                    }}
                    id="inApp-builder-title-textarea"
                  />
                ) : (
                  <p
                    style={{
                      textAlign: alignmentStyleMap[inAppState.title.alignment],
                      color: inAppState.title.textColor,
                      fontSize: inAppState.title.fontSize,
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
                      {inAppState.title.content}
                    </ReactMarkdown>
                  </p>
                )}
              </div>
              <div
                className={
                  inAppState.primaryButton.position ===
                  PrimaryButtonPosition.CENTER_RIGHT
                    ? "flex items-center justify-between gap-[10px]"
                    : ""
                }
              >
                <div
                  className={`flex ${
                    mediaPositionMap[inAppState.media.position]
                  } justify-center items-center`}
                >
                  <div
                    className={
                      inAppState.media.hidden
                        ? "hidden"
                        : "flex justify-center items-center"
                    }
                    style={{
                      width: `${inAppState.media.height.value}${inAppState.media.height.unit}`,
                    }}
                  >
                    {inAppState.media.type === MediaType.IMAGE && (
                      <img
                        className="w-full"
                        src={inAppState.media.imageSrc || ""}
                        alt={inAppState.media.altText}
                      />
                    )}
                    {inAppState.media.type === MediaType.VIDEO && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        {(() => {
                          const platform = getSocialMediaPlatform(
                            inAppState.media.videoUrl || ""
                          );

                          const coorelation: { [key: string]: ReactNode } = {
                            [SocialMedia.YouTube]: (
                              <YouTubeEmbed
                                height={"100%"}
                                url={inAppState.media.videoUrl || ""}
                                width={
                                  inAppState.media.height.value +
                                  inAppState.media.height.unit
                                }
                              />
                            ),
                            [SocialMedia.Facebook]: (
                              <FacebookEmbed
                                url={inAppState.media.videoUrl || ""}
                                width={
                                  inAppState.media.height.value +
                                  inAppState.media.height.unit
                                }
                              />
                            ),
                            [SocialMedia.Instagram]: (
                              <InstagramEmbed
                                url={inAppState.media.videoUrl || ""}
                                width={
                                  inAppState.media.height.value +
                                  inAppState.media.height.unit
                                }
                              />
                            ),
                            [SocialMedia.Twitter]: (
                              <TwitterEmbed
                                url={inAppState.media.videoUrl || ""}
                                width={
                                  inAppState.media.height.value +
                                  inAppState.media.height.unit
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
                    id="inApp-viewer-body-wrapper"
                    className={inAppState.body.hidden ? "hidden" : undefined}
                  >
                    {editorMode === EditorMenuOptions.BODY ? (
                      <InAppViewerTextArea
                        value={inAppState.body.content}
                        onChange={(body) => handleBodyChange(body)}
                        style={{
                          textAlign:
                            alignmentStyleMap[inAppState.body.alignment],
                          color: inAppState.body.textColor,
                          fontSize: inAppState.body.fontSize,
                        }}
                        id="inApp-builder-body-textarea"
                      />
                    ) : (
                      <p
                        style={{
                          textAlign:
                            alignmentStyleMap[inAppState.body.alignment],
                          color: inAppState.body.textColor,
                          fontSize: inAppState.body.fontSize,
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
                          {inAppState.body.content}
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
                    primaryButtomPositionMap[inAppState.primaryButton.position]
                  } ${inAppState.primaryButton.hidden && "hidden"}`}
                  style={{
                    backgroundColor: inAppState.primaryButton.fillColor,
                    color: inAppState.primaryButton.textColor,
                    borderColor: inAppState.primaryButton.borderColor,
                    borderRadius: `${inAppState.primaryButton.borderRadius.value}${inAppState.primaryButton.borderRadius.unit}`,
                  }}
                >
                  {editorMode === EditorMenuOptions.PRIMARY ? (
                    <input
                      type="text"
                      value={inAppState.primaryButton.content}
                      onChange={(e) =>
                        handlePrimaryButtonTextChange(e.target.value)
                      }
                      className="bg-transparent p-0 max-w-full h-full border-transparent"
                    />
                  ) : (
                    <button>{inAppState.primaryButton.content}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InAppViewer;
