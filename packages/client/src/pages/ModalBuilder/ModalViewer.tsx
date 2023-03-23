import React, { CSSProperties, FC } from "react";
import { ModalState } from "./ModalBuilder";
import {
  Alignment,
  BackgroundType,
  DismissPosition,
  DismissType,
  MediaPosition,
  ModalPosition,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import ReactMarkdown from "react-markdown";
import ModalViewerTextArea from "./Elements/ModalViewerTextArea";
import { EditorMenuOptions } from "./ModalEditorMainMenu";

interface ModalViewerProps {
  modalState: ModalState;
  handleBodyChange: (body: string) => void;
  handleTitleChange: (title: string) => void;
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
  [DismissPosition.CENTER_LEFT]: "left-[20px] top-1/2 -translate-y-1/2",
  [DismissPosition.CENTER_RIGHT]: "right-[20px] top-1/2 -translate-y-1/2",
  [DismissPosition.INSIDE_LEFT]: "left-[20px] top-[20px]",
  [DismissPosition.INSIDE_RIGHT]: "right-[20px] top-[20px]",
  [DismissPosition.OUTSIDE_LEFT]: "left-[-20px] top-0",
  [DismissPosition.OUTSIDE_RIGHT]: "right-[-20px] top-0",
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
    // TODO: update when will work with image upload
    [BackgroundType.IMAGE]:
      "url(https://cdn.pixabay.com/photo/2015/04/19/08/32/marguerite-729510__340.jpg)",
  };

  return (
    <div
      style={{ ...modalPositionMap[modalState.position] }}
      className="left-0 top-0 min-h-screen w-screen flex fixed z-[2147483645] p-[20px]"
    >
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
          }`}
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
          {modalState.dismiss.type === DismissType.CROSS ? "x" : "close"}
        </div>
        <div>
          <div className={modalState.title.hidden ? "hidden" : undefined}>
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
            className={`flex ${mediaPositionMap[modalState.media.position]}`}
          >
            <div
              className={modalState.media.hidden ? "hidden" : undefined}
            ></div>
            <div className={modalState.body.hidden ? "hidden" : undefined}>
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
        </div>
      </div>
    </div>
  );
};

export default ModalViewer;
