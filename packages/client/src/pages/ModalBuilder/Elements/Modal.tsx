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
  ModalPosition,
  ModalState,
  PrimaryButtonPosition,
  SizeUnit,
} from "../types";
import { IFrame } from "./IFrame";

export const modalPositionMap: Record<ModalPosition, CSSProperties> = {
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

export interface ModalProps {
  modalState: ModalState;
}

export const Modal: FC<ModalProps> = ({ modalState }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);

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
        display: isModalOpen ? "block" : "none",
      }}
      onClick={() => setIsModalOpen(false)}
      data-testid="laudspeaker-modal-iframe"
    >
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
          minHeight: "100vh",
          width: "100%",
          display: isModalOpen ? "flex" : "none",
          zIndex: 2147483645,
          padding: "20px",
        }}
        data-testid="laudspeaker-modal-shroud-wrapper"
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
        #modal-viewer-title-wrapper a {
          color: ${modalState.title.linkColor} !important
        }
        #modal-viewer-body-wrapper a {
          color: ${modalState.body.linkColor} !important
        }
        .whitespace-pre-line {
          white-space: pre-line;
        }

        @keyframes fullfilCircle {
          from {
            stroke-dashoffset: 0
          }
          to {
            stroke-dashoffset: ${modalState.dismiss.textSize * Math.PI}
          }
        }

        #dismissCircle {
          animation: fullfilCircle ${
            modalState.dismiss.timedDismiss.duration
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
            modalState.dismiss.timedDismiss.duration
          }s linear;
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
            position: "relative",
            padding: "18px",
          }}
          id="modalView"
          data-testid="laudspeaker-modal-view-wrapper"
        >
          <div
            style={{
              position: "absolute",
              userSelect: "none",
              cursor: "pointer",
              ...dismissPositionMap[modalState.dismiss.position],
              ...(modalState.dismiss.hidden ? { display: "none" } : {}),
              color: modalState.dismiss.color,
              fontSize: modalState.dismiss.textSize,
            }}
            onClick={() => setIsModalOpen(false)}
            data-testid="laudspeaker-modal-dismiss-wrapper"
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
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translateX(-50%) translateY(-50%)",
                    ...(modalState.dismiss.timedDismiss.enabled &&
                    modalState.dismiss.timedDismiss.displayTimer
                      ? {}
                      : { display: "none" }),
                    width: modalState.dismiss.textSize + 2,
                    height: modalState.dismiss.textSize + 2,
                  }}
                >
                  <circle
                    id="dismissCircle"
                    style={{
                      color: modalState.dismiss.timedDismiss.timerColor,
                    }}
                    strokeWidth="2"
                    strokeDasharray={modalState.dismiss.textSize * Math.PI}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={modalState.dismiss.textSize / 2}
                    cx={modalState.dismiss.textSize / 2 + 1}
                    cy={modalState.dismiss.textSize / 2 + 1}
                    onAnimationStart={() => {
                      if (
                        modalState.dismiss.hidden ||
                        !modalState.dismiss.timedDismiss.enabled
                      )
                        return;

                      setTimeout(() => {
                        setIsModalOpen(false);
                      }, modalState.dismiss.timedDismiss.duration * 1000);
                    }}
                  />
                </svg>
                <span
                  style={{
                    color: modalState.dismiss.color,
                    fontSize: "1.25rem",
                    lineHeight: "1.75rem",
                  }}
                >
                  <PlusIcon
                    style={{
                      transform: "rotate(45deg)",
                    }}
                    width={modalState.dismiss.textSize}
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
                  {modalState.dismiss.content}
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
                  {modalState.dismiss.content}
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
                      modalState.dismiss.timedDismiss.enabled &&
                      modalState.dismiss.timedDismiss.displayTimer
                        ? modalState.dismiss.timedDismiss.timerColor
                        : "",
                  }}
                  onAnimationStart={() => {
                    if (
                      modalState.dismiss.hidden ||
                      !modalState.dismiss.timedDismiss.enabled
                    )
                      return;

                    setTimeout(() => {
                      setIsModalOpen(false);
                    }, modalState.dismiss.timedDismiss.duration * 1000);
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <div
              id="modal-viewer-title-wrapper"
              data-testid="laudspeaker-modal-title-wrapper"
              style={modalState.title.hidden ? { display: "none" } : {}}
            >
              <div
                style={{
                  textAlign: alignmentStyleMap[modalState.title.alignment],
                  color: modalState.title.textColor,
                  fontSize: modalState.title.fontSize,
                  minHeight: "20px",
                }}
                data-testid="laudspeaker-modal-title"
              >
                <ReactMarkdown className="whitespace-pre-line">
                  {modalState.title.content}
                </ReactMarkdown>
              </div>
            </div>
            <div
              style={
                modalState.primaryButton.position ===
                PrimaryButtonPosition.CENTER_RIGHT
                  ? {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }
                  : {}
              }
              data-testid="laudspeaker-modal-primary-button-wrapper"
            >
              <div
                style={{
                  display: "flex",
                  ...mediaPositionMap[modalState.media.position],
                  justifyContent: "center",
                  alignItems: "center",
                }}
                data-testid="laudspeaker-modal-media-wrapper"
              >
                <div
                  style={{
                    width: `${modalState.media.height.value}${modalState.media.height.unit}`,
                    ...(modalState.media.hidden
                      ? { display: "none" }
                      : {
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }),
                  }}
                  data-testid="laudspeaker-modal-media"
                >
                  {modalState.media.type === MediaType.IMAGE && (
                    <img
                      style={{
                        width: "100%",
                      }}
                      src={modalState.media.imageSrc || ""}
                      alt={modalState.media.altText}
                      data-testid="laudspeaker-modal-image"
                      onClick={() => {
                        if (
                          modalState.media.actionOnClick ===
                          MediaClickAction.COMPLETE
                        ) {
                          setIsModalOpen(false);
                        }

                        const { hidden: openURLHidden, object: openURLObject } =
                          modalState.media.additionalClick.OPENURL;

                        if (!openURLHidden && openURLObject) {
                          window.open(
                            openURLObject.url,
                            openURLObject.openNewTab ? "_blank" : "_self"
                          );
                        }
                      }}
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
                  style={modalState.body.hidden ? { display: "none" } : {}}
                  data-testid="laudspeaker-modal-body-wrapper"
                >
                  <div
                    style={{
                      textAlign: alignmentStyleMap[modalState.body.alignment],
                      color: modalState.body.textColor,
                      fontSize: modalState.body.fontSize,
                      minHeight: "20px",
                    }}
                    data-testid="laudspeaker-modal-body"
                  >
                    <ReactMarkdown className="whitespace-pre-line">
                      {modalState.body.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              <div
                data-testid="laudspeaker-modal-primary-button"
                style={{
                  backgroundColor: modalState.primaryButton.fillColor,
                  color: modalState.primaryButton.textColor,
                  borderColor: modalState.primaryButton.borderColor,
                  borderRadius: `${modalState.primaryButton.borderRadius.value}${modalState.primaryButton.borderRadius.unit}`,
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
                    modalState.primaryButton.position
                  ],
                  ...(modalState.primaryButton.hidden
                    ? { display: "none" }
                    : {}),
                }}
                onClick={() => {
                  if (
                    modalState.primaryButton.clickAction ===
                    GeneralClickAction.COMPLETE
                  )
                    setIsModalOpen(false);

                  const { hidden: openURLHidden, object: openURLObject } =
                    modalState.primaryButton.additionalClick.OPENURL;

                  if (!openURLHidden && openURLObject) {
                    window.open(
                      openURLObject.url,
                      openURLObject.openNewTab ? "_blank" : "_self"
                    );
                  }
                }}
              >
                <button>{modalState.primaryButton.content}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IFrame>
  );
};
