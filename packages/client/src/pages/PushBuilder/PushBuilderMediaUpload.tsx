import ApiService from "services/api.service";
import { toast } from "react-toastify";
import { useId, useState } from "react";
import tokenService from "services/token.service";
import axios, { AxiosError } from "axios";
import ApiConfig from "../../constants/api";
import PlusIcon from "@heroicons/react/20/solid/PlusIcon";
import config, { API_BASE_URL_KEY } from "config";

interface PushBuilderMediaUploadProps {
  img?: { key: string; imageSrc: string };
  onImageUploaded: (newImg?: { key: string; imageSrc: string }) => void;
}

const PushBuilderMediaUpload = ({
  img,
  onImageUploaded,
}: PushBuilderMediaUploadProps) => {
  const id = useId();
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!e.target.files?.length || !file) {
      return;
    } else if ((e.target.files?.length || 0) > 1) {
      toast.error("Only one file can be uploaded!");
      return;
    } else if ((file?.size || 0) > 1048576) {
      toast.error("Max file size 1mb");
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

      onImageUploaded({ key: key, imageSrc: url });

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
    if (!img?.key) {
      return;
    }
    setIsMediaLoading(true);
    setProgress(1);

    try {
      await ApiService.post({
        url: ApiConfig.deleteMedia + img.key,
      });

      onImageUploaded(undefined);

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
    <div className="relative flex flex-col justify-center items-center gap-[10px] border-dashed border-2 p-[10px] h-[100px] w-[100px] rounded-sm border-[#D9D9D9]">
      <div>{img?.key ? "Deleting..." : "Uploading..."}</div>

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
    <label className="cursor-pointer" htmlFor={`pick-image-${id}`}>
      {!img?.imageSrc ? (
        <>
          <div className="bg-[#F9FAFB] w-[100px] h-[100px] text-[#111827] transition-colors border border-[#E5E7EB] rounded-sm inline-flex justify-center flex-col items-center px-[16px] py-[5px]">
            <PlusIcon className="text-[#111827] fill-[#111827] w-[18px] h-[18px]" />
            <div className="text-[#4B5563] font-roboto leading-[22px] text-[14px]">
              Upload
            </div>
          </div>
          <input
            id={`pick-image-${id}`}
            hidden
            type="file"
            accept=".jpg, .jpeg, .png, .gif"
            multiple={false}
            onChange={(e) => handleImageUpload(e)}
          />
        </>
      ) : (
        <div className="relative bg-[#F9FAFB] inline-block border-2 p-[10px] min-h-[20px] min-w-[20px] rounded-sm border-[#D9D9D9]">
          <div className="relative">
            <img
              className="min-h-[80px] max-h-[80px] max-w-full rounded-sm"
              src={img?.imageSrc || ""}
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

export default PushBuilderMediaUpload;
