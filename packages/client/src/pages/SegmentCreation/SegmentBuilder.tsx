import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { ConditionalType } from "components/EventCard/EventCard";
import FilterBuilder from "pages/FlowBuilderv2/FilterBuilder/FilterBuilder";
import { DragEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  setSegmentsSettings,
  setShowSegmentsErrors,
} from "reducers/segment.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SegmentType } from "types/Segment";

const SegmentBuilder = () => {
  const { segment, showSegmentsErrors, segmentQueryErrors } = useAppSelector(
    (state) => state.segment
  );
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState(SegmentType.AUTOMATIC);

  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const handleCSVFile = async (file: File) => {
    if (file.type !== "text/csv") {
      toast.error("File must have .csv extension");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsCSVLoading(true);
    try {
      //   const res = await fetch(
      //     `${process.env.REACT_APP_API_BASE_URL}/customers/importcsv`,
      //     {
      //       method: "POST",
      //       body: formData,
      //       headers: {
      //         Authorization: `Bearer ${TokenService.getLocalAccessToken()}`,
      //       },
      //     }
      //   );
      //   if (!res.ok) throw new Error("Error while loading csv");
      //   const {
      //     stats: { created, updated, skipped },
      //   } = await res.json();
      // toast.success(
      //   `Successfully loaded your customer from csv file.\nCreated: ${created}.\nUpdated: ${updated}.\nSkipped: ${skipped}`
      // );
    } catch (e) {
      console.error(e);
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setIsCSVLoading(false);
      setIsCSVImportModalOpen(false);
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

  const handleSaveClick = () => {
    if (Object.values(segmentQueryErrors).length > 0) {
      dispatch(setShowSegmentsErrors(true));

      return;
    }
  };

  return (
    <div>
      <div className="mb-[10px] flex items-center">
        <div className="w-[76px] mr-[15px] font-inter text-[14px] leading-[22px] text-[#18181B]">
          Name
        </div>
        <Input
          value={name}
          placeholder={"Segment name"}
          name="segmentName"
          id="segmentName"
          onChange={(val) => setName(val)}
        />
      </div>
      <div className="mb-[20px] flex items-start">
        <div className="w-[76px] mr-[15px] font-inter text-[14px] leading-[22px] text-[#18181B]">
          Description
        </div>
        <textarea
          className="border-[1px] border-[#E5E7EB] rounded-[4px] px-[12px] py-[4px] font-roboto text-[14px] leading-[22px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] outline-none"
          value={description}
          placeholder={"Segment description"}
          name="segmentDescription"
          id="segmentDescription"
          onChange={(ev) => setDescription(ev.target.value || "")}
        />
      </div>
      <div className="mb-[10px] font-inter font-semibold text-[16px] leading-[24px] text-[#111827]">
        Segment type
      </div>
      <div className="flex gap-[20px] mb-[20px]">
        <div
          className={`w-[340px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
            segmentType === SegmentType.AUTOMATIC
              ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
              : "border-[1px] border-[#E5E7EB]"
          }`}
          onClick={() => setSegmentType(SegmentType.AUTOMATIC)}
        >
          <div className="font-semibold font-inter text-[16px] leading-[24px]">
            Automatic segment
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            Description description description
          </div>
        </div>

        <div
          className={`w-[340px] px-[20px] py-[10px] flex flex-col gap-[10px] rounded-[4px] select-none cursor-pointer ${
            segmentType === SegmentType.MANUAL
              ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
              : "border-[1px] border-[#E5E7EB]"
          }`}
          onClick={() => setSegmentType(SegmentType.MANUAL)}
        >
          <div className="font-semibold font-inter text-[16px] leading-[24px]">
            Manual segment
          </div>
          <div className="font-normal text-[14px] leading-[22px] text-[#4B5563]">
            Description description description
          </div>
        </div>
      </div>
      <div className="mb-[10px] font-inter font-semibold text-[16px] leading-[24px]">
        {segmentType === SegmentType.AUTOMATIC ? "Conditions" : "CSV file"}
      </div>
      {segmentType === SegmentType.AUTOMATIC ? (
        <>
          <FilterBuilder
            settings={segment}
            isSegmentSettings
            onSettingsChange={(settings) =>
              dispatch(setSegmentsSettings(settings))
            }
          />
        </>
      ) : (
        <div
          className="max-w-[700px] relative flex items-center justify-center w-full h-[160px] p-[2px]"
          onDragEnter={handleDrag}
        >
          <label
            htmlFor="dropzone-file"
            className={`flex flex-col items-center justify-center w-full h-full border-2 ${
              isCSVDragActive ? "border-[#6366F1]" : "border-gray-300"
            }  rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
          >
            <div className="flex flex-col items-center justify-between h-full py-[16px]">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_2274_44579)">
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
                <p className="mb-2 text-sm text-[16px] leading-[24px] font-roboto text-[#111827]">
                  Click or drag file to this area to upload
                </p>
                <p className="max-w-[458px] text-[#4B5563] text-[14px] font-roboto leading-[22px] inline-block">
                  Your csv should include one of these fields, email, sms,
                  slackId. For personalization include First Name, and Last Name
                  and other fields
                </p>
              </div>
            </div>
            <input
              id="dropzone-file"
              type="file"
              accept=".csv"
              className="hidden"
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
      <div className="mt-[30px] flex gap-[10px]">
        <Button
          type={ButtonType.PRIMARY}
          className="!text-[white]"
          onClick={handleSaveClick}
        >
          Save
        </Button>
        <Link to="/segment">
          <Button
            type={ButtonType.SECONDARY}
            className="!border-[#E5E7EB] !text-black"
            onClick={() => null}
          >
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SegmentBuilder;
