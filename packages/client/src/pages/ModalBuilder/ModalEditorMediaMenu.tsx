import ReactSlider from "react-slider";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import {
  MediaClickActions,
  MediaPositionMap,
  ModalState,
} from "./ModalBuilder";
import SizeUnitPicker from "./Elements/SizeUnitPicker";
import { MediaType, mediaTypes, SizeUnit, SubMenuOptions } from "./types";
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
      <div className="flex flex-col gap-[10px]">
        <div>Type:</div>
        <div className="flex select-none">
          {mediaTypes.map((el, i) => (
            <div
              key={el}
              className={`flex justify-center items-center w-full h-[32px] border-[#E5E7EB] border-[1px] cursor-pointer ${
                modalState.media.type === el ? "bg-[#6366F1] text-white" : ""
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
            <span className="text-[14px] font-thin">Select image:</span>
            <ModalMediaUploader
              modalState={modalState}
              setModalState={setModalState}
              currentMainMode={currentMainMode}
            />
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
              className="resize-none border-[1px] border-[#D9D9D9] rounded-[5px] bg-transparent outline-none focus:outline-none shadow-none text-[12px]"
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
                    className={`flex justify-center items-center p-[2px] relative w-[35px] h-[35px] hover:border-[1px] hover:border-[#818CF8] rounded-md cursor-pointer text-transparent hover:text-white ${
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
        <div className="flex items-start justify-between mb-[10px]">
          <div>Media height:</div>
          <div className="w-[180px]">
            <div>
              <ReactSlider
                className="h-[20px] flex items-center justify-center mb-[8px]"
                trackClassName="h-[4px] bg-[#818CF8] rounded-[4px]"
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
                    className="rounded-[100%] w-[14px] h-[14px] cursor-grab bg-white border-[1px] border-[#818CF8]"
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
                          el.actionOnClick === modalState.media.actionOnClick
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
            <AdditionalActionOption
              actionData={actionData}
              currentMainMode={currentMainMode}
              onOptionPick={onOptionPick}
            />
          </>
        )}
      </div>
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
  );
};

export default ModalEditorMediaMenu;
