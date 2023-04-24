import { PlusIcon } from "@heroicons/react/24/outline";
import { getSocialMediaPlatform, SocialMedia } from "helpers/socialMedia";
import React, {
  CSSProperties,
  FC,
  ReactNode,
  useEffect,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import {
  FacebookEmbed,
  InstagramEmbed,
  TwitterEmbed,
  YouTubeEmbed,
} from "react-social-media-embed";
import { ModalState } from "./ModalBuilder";
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
  PrimaryButtonPosition,
  SizeUnit,
} from "./types";
import "../../App.css";

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

interface ModalPreviewProps {
  modalState: ModalState;
}

const ModalPreview: FC<ModalPreviewProps> = ({ modalState }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [dismissProgress, setDismissProgress] = useState(0);

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

  useEffect(() => {
    if (modalState.dismiss.hidden || !modalState.dismiss.timedDismiss.enabled)
      return;
    const start = Date.now();
    const finish = start + modalState.dismiss.timedDismiss.duration * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      setDismissProgress((now - start) / (finish - start));

      if (now > finish) {
        setIsModalOpen(false);
        clearInterval(interval);
      }
    }, 20);
  }, []);

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
      className={`h-full w-screen flex z-[2147483645] p-[20px] ${
        isModalOpen ? "" : "hidden"
      }`}
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
      >
        <div
          className={`absolute select-none cursor-pointer ${
            dismissPositionMap[modalState.dismiss.position]
          } ${modalState.dismiss.hidden && "hidden"}`}
          style={{
            color: modalState.dismiss.color,
            fontSize: modalState.dismiss.textSize,
          }}
          onClick={() => setIsModalOpen(false)}
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
                className={`absolute top-1/2 left-1/2 -translate-x-[calc(50%-0.5px)] -translate-y-[calc(50%-1px)] -rotate-90 ${
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
                    color: modalState.dismiss.color,
                  }}
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="transparent"
                  r={modalState.dismiss.textSize / 2}
                  cx={modalState.dismiss.textSize / 2 + 1}
                  cy={modalState.dismiss.textSize / 2 + 1}
                />
                <circle
                  style={{
                    color: modalState.dismiss.timedDismiss.timerColor,
                  }}
                  strokeWidth="2"
                  strokeDasharray={modalState.dismiss.textSize * Math.PI}
                  strokeDashoffset={
                    modalState.dismiss.textSize * Math.PI -
                    dismissProgress * modalState.dismiss.textSize * Math.PI
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
            <div className="relative">
              <div className="p-[5px]">close</div>

              <div
                className="absolute rounded top-0 left-0 h-full"
                style={{
                  background:
                    modalState.dismiss.timedDismiss.enabled &&
                    modalState.dismiss.timedDismiss.displayTimer
                      ? modalState.dismiss.timedDismiss.timerColor
                      : "",
                  width: `${dismissProgress * 100}%`,
                }}
              >
                <div className="p-[5px]">close</div>
              </div>
            </div>
          )}
        </div>
        <div>
          <div
            id="modal-viewer-title-wrapper"
            className={modalState.title.hidden ? "hidden" : undefined}
          >
            <p
              style={{
                textAlign: alignmentStyleMap[modalState.title.alignment],
                color: modalState.title.textColor,
                fontSize: modalState.title.fontSize,
              }}
              className="min-h-[20px]"
            >
              <ReactMarkdown className="whitespace-pre-line">
                {modalState.title.content}
              </ReactMarkdown>
            </p>
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
                className={modalState.body.hidden ? "hidden" : undefined}
              >
                <p
                  style={{
                    textAlign: alignmentStyleMap[modalState.body.alignment],
                    color: modalState.body.textColor,
                    fontSize: modalState.body.fontSize,
                  }}
                  className="min-h-[20px]"
                >
                  <ReactMarkdown className="whitespace-pre-line">
                    {modalState.body.content}
                  </ReactMarkdown>
                </p>
              </div>
            </div>
            <div
              className={`flex justify-center items-center whitespace-nowrap h-fit p-[5px_9px_3px_9px] select-none cursor-pointer border-[2px] mt-[18px] ${
                primaryButtomPositionMap[modalState.primaryButton.position]
              } ${modalState.primaryButton.hidden && "hidden"}`}
              style={{
                backgroundColor: modalState.primaryButton.fillColor,
                color: modalState.primaryButton.textColor,
                borderColor: modalState.primaryButton.borderColor,
                borderRadius: `${modalState.primaryButton.borderRadius.value}${modalState.primaryButton.borderRadius.unit}`,
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
              <button>Read more</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPreview;
