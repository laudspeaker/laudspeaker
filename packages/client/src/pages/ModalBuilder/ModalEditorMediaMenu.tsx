import { GenericButton } from "components/Elements";
import ReactSlider from "react-slider";
import { toast } from "react-toastify";
import ModalBuilderNumberInput from "./Elements/ModalBuilderNumberInput";
import {
  MediaClickActions,
  MediaPositionMap,
  ModalState,
} from "./ModalBuilder";
import SizeUnitPicker from "./SizeUnitPicker";
import UploadSVG from "@heroicons/react/20/solid/CloudArrowUpIcon";
import EditIconSVG from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { MediaType, mediaTypes, SizeUnit, SubMenuOptions } from "./types";
import { EditorMenuOptions } from "./ModalEditorMainMenu";

interface IModalEditorMediaMenuProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  onOptionPick: (
    mode: EditorMenuOptions | SubMenuOptions,
    setPrevious?: boolean
  ) => () => void;
}

const ModalEditorMediaMenu = ({
  modalState,
  setModalState,
  onOptionPick,
}: IModalEditorMediaMenuProps) => {
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

  return (
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
            <div className="flex w-full justify-between items-center">
              <div className="w-full">Additional action:</div>
              <GenericButton
                customClasses={`relative w-full flex text-[12px] !border-[2px] !border-[#2f4a43] !outline-none !ring-transparent !focus:!ring-transparent !font-normal !rounded-[8px] !p-[6px] flex align-center whitespace-nowrap overflow-hidden ${
                  false ? "!bg-[#19362e]" : "!bg-[#2f4a43]"
                }`}
                onClick={onOptionPick(SubMenuOptions.AdditionalClicks, true)}
              >
                <span className="min-w-[16px] max-w-[16px] block mr-[4px]">
                  {/* {el.icon} */} icon
                </span>
                <span className="!pr-[30px] text-ellipsis w-full block text-left overflow-hidden">
                  {/* {el.name} */} name
                </span>
                <div className="absolute opacity-0 hover:!opacity-100 bg-opacity-40 bg-white top-0 left-0 w-full h-full !rounded-[8px] transition-all border-[2px] border-white">
                  <EditIconSVG className="absolute w-[20px] right-[10px] top-1/2 -translate-y-1/2 !text-white shadow-2xl rounded-full" />
                </div>
              </GenericButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalEditorMediaMenu;
