import { default as appConfig } from "../../config";
import CheckBox from "components/Checkbox/Checkbox";
import Input from "components/Elements/Inputv2";
import { DragEvent, useState } from "react";
import { toast } from "react-toastify";
import { PushSettingsConfiguration } from "./PushSettings";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { PushPlatforms } from "pages/PushBuilder/PushBuilderContent";
import tokenService from "services/token.service";
import { API_BASE_URL_KEY } from "config";

interface PushSettingsFirebaseConfigurationProps {
  config: PushSettingsConfiguration;
  updateConfig: (values: Partial<PushSettingsConfiguration>) => void;
}

const PushSettingsFirebaseConfiguration = ({
  config,
  updateConfig,
}: PushSettingsFirebaseConfigurationProps) => {
  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const handleCSVFile = async (file: File) => {
    if (file.type !== "application/json") {
      toast.error("File must have .json extension");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsFileLoading(true);
    try {
      const res = await fetch(
        `${appConfig.get(API_BASE_URL_KEY)}/accounts/settings/validateFirebase`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
          },
        }
      );
      if (!res.ok) throw new Error("Error during credentials validation");

      const data = await res.json();

      const object = {
        fileName: file.name,
        credentials: data,
      };

      updateConfig({
        configFile: {
          Android: config.selectedPlatforms.Android ? object : undefined,
          iOS: config.selectedPlatforms.iOS ? object : undefined,
        },
      });
      toast.success(`Credentials validated.`);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setIsFileLoading(false);
    }
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

  return (
    <>
      <div className="mb-[-10px] font-inter text-[#111827] text-base font-semibold">
        Server key (.JSON)
      </div>
      {config.configFile.Android || config.configFile.iOS?.fileName ? (
        <div className="w-full flex justify-between text-[#6366F1] p-[10px] border font-semibold border-[#E5E7EB] bg-[#F9FAFB] ">
          <div className="whitespace-nowrap overflow-hidden max-w-full text-ellipsis text-sm font-inter">
            {config.configFile.Android?.fileName ||
              config.configFile.iOS?.fileName}
          </div>
          <TrashIcon
            className="text-[#4B5563] min-w-[20px] w-5 h-5 cursor-pointer"
            onClick={() =>
              updateConfig({
                configFile: {
                  Android: undefined,
                  iOS: undefined,
                },
              })
            }
          />
        </div>
      ) : (
        <div
          className="w-full relative flex items-center justify-center h-[128px]"
          onDragEnter={handleDrag}
        >
          <label
            htmlFor="dropzone-file"
            className={`flex flex-col items-center h-full justify-center w-full border-2 ${
              isCSVDragActive ? "border-[#6366F1]" : "border-gray-300"
            }  rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
          >
            {isFileLoading ? (
              <div className="relative bg-transparent border-t-transparent  border-[#6366F1] border-4 rounded-full w-10 h-10 animate-spin" />
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
                    Click or drag file to this area to upload
                  </p>
                </div>
              </div>
            )}
            <input
              id="dropzone-file"
              type="file"
              accept=".json"
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
      )}
      <div className="-my-[10px] font-inter text-[#111827] text-sm font-semibold">
        URL
      </div>
      <Input
        value={""}
        onChange={(val) => {}}
        wrapperClassName="w-full"
        placeholder="Url will be showed after uploading the server key"
        disabled={true}
        className={`w-full disabled:grayscale disabled:border-[#E5E7EB] disabled:bg-[#F9FAFB]`}
      />
      <CheckBox
        text={"Uninstall tracking for this app"}
        initValue={config.isTrackingDisabled}
        propControl={true}
        className="-mt-[10px]"
        onCheck={(isTrackingDisabled) => updateConfig({ isTrackingDisabled })}
      />
      {config.selectedPlatforms.iOS && (
        <div>
          <hr className="border-[#E5E7EB] mb-5" />
          <div className="flex items-center">
            <div className="bg-[#F3F4F6] mr-[5px] gap-[5px] max-w-[48px] text-sm text-[#4B5563] font-inter font-semibold rounded-[2px] px-[5px] py-[2px] flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="13"
                viewBox="0 0 10 13"
                fill="none"
              >
                <path
                  d="M6.64394 2.75608C7.05782 2.2384 7.33868 1.54331 7.26461 0.833008C6.65874 0.863134 5.91939 1.23272 5.49135 1.7508C5.10701 2.19446 4.76684 2.91866 4.85552 3.59918C5.53564 3.65818 6.21513 3.25923 6.64394 2.75608Z"
                  fill="#4B5563"
                />
                <path
                  d="M7.25698 3.73246C6.26928 3.67362 5.4295 4.29302 4.95782 4.29302C4.48589 4.29302 3.7636 3.7621 2.98238 3.77641C1.96558 3.79135 1.02211 4.36625 0.506127 5.28062C-0.555162 7.10981 0.226053 9.82314 1.2581 11.3129C1.75929 12.05 2.3633 12.8615 3.15918 12.8323C3.91115 12.8028 4.2059 12.3454 5.11995 12.3454C6.03334 12.3454 6.29884 12.8323 7.09485 12.8176C7.92033 12.8028 8.43641 12.0802 8.93758 11.3424C9.51254 10.5022 9.7479 9.69097 9.76271 9.64644C9.7479 9.63169 8.17094 9.02673 8.15632 7.21274C8.14143 5.69386 9.39441 4.9714 9.45338 4.9266C8.74581 3.8801 7.64025 3.7621 7.25698 3.73246Z"
                  fill="#4B5563"
                />
              </svg>
              <span>iOS</span>
            </div>
            <span className="text-sm text-[#4B5563] font-inter font-semibold">
              Additional Instructions
            </span>
          </div>
          <div className="mt-[10px] text-sm font-roboto text-[#4B5563]">
            Additional Instructions for iOS Additional Instructions for iOS
            Additional Instructions for iOS
          </div>
        </div>
      )}
    </>
  );
};

export default PushSettingsFirebaseConfiguration;
