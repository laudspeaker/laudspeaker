import { PlusIcon } from "@heroicons/react/24/outline";
import { getSocialMediaPlatform, SocialMedia } from "helpers/socialMedia";
import React, { CSSProperties, FC, ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FacebookEmbed,
  InstagramEmbed,
  TwitterEmbed,
  YouTubeEmbed,
} from "react-social-media-embed";
import {
  Alignment,
  BackgroundType,
  DismissPosition,
  DismissType,
  GeneralClickAction,
  MediaClickAction,
  MediaPosition,
  MediaType,
  InAppPosition,
  InAppState,
  PrimaryButtonPosition,
  SizeUnit,
} from "../types";
import { IFrame } from "./IFrame";

export const inAppPositionMap: Record<InAppPosition, CSSProperties> = {
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

export const mediaPositionMap: Record<MediaPosition, CSSProperties> = {
  [MediaPosition.TOP]: {
    display: "flex",
    flexDirection: "column",
  },
  [MediaPosition.BOTTOM]: {
    display: "flex",
    flexDirection: "column-reverse",
  },
  [MediaPosition.LEFT]: { display: "flex", flexDirection: "row" },
  [MediaPosition.RIGHT]: { display: "flex", flexDirection: "row-reverse" },
};

export const dismissPositionMap: Record<DismissPosition, CSSProperties> = {
  [DismissPosition.CENTER_LEFT]: {
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  [DismissPosition.CENTER_RIGHT]: {
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  [DismissPosition.INSIDE_LEFT]: {
    left: "20px",
    top: "10px",
  },
  [DismissPosition.INSIDE_RIGHT]: {
    right: "20px",
    top: "10px",
  },
  [DismissPosition.OUTSIDE_LEFT]: {
    left: "-20px",
    top: 0,
  },
  [DismissPosition.OUTSIDE_RIGHT]: {
    right: "-20px",
    top: 0,
  },
};

export const primaryButtomPositionMap: Record<
  PrimaryButtonPosition,
  CSSProperties
> = {
  [PrimaryButtonPosition.BOTTOM_CENTER]: {
    width: "fit-content",
    margin: "0 auto",
  },
  [PrimaryButtonPosition.BOTTOM_LEFT]: { float: "left" },
  [PrimaryButtonPosition.BOTTOM_RIGHT]: { float: "right" },
  [PrimaryButtonPosition.CENTER_RIGHT]: {},
};

export const alignmentStyleMap: Record<Alignment, "left" | "center" | "right"> =
  {
    [Alignment.LEFT]: "left",
    [Alignment.CENTER]: "center",
    [Alignment.RIGHT]: "right",
  };

export interface InAppProps {
  inAppState: InAppState;
}

export const InApp: FC<InAppProps> = ({ inAppState }) => {
  const [isInAppOpen, setIsInAppOpen] = useState(true);

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
    <IFrame
      head={
        <>
          <link
            rel="stylesheet"
            href="https://unpkg.com/tailwindcss@3.3.1/src/css/preflight.css"
          />
        </>
      }
      style={{
        display: isInAppOpen ? "block" : "none",
      }}
      onClick={() => setIsInAppOpen(false)}
      data-testid="laudspeaker-inApp-iframe"
    >
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
          minHeight: "100vh",
          width: "100%",
          display: isInAppOpen ? "flex" : "none",
          zIndex: 2147483645,
          padding: "20px",
        }}
        data-testid="laudspeaker-inApp-shroud-wrapper"
      >
        {/* <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script> */}
        <style>
          {`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
        }
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
        .whitespace-pre-line {
          white-space: pre-line;
        }

        @keyframes fullfilCircle {
          from {
            stroke-dashoffset: 0
          }
          to {
            stroke-dashoffset: ${inAppState.dismiss.textSize * Math.PI}
          }
        }

        #dismissCircle {
          animation: fullfilCircle ${
            inAppState.dismiss.timedDismiss.duration
          }s linear;
        }

        @keyframes fullfilCloseDismiss {
          from {
            width: 100%
          }
          to {
            width: 0%
          }
        }

        #closeDismissBackground {
          animation: fullfilCloseDismiss ${
            inAppState.dismiss.timedDismiss.duration
          }s linear;
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
            position: "relative",
            padding: "18px",
          }}
          id="inAppView"
          data-testid="laudspeaker-inApp-view-wrapper"
        >
          <div
            style={{
              position: "absolute",
              userSelect: "none",
              cursor: "pointer",
              ...dismissPositionMap[inAppState.dismiss.position],
              ...(inAppState.dismiss.hidden ? { display: "none" } : {}),
              color: inAppState.dismiss.color,
              fontSize: inAppState.dismiss.textSize,
            }}
            onClick={() => setIsInAppOpen(false)}
            data-testid="laudspeaker-inApp-dismiss-wrapper"
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
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translateX(-50%) translateY(-50%)",
                    ...(inAppState.dismiss.timedDismiss.enabled &&
                    inAppState.dismiss.timedDismiss.displayTimer
                      ? {}
                      : { display: "none" }),
                    width: inAppState.dismiss.textSize + 2,
                    height: inAppState.dismiss.textSize + 2,
                  }}
                >
                  <circle
                    id="dismissCircle"
                    style={{
                      color: inAppState.dismiss.timedDismiss.timerColor,
                    }}
                    strokeWidth="2"
                    strokeDasharray={inAppState.dismiss.textSize * Math.PI}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={inAppState.dismiss.textSize / 2}
                    cx={inAppState.dismiss.textSize / 2 + 1}
                    cy={inAppState.dismiss.textSize / 2 + 1}
                    onAnimationStart={() => {
                      if (
                        inAppState.dismiss.hidden ||
                        !inAppState.dismiss.timedDismiss.enabled
                      )
                        return;

                      setTimeout(() => {
                        setIsInAppOpen(false);
                      }, inAppState.dismiss.timedDismiss.duration * 1000);
                    }}
                  />
                </svg>
                <span
                  style={{
                    color: inAppState.dismiss.color,
                    fontSize: "1.25rem",
                    lineHeight: "1.75rem",
                  }}
                >
                  <PlusIcon
                    style={{
                      transform: "rotate(45deg)",
                    }}
                    width={inAppState.dismiss.textSize}
                  />
                </span>
              </div>
            ) : (
              <div
                style={{
                  position: "relative",
                  transform: "rotate(180deg)",
                }}
              >
                <div
                  style={{
                    color: "transparent",
                    padding: "5px",
                    transform: "rotate(180deg)",
                  }}
                >
                  {inAppState.dismiss.content}
                </div>

                <div
                  style={{
                    position: "absolute",
                    zIndex: 9999,
                    top: 0,
                    left: 0,
                    height: "100%",
                    padding: "5px",
                    transform: "rotate(180deg)",
                  }}
                >
                  {inAppState.dismiss.content}
                </div>

                <div
                  id="closeDismissBackground"
                  style={{
                    position: "absolute",
                    borderRadius: "0.25rem",
                    top: 0,
                    left: 0,
                    height: "100%",
                    background:
                      inAppState.dismiss.timedDismiss.enabled &&
                      inAppState.dismiss.timedDismiss.displayTimer
                        ? inAppState.dismiss.timedDismiss.timerColor
                        : "",
                  }}
                  onAnimationStart={() => {
                    if (
                      inAppState.dismiss.hidden ||
                      !inAppState.dismiss.timedDismiss.enabled
                    )
                      return;

                    setTimeout(() => {
                      setIsInAppOpen(false);
                    }, inAppState.dismiss.timedDismiss.duration * 1000);
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <div
              id="inApp-viewer-title-wrapper"
              data-testid="laudspeaker-inApp-title-wrapper"
              style={inAppState.title.hidden ? { display: "none" } : {}}
            >
              <div
                style={{
                  textAlign: alignmentStyleMap[inAppState.title.alignment],
                  color: inAppState.title.textColor,
                  fontSize: inAppState.title.fontSize,
                  minHeight: "20px",
                }}
                data-testid="laudspeaker-inApp-title"
              >
                <ReactMarkdown className="whitespace-pre-line">
                  {inAppState.title.content}
                </ReactMarkdown>
              </div>
            </div>
            <div
              style={
                inAppState.primaryButton.position ===
                PrimaryButtonPosition.CENTER_RIGHT
                  ? {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }
                  : {}
              }
              data-testid="laudspeaker-inApp-primary-button-wrapper"
            >
              <div
                style={{
                  display: "flex",
                  ...mediaPositionMap[inAppState.media.position],
                  justifyContent: "center",
                  alignItems: "center",
                }}
                data-testid="laudspeaker-inApp-media-wrapper"
              >
                <div
                  style={{
                    width: `${inAppState.media.height.value}${inAppState.media.height.unit}`,
                    ...(inAppState.media.hidden
                      ? { display: "none" }
                      : {
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }),
                  }}
                  data-testid="laudspeaker-inApp-media"
                >
                  {inAppState.media.type === MediaType.IMAGE && (
                    <img
                      style={{
                        width: "100%",
                      }}
                      src={inAppState.media.imageSrc || ""}
                      alt={inAppState.media.altText}
                      data-testid="laudspeaker-inApp-image"
                      onClick={() => {
                        if (
                          inAppState.media.actionOnClick ===
                          MediaClickAction.COMPLETE
                        ) {
                          setIsInAppOpen(false);
                        }

                        const { hidden: openURLHidden, object: openURLObject } =
                          inAppState.media.additionalClick.OPENURL;

                        if (!openURLHidden && openURLObject) {
                          window.open(
                            openURLObject.url,
                            openURLObject.openNewTab ? "_blank" : "_self"
                          );
                        }
                      }}
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
                  style={inAppState.body.hidden ? { display: "none" } : {}}
                  data-testid="laudspeaker-inApp-body-wrapper"
                >
                  <div
                    style={{
                      textAlign: alignmentStyleMap[inAppState.body.alignment],
                      color: inAppState.body.textColor,
                      fontSize: inAppState.body.fontSize,
                      minHeight: "20px",
                    }}
                    data-testid="laudspeaker-inApp-body"
                  >
                    <ReactMarkdown className="whitespace-pre-line">
                      {inAppState.body.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              <div
                data-testid="laudspeaker-inApp-primary-button"
                style={{
                  backgroundColor: inAppState.primaryButton.fillColor,
                  color: inAppState.primaryButton.textColor,
                  borderColor: inAppState.primaryButton.borderColor,
                  borderRadius: `${inAppState.primaryButton.borderRadius.value}${inAppState.primaryButton.borderRadius.unit}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "fit-content",
                  padding: "5px 9px 3px 9px",
                  userSelect: "none",
                  cursor: "pointer",
                  borderWidth: "2px",
                  margin: "18px",
                  whiteSpace: "nowrap",
                  ...primaryButtomPositionMap[
                    inAppState.primaryButton.position
                  ],
                  ...(inAppState.primaryButton.hidden
                    ? { display: "none" }
                    : {}),
                }}
                onClick={() => {
                  if (
                    inAppState.primaryButton.clickAction ===
                    GeneralClickAction.COMPLETE
                  )
                    setIsInAppOpen(false);

                  const { hidden: openURLHidden, object: openURLObject } =
                    inAppState.primaryButton.additionalClick.OPENURL;

                  if (!openURLHidden && openURLObject) {
                    window.open(
                      openURLObject.url,
                      openURLObject.openNewTab ? "_blank" : "_self"
                    );
                  }
                }}
              >
                <button>{inAppState.primaryButton.content}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IFrame>
  );
};
