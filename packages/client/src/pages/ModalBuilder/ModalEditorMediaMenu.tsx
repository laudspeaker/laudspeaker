import ReactSlider from "react-slider";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import { MediaClickActions, MediaPositionMap } from "./ModalBuilder";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import {
  MediaType,
  mediaTypes,
  ModalState,
  SizeUnit,
  SubMenuOptions,
} from "./types";
import { EditorMenuOptions } from "./ModalEditorMainMenu";
import { IAdditionalActionData } from "./ModalEditor";
import AdditionalActionOption from "./AdditionalActionOption";
import { useEffect } from "react";
import RemoveComponentButton from "./Elements/RemoveComponentButton";
import ModalMediaUploader from "./Elements/ModalMediaUploader";

interface IModalEditorMediaMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
  currentMainMode: EditorMenuOptions;
  actionData: IAdditionalActionData;
  returnBack: () => void;
}

const ModalEditorMediaMenu = ({
  modalState,
  setModalState,
  onOptionPick,
  actionData,
  currentMainMode,
  returnBack,
}: IModalEditorMediaMenuProps) => {
  useEffect(() => {
    setModalState({
      ...modalState,
      media: { ...modalState.media, hidden: false },
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
                  modalState.media.type === el
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
              <span className="text-[14px] text-[#111827] font-normal leading-[22px]">
                Image
              </span>
              <ModalMediaUploader
                modalState={modalState}
                setModalState={setModalState}
                currentMainMode={currentMainMode}
              />
              <span className="text-[14px] text-[#111827] font-normal leading-[22px]">
                Alt text
              </span>
              <input
                placeholder="Image alt text"
                className="bg-white border border-[#D9D9D9] rounded-[5px] px-[12px] py-[5px] outline-none font-normal text-[14px] placeholder:text-[#00000040] leading-[22px]"
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
            </>
          )}
          {modalState.media.type === MediaType.VIDEO && (
            <>
              <span className="text-[14px] font-thin">Video URL:</span>
              <textarea
                value={modalState.media.videoUrl || ""}
                className="resize-none border border-[#D9D9D9] rounded-[5px] bg-transparent outline-none focus:outline-none shadow-none text-[12px]"
                placeholder="Video URL (YouTube, Facebook, Instagram, Twitter)"
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
                          el.position === modalState.media.position
                            ? "bg-[#C7D2FE]"
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
                  min={modalState.media.height.unit === SizeUnit.PIXEL ? 20 : 1}
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
                      className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border border-[#818CF8]"
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
                  className="!w-[120px]"
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
        </div>

        <div className="border-t-[1px] border-[#E5E7EB]" />

        <div className="p-5 flex flex-col gap-[10px]">
          {modalState.media.type === MediaType.IMAGE && (
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
                          el.actionOnClick === modalState.media.actionOnClick
                            ? "bg-[#6366F1] text-white"
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
              setModalState({
                ...modalState,
                media: {
                  ...modalState.media,
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

export default ModalEditorMediaMenu;
