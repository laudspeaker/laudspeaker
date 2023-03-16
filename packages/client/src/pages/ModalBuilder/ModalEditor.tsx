import React, { FC, ReactNode, useState } from "react";
import {
  Alignment,
  BackgroundType,
  defaultGradientBackground,
  defaultImageBackground,
  defaultSolidBackground,
  GradientBackground,
  MediaClickActions,
  MediaPositionMap,
  MediaType,
  mediaTypes,
  ModalPosition,
  ModalState,
  SizeUnit,
  SolidBackground,
  textStyles,
  textStylesIcons,
} from "./ModalBuilder";
import LeftArrowSVG from "@heroicons/react/20/solid/ChevronLeftIcon";
import AlignCenterSVG from "@heroicons/react/20/solid/Bars3Icon";
import UploadSVG from "@heroicons/react/20/solid/CloudArrowUpIcon";
import AlignLeftSVG from "@heroicons/react/20/solid/Bars3BottomLeftIcon";
import AlignRightSVG from "@heroicons/react/20/solid/Bars3BottomRightIcon";
import Draggable from "react-draggable";
import ModalEditorMainMenu, { EditorMenuOptions } from "./ModalEditorMainMenu";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import SizeUnitPicker from "./SizeUnitPicker";
import {
  ModalPositionBottomCenterIcon,
  ModalPositionBottomLeftIcon,
  ModalPositionBottomRightIcon,
  ModalPositionCenterIcon,
  ModalPositionTopCenterIcon,
  ModalPositionTopLeftIcon,
  ModalPositionTopRightIcon,
} from "./Icons/ModalBuilderIcons";
import ReactSlider from "react-slider";
import ModalBuilderColorPicker from "./Elements/ModalBuilderColorPicker";
import { toast } from "react-toastify";

interface ModalEditorProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
}

interface IMenuOption {
  name: string;
  description?: string;
  layout: React.ReactNode;
}

