import ApiService from "services/api.service";
import { ApiConfig } from "../../../constants";
import { toast } from "react-toastify";
import UploadSVG from "@heroicons/react/20/solid/CloudArrowUpIcon";
import { ModalState } from "../ModalBuilder";
import { EditorMenuOptions } from "../ModalEditorMainMenu";
import { ImageBackground, Media } from "../types";
import CloseSVG from "@heroicons/react/20/solid/XMarkIcon";
import { useState } from "react";
import tokenService from "services/token.service";
import { AxiosError } from "axios";
import { LinearProgress } from "@mui/material";

interface IModalMediaUploaderProps {
  modalState: ModalState;
  setModalState: (modalState: ModalState) => void;
  currentMainMode: EditorMenuOptions;
}

const ModalMediaUploader = ({
  modalState,
  setModalState,
  currentMainMode,
}: IModalMediaUploaderProps) => {
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const imageList: { [key: string]: ImageBackground | Media } = {
    [EditorMenuOptions.CANVAS]: modalState.background.image,
    [EditorMenuOptions.MEDIA]: modalState.media,
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!e.target.files?.length || !file) {
      return;
    } else if ((e.target.files?.length || 0) > 1) {
      toast.error("Only one file can be uploaded!");
      return;
    } else if ((file?.size || 0) > 10485760) {
      toast.error("Max file size 10mb");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsMediaLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/accounts/upload-public-media`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error while loading csv");

      const { url, key } = await res.json();

      imageList[currentMainMode].imageSrc = url;
      imageList[currentMainMode].key = key;
      setModalState({ ...modalState });

      toast.success("Image loaded");
    } catch (error) {
      console.error(e);
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!imageList[currentMainMode].key) {
      return;
    }
    setIsMediaLoading(true);

    try {
      await ApiService.post({
        url: ApiConfig.deleteMedia + imageList[currentMainMode].key,
      });

      imageList[currentMainMode].imageSrc = "";
      imageList[currentMainMode].key = null;
      setModalState({ ...modalState });

      toast.success("Image deleted");
    } catch (error) {
      toast.error((error as AxiosError).message);
    } finally {
      setIsMediaLoading(false);
    }
  };

  return isMediaLoading ? (
    <div className="relative inline-block border-dashed border-[2px] p-[10px] min-h-[20px] min-w-[20px] rounded-md border-[#D9D9D9]">
      <div>Uploading...</div>
      <LinearProgress color="info" className="w-full h-[10px] mt-[10px]" />
    </div>
  ) : (
    <label className="cursor-pointer" htmlFor="pick-image">
      {!imageList[currentMainMode].imageSrc ? (
        <>
          <div className="text-[#111827] transition-colors border-[1px] border-[#E5E7EB] rounded-md inline-flex justify-center items-center px-[16px] py-[5px]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-[6px]"
            >
              <path
                d="M4.25 2.96905H5.40469V8.25499C5.40469 8.32374 5.46094 8.37999 5.52969 8.37999H6.46719C6.53594 8.37999 6.59219 8.32374 6.59219 8.25499V2.96905H7.75C7.85469 2.96905 7.9125 2.84874 7.84844 2.76749L6.09844 0.551867C6.08674 0.536927 6.0718 0.524844 6.05475 0.516534C6.03769 0.508225 6.01897 0.503906 6 0.503906C5.98103 0.503906 5.96231 0.508225 5.94525 0.516534C5.92819 0.524844 5.91326 0.536927 5.90156 0.551867L4.15156 2.76593C4.0875 2.84874 4.14531 2.96905 4.25 2.96905ZM11.7188 7.78624H10.7812C10.7125 7.78624 10.6562 7.84249 10.6562 7.91124V10.3175H1.34375V7.91124C1.34375 7.84249 1.2875 7.78624 1.21875 7.78624H0.28125C0.2125 7.78624 0.15625 7.84249 0.15625 7.91124V11.005C0.15625 11.2816 0.379687 11.505 0.65625 11.505H11.3438C11.6203 11.505 11.8438 11.2816 11.8438 11.005V7.91124C11.8438 7.84249 11.7875 7.78624 11.7188 7.78624Z"
                fill="#9CA3AF"
              />
            </svg>
            <div className="text-[#111827]">Click to upload</div>
          </div>
          <input
            id="pick-image"
            hidden
            type="file"
            accept=".jpg, .jpeg, .png, .gif"
            multiple={false}
            onChange={(e) => handleImageUpload(e)}
          />
        </>
      ) : (
        <div className="relative inline-block border-[2px] p-[10px] min-h-[20px] min-w-[20px] rounded-md border-[#D9D9D9]">
          <img
            className="max-h-[80px] max-w-full rounded-md"
            src={imageList[currentMainMode].imageSrc || ""}
          />
          <CloseSVG
            className="w-[20px] h-[20px] text-black absolute top-0 right-0"
            onClick={handleImageDelete}
          />
        </div>
      )}
    </label>
  );
};

export default ModalMediaUploader;
