import ApiService from "services/api.service";
import { ApiConfig } from "../../../constants";
import { toast } from "react-toastify";
import UploadSVG from "@heroicons/react/20/solid/CloudArrowUpIcon";
import { EditorMenuOptions } from "../ModalEditorMainMenu";
import { ImageBackground, Media, ModalState } from "../types";
import CloseSVG from "@heroicons/react/20/solid/XMarkIcon";
import { useState } from "react";
import tokenService from "services/token.service";
import axios, { AxiosError } from "axios";
import { LinearProgress } from "@mui/material";
import config, { API_BASE_URL_KEY } from "config";

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
  const [progress, setProgress] = useState(0);

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
      const { data } = await axios.request({
        method: "post",
        url: `${config.get(API_BASE_URL_KEY)}/accounts/upload-public-media`,
        data: formData,
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
        },
        onUploadProgress: ({ loaded, total }) => {
          if (total) setProgress(loaded / total);
        },
      });

      const { url, key } = data;

      imageList[currentMainMode].imageSrc = url;
      imageList[currentMainMode].key = key;
      setModalState({ ...modalState });

      toast.success("Image loaded");
    } catch (error) {
      console.error(e);
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setIsMediaLoading(false);
      setProgress(0);
    }
  };

  const handleImageDelete = async () => {
    if (!imageList[currentMainMode].key) {
      return;
    }
    setIsMediaLoading(true);
    setProgress(1);

    try {
      await ApiService.post({
        url: ApiConfig.deleteMedia + imageList[currentMainMode].key,
      });

      imageList[currentMainMode].imageSrc = "";
      imageList[currentMainMode].key = null;
      setModalState({ ...modalState });

      toast.success("Image deleted");
    } catch (error) {
      let message = "Error while deleting image";
      if (error instanceof AxiosError) message = error.message;

      toast.error(message);
    } finally {
      setIsMediaLoading(false);
      setProgress(0);
    }
  };

  return isMediaLoading ? (
    <div className="relative flex flex-col justify-center items-center gap-[10px] border-dashed border-2 p-[10px] h-[100px] w-[100px] rounded-md border-[#D9D9D9]">
      <div>
        {imageList[currentMainMode].key ? "Deleting..." : "Uploading..."}
      </div>

      <div className="w-full bg-[#D1D5DB] rounded-full h-1">
        <div
          className="bg-[#6366F1] h-1 rounded-full"
          style={{
            width: `${progress * 100}%`,
          }}
        ></div>
      </div>
    </div>
  ) : (
    <label className="cursor-pointer" htmlFor="pick-image">
      {!imageList[currentMainMode].imageSrc ? (
        <>
          <div className="text-[#111827] transition-colors border border-[#E5E7EB] rounded-md inline-flex justify-center items-center px-[16px] py-[5px]">
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
            <div className="text-[#111827] font-normal leading-[22px] text-[14px]">
              Click to upload
            </div>
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
        <div className="relative inline-block border-2 p-[10px] min-h-[20px] min-w-[20px] rounded-md border-[#D9D9D9]">
          <div className="relative">
            <img
              className="min-h-[80px] max-h-[80px] max-w-full rounded-md"
              src={imageList[currentMainMode].imageSrc || ""}
            />

            <div
              className="absolute flex justify-center items-center top-0 left-0 w-full h-full bg-black bg-opacity-25 opacity-0 hover:opacity-100"
              onClick={handleImageDelete}
            >
              <svg
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.28739 2.14118H4.14453C4.2231 2.14118 4.28739 2.0769 4.28739 1.99833V2.14118H9.71596V1.99833C9.71596 2.0769 9.78025 2.14118 9.85882 2.14118H9.71596V3.4269H11.0017V1.99833C11.0017 1.36797 10.4892 0.855469 9.85882 0.855469H4.14453C3.51417 0.855469 3.00167 1.36797 3.00167 1.99833V3.4269H4.28739V2.14118ZM13.2874 3.4269H0.71596C0.399888 3.4269 0.144531 3.68225 0.144531 3.99833V4.56975C0.144531 4.64833 0.208817 4.71261 0.287388 4.71261H1.36596L1.80703 14.0519C1.8356 14.6608 2.33917 15.1412 2.9481 15.1412H11.0552C11.666 15.1412 12.1677 14.6626 12.1963 14.0519L12.6374 4.71261H13.716C13.7945 4.71261 13.8588 4.64833 13.8588 4.56975V3.99833C13.8588 3.68225 13.6035 3.4269 13.2874 3.4269ZM10.9177 13.8555H3.0856L2.65346 4.71261H11.3499L10.9177 13.8555Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </label>
  );
};

export default ModalMediaUploader;
