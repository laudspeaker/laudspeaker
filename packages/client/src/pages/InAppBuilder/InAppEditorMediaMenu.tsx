import ReactSlider from "react-slider";
import InAppBuilderNumberInput from "./Elements/InAppBuilderNumberInput";
import { MediaClickActions, MediaPositionMap } from "./InAppBuilder";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import {
  MediaType,
  mediaTypes,
  InAppState,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import { EditorMenuOptions } from "./InAppEditorMainMenu";
import { IAdditionalActionData } from "./InAppEditor";
import AdditionalActionOption from "./AdditionalActionOption";
import { useEffect } from "react";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import InAppMediaUploader from "./Elements/InAppMediaUploader";

interface IInAppEditorMediaMenuProps {
  inAppState: InAppState;
  setInAppState: (inAppState: InAppState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
  returnBack: () => void;
}

const InAppEditorMediaMenu = ({
  inAppState,
  setInAppState,
  onOptionPick,
  actionData,
  currentMainMode,
  returnBack,
}: IInAppEditorMediaMenuProps) => {
  useEffect(() => {
    setInAppState({
      ...inAppState,
      media: { ...inAppState.media, hidden: false },
    });
  }, []);

  return (
    <div className="text-[14px] font-normal">
      <div>
        <div className="flex flex-col gap-[10px] p-5">
          <div>Type:</div>
          <div className="flex select-none">
            {mediaTypes.map((el, i) => (
              <div
                key={el}
                className={`flex justify-center items-center w-full h-[32px] cursor-pointer ${
                  inAppState.media.type === el
                    ? "bg-[#6366F1] text-white"
                    : "border-[#E5E7EB] border"
                } ${
                  i === 0
                    ? "rounded-l-[2px]"
                    : i === mediaTypes.length - 1
                    ? "rounded-r-[2px]"
                    : 0
                }`}
                onClick={() =>
                  setInAppState({
                    ...inAppState,
                    media: { ...inAppState.media, type: el },
                  })
                }
              >
                {el}
              </div>
            ))}
          </div>
          {inAppState.media.type === MediaType.IMAGE && (
            <>
              <span className="text-[14px] text-[#111827] font-normal leading-[22px]">
                Image
              </span>
              <InAppMediaUploader
                inAppState={inAppState}
                setInAppState={setInAppState}
                currentMainMode={currentMainMode}
              />
              <span className="text-[14px] text-[#111827] font-normal leading-[22px]">
                Alt text
              </span>
              <input
                placeholder="Image alt text"
                className="bg-white border border-[#D9D9D9] rounded-[5px] px-[12px] py-[5px] outline-none font-normal text-[14px] placeholder:text-[#00000040] leading-[22px]"
                value={inAppState.media.altText}
                onChange={(el) =>
                  setInAppState({
                    ...inAppState,
                    media: {
                      ...inAppState.media,
                      altText: el.target.value || "",
                    },
                  })
                }
              />
            </>
          )}
          {inAppState.media.type === MediaType.VIDEO && (
            <>
              <span className="text-[14px] font-thin">Video URL:</span>
              <textarea
                value={inAppState.media.videoUrl || ""}
                className="resize-none border border-[#D9D9D9] rounded-[5px] bg-transparent outline-none focus:outline-none shadow-none text-[12px]"
                placeholder="Video URL (YouTube, Facebook, Instagram, Twitter)"
                onChange={(el) =>
                  setInAppState({
                    ...inAppState,
                    media: {
                      ...inAppState.media,
                      videoUrl: el.target.value || "",
                    },
                  })
                }
              />
            </>
          )}
        </div>

        <div className="border-t-[1px] border-[#E5E7EB]" />

        <div className="flex flex-col gap-[10px] p-5">
          <div>
            <div className="flex w-full justify-between items-center">
              <div className="flex w-full flex-col">
                <span>Position:</span>
              </div>
              <div className="w-full flex">
                <ul className="flex w-full items-center justify-between">
                  {MediaPositionMap.map((el) => (
                    <li key={el.position}>
                      <div
                        className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:border hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-white ${
                          el.position === inAppState.media.position
                            ? "bg-[#C7D2FE]"
                            : ""
                        }`}
                        onClick={() =>
                          setInAppState({
                            ...inAppState,
                            media: {
                              ...inAppState.media,
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
            <div className="w-full mt-[10px] font-normal text-[12px] leading-5 text-[#4B5563]">
              Relative to the Body component
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>Media height:</div>
            <div className="w-[180px]">
              <div>
                <ReactSlider
                  className="h-[20px] flex items-center justify-center mb-[8px]"
                  trackClassName="h-[4px] bg-[#818CF8] rounded"
                  min={inAppState.media.height.unit === SizeUnit.PIXEL ? 20 : 1}
                  max={
                    inAppState.media.height.unit === SizeUnit.PIXEL
                      ? 600 // TODO: add max size based on uploaded image / for video 600
                      : 100
                  }
                  value={inAppState.media.height.value}
                  onChange={(value) =>
                    setInAppState({
                      ...inAppState,
                      media: {
                        ...inAppState.media,
                        height: { ...inAppState.media.height, value },
                      },
                    })
                  }
                  renderThumb={(props) => (
                    <div
                      {...props}
                      className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border border-[#818CF8]"
                    />
                  )}
                />
              </div>
              <div className="flex items-center gap-[10px]">
                <InAppBuilderNumberInput
                  id="width"
                  name="width"
                  value={inAppState.media.height.value}
                  // TODO: percentage convert based on uploaded image / for video always 600
                  unit={inAppState.media.height.unit}
                  onChange={(value) =>
                    setInAppState({
                      ...inAppState,
                      media: {
                        ...inAppState.media,
                        height: { ...inAppState.media.height, value },
                      },
                    })
                  }
                  className="!w-[120px]"
                />
                <SizeUnitPicker
                  value={inAppState.media.height.unit}
                  onChange={(unit) =>
                    setInAppState({
                      ...inAppState,
                      media: {
                        ...inAppState.media,
                        height: { ...inAppState.media.height, unit },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-[1px] border-[#E5E7EB]" />

        <div className="p-5 flex flex-col gap-[10px]">
          {inAppState.media.type === MediaType.IMAGE && (
            <>
              <div className="flex w-full justify-between items-center">
                <div className="flex w-full flex-col">
                  <span>Action:</span>
                </div>
                <div className="w-full flex">
                  <ul className="flex w-[214px] border-[#E5E7EB] border items-center justify-start">
                    {MediaClickActions.map((el) => (
                      <li
                        key={el.actionOnClick}
                        className={`flex text-[14px] justify-center items-center w-full h-[32px] cursor-pointer ${
                          el.actionOnClick === inAppState.media.actionOnClick
                            ? "bg-[#6366F1] text-white"
                            : ""
                        }`}
                        onClick={() =>
                          setInAppState({
                            ...inAppState,
                            media: {
                              ...inAppState.media,
                              actionOnClick: el.actionOnClick,
                            },
                          })
                        }
                      >
                        {el.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <AdditionalActionOption
                actionData={actionData}
                currentMainMode={currentMainMode}
                onOptionPick={onOptionPick}
              />
            </>
          )}
          <RemoveComponentButton
            onClick={() => {
              setInAppState({
                ...inAppState,
                media: {
                  ...inAppState.media,
                  hidden: true,
                },
              });
              returnBack();
            }}
          >
            Remove media
          </RemoveComponentButton>
        </div>
      </div>
    </div>
  );
};

export default InAppEditorMediaMenu;