const ModalEditor: FC<ModalEditorProps> = ({ modalState, setModalState }) => {
  const [editorMode, setEditorMode] = useState<EditorMenuOptions>(
    EditorMenuOptions.MAIN
  );

  const handleEditorModeSet = (mode: EditorMenuOptions) => {
    return () => {
      if (mode === EditorMenuOptions.TITLE)
        setModalState({
          ...modalState,
          title: { ...modalState.title, hidden: false },
        });
      setEditorMode(mode);
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    } else if ((e.target.files?.length || 0) > 1) {
      toast.error("Only one file can be uploaded!");
      return;
    } else if ((e.target.files?.[0]?.size || 0) > 10485760) {
      toast.error("Max file size 10mb");
      return;
    }

    // TODO: add file upload and token saving
  };

  const bodyWidth = document.body.clientWidth;

  const modalPositions = [
    ModalPosition.TOP_LEFT,
    ModalPosition.TOP_CENTER,
    ModalPosition.TOP_RIGHT,
    ModalPosition.CENTER,
    ModalPosition.BOTTOM_LEFT,
    ModalPosition.BOTTOM_CENTER,
    ModalPosition.BOTTOM_RIGHT,
  ];

  const modalPositionIconMap: Record<ModalPosition, ReactNode> = {
    [ModalPosition.TOP_LEFT]: <ModalPositionTopLeftIcon />,
    [ModalPosition.TOP_CENTER]: <ModalPositionTopCenterIcon />,
    [ModalPosition.TOP_RIGHT]: <ModalPositionTopRightIcon />,
    [ModalPosition.CENTER]: <ModalPositionCenterIcon />,
    [ModalPosition.BOTTOM_LEFT]: <ModalPositionBottomLeftIcon />,
    [ModalPosition.BOTTOM_CENTER]: <ModalPositionBottomCenterIcon />,
    [ModalPosition.BOTTOM_RIGHT]: <ModalPositionBottomRightIcon />,
  };

  const textAlignment = [Alignment.LEFT, Alignment.CENTER, Alignment.RIGHT];

  const textAlignmentIcons: Record<Alignment, ReactNode> = {
    [Alignment.LEFT]: <AlignLeftSVG className="!text-white" />,
    [Alignment.CENTER]: <AlignCenterSVG className="!text-white" />,
    [Alignment.RIGHT]: <AlignRightSVG className="!text-white" />,
  };

  const menuOptions: { [key: string]: IMenuOption } = {
    [EditorMenuOptions.MAIN]: {
      name: "Menu",
      layout: <ModalEditorMainMenu onOptionPick={handleEditorModeSet} />,
    },
    [EditorMenuOptions.TITLE]: {
      name: "Title",
      description: "Sometimes this is all that a user will read; make it count",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex items-center justify-between pb-[4px] pt-[20px]">
            <div>Alignment:</div>

            <ul className="flex items-center justify-between">
              {textAlignment.map((alignment) => (
                <li key={alignment}>
                  <div
                    className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer ${
                      alignment === modalState.title.alignment
                        ? "border-white border-[2px] bg-white bg-opacity-25"
                        : ""
                    }`}
                    onClick={() =>
                      setModalState({
                        ...modalState,
                        title: { ...modalState.title, alignment },
                      })
                    }
                  >
                    {textAlignmentIcons[alignment]}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between">
            <div>Styles:</div>
            <div className="flex items-center gap-[10px]">
              <ul className="flex items-center justify-between">
                {textStyles.map((style) => (
                  <li key={style}>
                    <div
                      className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer`}
                      onClick={() => {
                        // TODO: add format to layout
                      }}
                    >
                      {textStylesIcons[style]}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <small className="w-full mt-[10px] text-[#BAC3C0]">
            Select text before applying
          </small>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between mb-[10px]">
            <div>Text:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderColorPicker
                className="min-w-[155px]"
                color={modalState.title.textColor}
                onChange={(color) =>
                  setModalState({
                    ...modalState,
                    title: { ...modalState.title, textColor: color },
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Link:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderColorPicker
                className="min-w-[155px]"
                color={modalState.title.linkColor}
                onChange={(color) =>
                  setModalState({
                    ...modalState,
                    title: { ...modalState.title, linkColor: color },
                  })
                }
              />
            </div>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between">
            <div>Font size:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                className="min-w-[155px]"
                id="fontSize"
                name="fontSize"
                unit={SizeUnit.PIXEL}
                value={modalState.title.fontSize}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    title: {
                      ...modalState.title,
                      fontSize: value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.BODY]: {
      name: "Body",
      description: "Keep it succinct; we recommend max 2-3 lines",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex items-center justify-between pb-[4px] pt-[20px]">
            <div>Alignment:</div>

            <ul className="flex items-center justify-between">
              {textAlignment.map((alignment) => (
                <li key={alignment}>
                  <div
                    className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer ${
                      alignment === modalState.body.alignment
                        ? "border-white border-[2px] bg-white bg-opacity-25"
                        : ""
                    }`}
                    onClick={() =>
                      setModalState({
                        ...modalState,
                        body: { ...modalState.body, alignment },
                      })
                    }
                  >
                    {textAlignmentIcons[alignment]}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between">
            <div>Styles:</div>
            <div className="flex items-center gap-[10px]">
              <ul className="flex items-center justify-between">
                {textStyles.map((style) => (
                  <li key={style}>
                    <div
                      className={`flex justify-center items-center p-[2px] relative w-[32px] h-[32px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer`}
                      onClick={() => {
                        // TODO: add format to layout
                      }}
                    >
                      {textStylesIcons[style]}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <small className="w-full mt-[10px] text-[#BAC3C0]">
            Select text before applying
          </small>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between mb-[10px]">
            <div>Text:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderColorPicker
                className="min-w-[155px]"
                color={modalState.body.textColor}
                onChange={(color) =>
                  setModalState({
                    ...modalState,
                    body: { ...modalState.body, textColor: color },
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Link:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderColorPicker
                className="min-w-[155px]"
                color={modalState.body.linkColor}
                onChange={(color) =>
                  setModalState({
                    ...modalState,
                    body: { ...modalState.body, linkColor: color },
                  })
                }
              />
            </div>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex items-center justify-between">
            <div>Font size:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                className="min-w-[155px]"
                id="fontSize"
                name="fontSize"
                unit={SizeUnit.PIXEL}
                value={modalState.body.fontSize}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    body: {
                      ...modalState.body,
                      fontSize: value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.CANVAS]: {
      name: "Canvas",
      description: "Configure Step background and size",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex items-start justify-between mb-[20px]">
            <div>Width:</div>
            <div>
              <div>
                <ReactSlider
                  className="h-[20px] flex items-center justify-center mb-[8px]"
                  trackClassName="h-[5px] bg-[#22C55E] rounded-[4px]"
                  min={modalState.width.unit === SizeUnit.PIXEL ? 100 : 1}
                  max={
                    modalState.width.unit === SizeUnit.PIXEL ? bodyWidth : 100
                  }
                  value={modalState.width.value}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, value },
                    })
                  }
                  renderThumb={(props) => (
                    <div
                      {...props}
                      className="rounded-[100%] w-[16px] h-[16px] cursor-grab bg-white"
                    />
                  )}
                />
              </div>
              <div className="flex items-center gap-[10px]">
                <ModalBuilderNumberInput
                  id="width"
                  name="width"
                  value={modalState.width.value}
                  unit={modalState.width.unit}
                  onChange={(value) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, value },
                    })
                  }
                />
                <SizeUnitPicker
                  value={modalState.width.unit}
                  onChange={(unit) =>
                    setModalState({
                      ...modalState,
                      width: { ...modalState.width, unit },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Corner:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="corner"
                name="corner"
                value={modalState.borderRadius.value}
                unit={modalState.borderRadius.unit}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    borderRadius: { ...modalState.borderRadius, value },
                  })
                }
                className="!min-w-[122px]"
              />
            </div>
          </div>
          <div className="border-t-[1px] border-[#5D726D] my-[15px]" />
          <div className="flex flex-col gap-[10px]">
            <div>Background:</div>
            <div className="flex select-none">
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] rounded-l-md cursor-pointer ${
                  modalState.background.type === BackgroundType.SOLID
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.SOLID
                        ? modalState.background
                        : defaultSolidBackground,
                  })
                }
              >
                Solid
              </div>
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] cursor-pointer ${
                  modalState.background.type === BackgroundType.GRADIENT
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.GRADIENT
                        ? modalState.background
                        : defaultGradientBackground,
                  })
                }
              >
                Gradient
              </div>
              <div
                className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] rounded-r-md cursor-pointer ${
                  modalState.background.type === BackgroundType.IMAGE
                    ? "bg-white text-[#2f4a43]"
                    : "hover:bg-white hover:bg-opacity-25"
                }`}
                onClick={() =>
                  setModalState({
                    ...modalState,
                    background:
                      modalState.background.type === BackgroundType.IMAGE
                        ? modalState.background
                        : defaultImageBackground,
                  })
                }
              >
                Image
              </div>
            </div>
            {modalState.background.type === BackgroundType.SOLID && (
              <>
                <div className="flex items-center justify-between">
                  <div>Color:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Opacity:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderNumberInput
                      id="opacity"
                      name="opacity"
                      unit={SizeUnit.PERCENTAGE}
                      value={modalState.background.opacity * 100}
                      onChange={(val) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            opacity: val / 100,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
            {modalState.background.type === BackgroundType.GRADIENT && (
              <>
                <div className="flex items-center justify-between">
                  <div>Color 1:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color1}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as GradientBackground),
                            color1: color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Color 2:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderColorPicker
                      className="!min-w-[122px]"
                      color={modalState.background.color2}
                      onChange={(color) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as GradientBackground),
                            color2: color,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Opacity:</div>
                  <div className="flex items-center gap-[10px]">
                    <ModalBuilderNumberInput
                      id="opacity"
                      name="opacity"
                      unit={SizeUnit.PERCENTAGE}
                      value={modalState.background.opacity * 100}
                      onChange={(val) =>
                        setModalState({
                          ...modalState,
                          background: {
                            ...(modalState.background as SolidBackground),
                            opacity: val / 100,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
            {modalState.background.type === BackgroundType.IMAGE && (
              <>
                <div className="flex items-center justify-between">
                  <div>Image source:</div>
                  <div className="flex items-center gap-[10px]">
                    {modalState.background.imageSrc}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.POSITION]: {
      name: "Position",
      description: "We recommend anchoring to page where possible",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="mt-[20px]">
            <div>Position:</div>
            <ul className="flex items-center justify-between py-[20px]">
              {modalPositions.map((position) => (
                <li key={position}>
                  <div
                    className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer text-transparent hover:text-white ${
                      position === modalState.position
                        ? "border-white border-[2px] bg-white bg-opacity-25"
                        : ""
                    }`}
                    onClick={() => setModalState({ ...modalState, position })}
                  >
                    {modalPositionIconMap[position]}
                    <div className="absolute text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                      {position}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between mb-[10px]">
            <div>X axis offset:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="x-axis-offset"
                name="x-axis-offset"
                value={modalState.xOffset.value}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    xOffset: { ...modalState.xOffset, value },
                  })
                }
                unit={modalState.xOffset.unit}
              />
              <SizeUnitPicker
                value={modalState.xOffset.unit}
                onChange={(unit) =>
                  setModalState({
                    ...modalState,
                    xOffset: { ...modalState.xOffset, unit },
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Y axis offset:</div>
            <div className="flex items-center gap-[10px]">
              <ModalBuilderNumberInput
                id="y-axis-offset"
                name="y-axis-offset"
                value={modalState.yOffset.value}
                onChange={(value) =>
                  setModalState({
                    ...modalState,
                    yOffset: { ...modalState.yOffset, value },
                  })
                }
                unit={modalState.yOffset.unit}
              />
              <SizeUnitPicker
                value={modalState.yOffset.unit}
                onChange={(unit) =>
                  setModalState({
                    ...modalState,
                    yOffset: { ...modalState.yOffset, unit },
                  })
                }
              />
            </div>
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.MEDIA]: {
      name: "Media",
      description: "Use to engage, not to explain",
      layout: (
        <div className="text-white text-[14px] font-normal">
          <div className="flex flex-col gap-[10px]">
            <div>Type:</div>
            <div className="flex select-none">
              {mediaTypes.map((el, i) => (
                <div
                  key={el}
                  className={`flex justify-center items-center w-full h-[26px] border-white border-[1px] cursor-pointer ${
                    modalState.media.type === el
                      ? "bg-white text-[#2f4a43]"
                      : "hover:bg-white hover:bg-opacity-25"
                  } ${
                    i === 0
                      ? "rounded-l-md"
                      : i === mediaTypes.length - 1
                      ? "rounded-r-md"
                      : 0
                  }`}
                  onClick={() =>
                    setModalState({
                      ...modalState,
                      media: { ...modalState.media, type: el },
                    })
                  }
                >
                  {el}
                </div>
              ))}
            </div>
            {modalState.media.type === MediaType.IMAGE && (
              <>
                <span className="text-[14px] font-thin">Select image:</span>
                <label className="cursor-pointer" htmlFor="pick-image">
                  <div className="text-[#22C55E] hover:bg-[#105529] transition-colors border-[1px] border-[#22C55E] rounded-md inline-flex justify-center items-center px-[6px] py-[4px]">
                    <UploadSVG className="w-[20px] h-[20px] mr-[6px]" />
                    <small>Upload</small>
                  </div>
                  <input
                    id="pick-image"
                    hidden
                    type="file"
                    accept="image/*"
                    multiple={false}
                    onChange={(e) => handleImageUpload(e)}
                  />
                </label>
                <span className="text-[14px] font-thin">Alt text:</span>
                <input
                  placeholder="Image alt text"
                  className="bg-transparent text-[12px] border-[1px] border-white rounded-[5px] px-[6px] py-[2px] outline-none"
                  value={modalState.media.altText}
                  onChange={(el) =>
                    setModalState({
                      ...modalState,
                      media: {
                        ...modalState.media,
                        altText: el.target.value || "",
                      },
                    })
                  }
                />
                <div className="border-t-[1px] border-[#5D726D] my-[10px]" />
              </>
            )}
            {modalState.media.type === MediaType.VIDEO && (
              <>
                <span className="text-[14px] font-thin">Video URL:</span>
                <textarea
                  value={modalState.media.videoUrl || ""}
                  className="resize-none border-[1px] border-white focus:border-white rounded-[5px] bg-transparent outline-none focus:outline-none shadow-none text-[12px]"
                  placeholder="Video URL (YouTube, Vimeo, etc...)"
                  onChange={(el) =>
                    setModalState({
                      ...modalState,
                      media: {
                        ...modalState.media,
                        videoUrl: el.target.value || "",
                      },
                    })
                  }
                />
                <div className="border-t-[1px] border-[#5D726D] my-[10px]" />
              </>
            )}

            <div className="flex w-full justify-between items-center">
              <div className="flex w-full flex-col">
                <span>Position:</span>
                <small className="w-full mt-[5px] text-[#BAC3C0]">
                  Relative to the Body component
                </small>
              </div>
              <div className="w-full flex">
                <ul className="flex w-full items-center justify-between py-[20px]">
                  {MediaPositionMap.map((el) => (
                    <li key={el.position}>
                      <div
                        className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer text-transparent hover:text-white ${
                          el.position === modalState.media.position
                            ? "border-white border-[2px] bg-white bg-opacity-25"
                            : ""
                        }`}
                        onClick={() =>
                          setModalState({
                            ...modalState,
                            media: {
                              ...modalState.media,
                              position: el.position,
                            },
                          })
                        }
                      >
                        {el.icon}
                        <div className="absolute text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                          {el.position}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-start justify-between mb-[10px]">
              <div>Media height:</div>
              <div>
                <div>
                  <ReactSlider
                    className="h-[20px] flex items-center justify-center mb-[8px]"
                    trackClassName="h-[5px] bg-[#22C55E] rounded-[4px]"
                    min={
                      modalState.media.height.unit === SizeUnit.PIXEL ? 20 : 1
                    }
                    max={
                      modalState.media.height.unit === SizeUnit.PIXEL
                        ? 600 // TODO: add max size based on uploaded image / for video 600
                        : 100
                    }
                    value={modalState.media.height.value}
                    onChange={(value) =>
                      setModalState({
                        ...modalState,
                        media: {
                          ...modalState.media,
                          height: { ...modalState.media.height, value },
                        },
                      })
                    }
                    renderThumb={(props) => (
                      <div
                        {...props}
                        className="rounded-[100%] w-[16px] h-[16px] cursor-grab bg-white"
                      />
                    )}
                  />
                </div>
                <div className="flex items-center gap-[10px]">
                  <ModalBuilderNumberInput
                    id="width"
                    name="width"
                    value={modalState.media.height.value}
                    // TODO: percentage convert based on uploaded image / for video always 600
                    unit={modalState.media.height.unit}
                    onChange={(value) =>
                      setModalState({
                        ...modalState,
                        media: {
                          ...modalState.media,
                          height: { ...modalState.media.height, value },
                        },
                      })
                    }
                  />
                  <SizeUnitPicker
                    value={modalState.media.height.unit}
                    onChange={(unit) =>
                      setModalState({
                        ...modalState,
                        media: {
                          ...modalState.media,
                          height: { ...modalState.media.height, unit },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
            {modalState.media.type === MediaType.IMAGE && (
              <>
                <div className="border-t-[1px] border-[#5D726D]" />
                <div className="flex w-full justify-between items-center">
                  <div className="flex w-full flex-col">
                    <span>Action when clicked:</span>
                  </div>
                  <div className="w-full flex">
                    <ul className="flex w-full items-center justify-start gap-[10px] py-[10px]">
                      {MediaClickActions.map((el) => (
                        <li key={el.actionOnClick}>
                          <div
                            className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:bg-white hover:bg-opacity-25 rounded-md cursor-pointer text-transparent hover:text-white ${
                              el.actionOnClick ===
                              modalState.media.actionOnClick
                                ? "border-white border-[2px] bg-white bg-opacity-25"
                                : ""
                            }`}
                            onClick={() =>
                              setModalState({
                                ...modalState,
                                media: {
                                  ...modalState.media,
                                  actionOnClick: el.actionOnClick,
                                },
                              })
                            }
                          >
                            {el.icon}
                            <div className="absolute text-[12px] font-normal whitespace-nowrap bottom-[-20px] left-[50%] -translate-x-1/2">
                              {el.actionOnClick}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
    [EditorMenuOptions.DISMISS]: {
      name: "Dismiss",
      description: "Let users easily Exit or Snooze the Tour",
      layout: <span>Dismiss</span>,
    },
    [EditorMenuOptions.PRIMARY]: {
      name: "Primary button",
      description: "Configure design and behavior",
      layout: <span>Primary</span>,
    },
  };

  return (
    <Draggable
      axis="both"
      handle="#draggableHead"
      defaultPosition={{
        x: 40,
        y: 40,
      }}
    >
      <div className="fixed w-[360px] z-[999999999] h-auto pb-[20px] rounded-xl shadow-lg bg-[#19362e]">
        <div className="w-full p-[4px] mb-[10px]">
          <div
            id="draggableHead"
            className="w-full cursor-move py-[20px] flex flex-col px-[20px] font-medium text-white justify-center bg-[#2f4a43] rounded-xl"
          >
            <div className="flex items-center text-[18px] mb-[4px]">
              {editorMode !== EditorMenuOptions.MAIN && (
                <LeftArrowSVG
                  className="min-w-[34px] max-w-[34px] text-left cursor-pointer pr-[6px]"
                  onClick={handleEditorModeSet(EditorMenuOptions.MAIN)}
                />
              )}
              <span>{menuOptions[editorMode].name}</span>
            </div>
            <small className="block min-w-full">
              {menuOptions[editorMode].description}
            </small>
          </div>
        </div>
        <div className="px-[24px] h-full overflow-y-scroll overflow-x-hidden max-h-[70vh]">
          {menuOptions[editorMode].layout}
        </div>
        <div></div>
      </div>
    </Draggable>
  );
};

export default ModalEditor;
