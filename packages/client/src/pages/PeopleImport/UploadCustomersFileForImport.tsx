import axios from "axios";
import { useState, DragEvent, useRef } from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import tokenService from "services/token.service";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ImportParams } from "./PeopleImport";
import ApiService from "services/api.service";
import { confirmAlert } from "react-confirm-alert";
import config, { API_BASE_URL_KEY } from "config";

interface UploadFileProps {
  fileData?: ImportParams;
  mainUploadText: string;
  subUploadText?: string;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onUpdate: () => void;
}

const defaultProgress = {
  loadedMB: 0,
  totalMB: 0,
  speed: 0,
};

const defaultLastRecord = {
  lastLoaded: 0,
  lastTime: Date.now(),
};

const UploadCustomersFileForImport = ({
  mainUploadText,
  subUploadText,
  isLoading,
  fileData,
  onUpdate,
  setIsLoading,
}: UploadFileProps) => {
  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isFileValidating, setIsFileValidating] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(defaultProgress);
  const [lastRecord, setLastRecord] = useState(defaultLastRecord);

  const clearFileInput = () => {
    if (uploadInputRef.current?.value) uploadInputRef.current.value = "";
  };

  const handleUploadFile = async (
    results: Papa.ParseResult<File>,
    file: File
  ) => {
    if (results.errors.length > 0) {
      clearFileInput();
      setIsFileValidating(false);
      setIsLoading(false);
      toast.error(
        "You have errors in your CSV structure, please check you file and try again"
      );
      return;
    }
    setIsFileValidating(false);
    setIsFileLoading(true);
    setProgress({ ...defaultProgress });
    setLastRecord({ ...defaultLastRecord });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.request({
        method: "post",
        url: `${config.get(API_BASE_URL_KEY)}/customers/uploadCSV`,
        data: formData,
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const now = Date.now();
          const timeElapsed = (now - lastRecord.lastTime) / 1000;

          const speed =
            timeElapsed !== 0
              ? (loaded - lastRecord.lastLoaded) / timeElapsed / 1024 / 1024
              : 0;
          const loadedMB = (loaded / 1024 / 1024).toFixed(2);
          const totalMB = (total! / 1024 / 1024).toFixed(2);

          setProgress({
            loadedMB: parseFloat(loadedMB),
            totalMB: parseFloat(totalMB),
            speed,
          });
          setLastRecord({ lastLoaded: loaded, lastTime: now });
        },
      });
    } catch (err) {
      toast.error("Error processing this CSV file");
    }
    onUpdate();
    setIsFileLoading(false);
    setIsLoading(false);
    clearFileInput();
  };

  const handleCSVFile = async (file: File) => {
    try {
      if (file.type !== "text/csv") {
        toast.error("File must have .csv extension");
        return;
      } else if (file.size >= 1073741824) {
        toast.error("File size should not more than 1GB");
        return;
      }
      setIsLoading(true);
      setIsFileValidating(true);

      const formData = new FormData();
      formData.append("file", file);

      if (file instanceof File)
        Papa.parse<File>(file, {
          encoding: "UTF-8",
          header: true,
          delimiter: ",",
          // worker: true,
          complete(results) {
            handleUploadFile(results, file);
          },
          error(err) {
            toast.error(
              "Error processing file, make sure you upload CSV file."
            );
            clearFileInput();
            setIsFileValidating(false);
            setIsLoading(false);
          },
        });
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (isLoading || !fileData?.file?.fileKey) return;

    confirmAlert({
      title: "Confirm deletion?",
      message:
        "Are you sure you want to delete uploaded file? You will have to upload file again!",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsLoading(true);
            try {
              await ApiService.post({
                url: `/customers/imports/delete/${fileData.file!.fileKey}`,
              });
              await onUpdate();
            } catch (error) {
              toast.error("Error during file deletion.");
            }
            setIsLoading(false);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  const handleDrag = function (e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsCSVDragActive(true);
    } else if (e.type === "dragleave") {
      setIsCSVDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCSVDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleCSVFile(file);
    }
  };

  return fileData?.file ? (
    <>
      <div className="w-full flex justify-between text-[#6366F1] p-[10px] border font-semibold border-[#E5E7EB] bg-[#F9FAFB] ">
        <div className="whitespace-nowrap overflow-hidden max-w-full text-ellipsis text-sm font-inter">
          {fileData.file.fileName}
        </div>
        <TrashIcon
          className="text-[#4B5563] min-w-[20px] w-5 h-5 cursor-pointer"
          onClick={handleDelete}
        />
      </div>
    </>
  ) : (
    <div
      className={`${
        isLoading && "pointer-events-none"
      } w-full relative flex items-center justify-center h-[160px]`}
      onDragEnter={handleDrag}
    >
      <label
        htmlFor="dropzone-file"
        className={`flex flex-col items-center h-full justify-center w-full border-2 ${
          isCSVDragActive ? "border-[#6366F1]" : "border-gray-300"
        }  rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
      >
        {isFileLoading || isFileValidating ? (
          <div className="flex flex-col justify-center items-center">
            <div className="relative bg-transparent border-t-transparent  border-[#6366F1] border-4 rounded-full w-10 h-10 animate-spin" />
            <div className="text-center mt-3">
              <p className="mb-2 text-base font-roboto text-[#4B5563] animate-pulse">
                {isFileValidating
                  ? "Validating CSV file"
                  : progress.loadedMB === progress.totalMB && !!progress.totalMB
                  ? "Finishing upload, please wait"
                  : `Uploading ${progress.loadedMB}MB / ${
                      progress.totalMB
                    }MB at ${progress.speed.toFixed(2)} MB/s`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="w-9 h-9 mb-5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_2274_44579)">
                <path
                  d="M18.2532 15.8753C18.2231 15.8369 18.1847 15.8058 18.1408 15.7844C18.097 15.7631 18.0488 15.752 18 15.752C17.9512 15.752 17.9031 15.7631 17.8592 15.7844C17.8154 15.8058 17.777 15.8369 17.7469 15.8753L13.2469 21.5686C13.2098 21.616 13.1868 21.6728 13.1805 21.7327C13.1742 21.7925 13.1848 21.8529 13.2112 21.907C13.2376 21.961 13.2787 22.0066 13.3298 22.0384C13.3809 22.0702 13.4399 22.087 13.5 22.0869H16.4692V31.8262C16.4692 32.003 16.6139 32.1476 16.7907 32.1476H19.2014C19.3782 32.1476 19.5228 32.003 19.5228 31.8262V22.0909H22.5C22.7692 22.0909 22.9179 21.7815 22.7532 21.5726L18.2532 15.8753Z"
                  fill="#4B5563"
                />
                <path
                  d="M30.0295 12.1565C28.1893 7.3029 23.5004 3.85156 18.008 3.85156C12.5156 3.85156 7.82679 7.29888 5.98661 12.1525C2.5433 13.0565 0 16.1944 0 19.923C0 24.3627 3.59598 27.9587 8.0317 27.9587H9.64286C9.81964 27.9587 9.96429 27.8141 9.96429 27.6373V25.2266C9.96429 25.0498 9.81964 24.9051 9.64286 24.9051H8.0317C6.67768 24.9051 5.40402 24.3667 4.4558 23.3904C3.51161 22.4181 3.00937 21.1083 3.05357 19.7502C3.08973 18.6895 3.45134 17.6931 4.10625 16.8533C4.77723 15.9975 5.71741 15.3748 6.76205 15.0975L8.28482 14.6998L8.8433 13.2292C9.18884 12.3132 9.67098 11.4574 10.2777 10.6819C10.8766 9.91333 11.5861 9.2377 12.383 8.67701C14.0344 7.51585 15.979 6.90112 18.008 6.90112C20.0371 6.90112 21.9817 7.51585 23.633 8.67701C24.4326 9.23951 25.1397 9.91451 25.7384 10.6819C26.3451 11.4574 26.8272 12.3172 27.1728 13.2292L27.7272 14.6958L29.246 15.0975C31.4237 15.6842 32.9464 17.665 32.9464 19.923C32.9464 21.2529 32.4281 22.5065 31.4879 23.4467C31.0269 23.9104 30.4784 24.2781 29.8742 24.5285C29.2701 24.7788 28.6223 24.9069 27.9683 24.9051H26.3571C26.1804 24.9051 26.0357 25.0498 26.0357 25.2266V27.6373C26.0357 27.8141 26.1804 27.9587 26.3571 27.9587H27.9683C32.404 27.9587 36 24.3627 36 19.923C36 16.1984 33.4647 13.0645 30.0295 12.1565Z"
                  fill="#4B5563"
                />
              </g>
              <defs>
                <clipPath id="clip0_2274_44579">
                  <rect
                    width="36"
                    height="36"
                    fill="white"
                    transform="translate(0 0.00195312)"
                  />
                </clipPath>
              </defs>
            </svg>

            <div className="text-center">
              <p className="mb-2 text-base font-roboto text-[#111827]">
                {mainUploadText}
              </p>
            </div>
            {subUploadText && (
              <div className="text-center max-w-[460px]">
                <p className="mb-2 text-sm font-roboto text-[#4B5563]">
                  {subUploadText}
                </p>
              </div>
            )}
          </div>
        )}
        <input
          id="dropzone-file"
          type="file"
          ref={uploadInputRef}
          accept={".csv"}
          className="hidden"
          disabled={isFileLoading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleCSVFile(e.target.files[0]);
            }
          }}
        />
      </label>
      {isCSVDragActive && (
        <div
          className="absolute w-full h-full top-0 right-0 bottom-0 left-0"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        ></div>
      )}
    </div>
  );
};

export default UploadCustomersFileForImport;
