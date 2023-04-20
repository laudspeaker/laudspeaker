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
    <LinearProgress color="success" className="w-full h-[10px]" />
  ) : (
    <label className="cursor-pointer" htmlFor="pick-image">
      {!imageList[currentMainMode].imageSrc ? (
        <>
          <div className="text-[#22C55E]  hover:bg-[#105529] transition-colors border-[1px] border-[#22C55E] rounded-md inline-flex justify-center items-center px-[6px] py-[4px]">
            <UploadSVG className="w-[20px] h-[20px] mr-[6px]" />
            <small>Upload</small>
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
        <div className="relative inline-block border-[2px] min-h-[20px] min-w-[20px] rounded-md border-[#bac3c0]">
          <img
            className="max-h-[120px] max-w-full rounded-md"
            src={imageList[currentMainMode].imageSrc || ""}
          />
          <CloseSVG
            className="w-[20px] h-[20px] text-white absolute top-0 right-0"
            onClick={handleImageDelete}
          />
        </div>
      )}
    </label>
  );
};

export default ModalMediaUploader;
