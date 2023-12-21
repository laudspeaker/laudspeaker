import React, { ChangeEvent, DragEvent, FC, useState } from "react";
import { Grid } from "@mui/material";
import { GenericButton, Input, Select } from "components/Elements";
import TokenService from "../../services/token.service";
import { toast } from "react-toastify";
import Progress from "components/Progress";
import ApiService from "services/api.service";
import { useNavigate } from "react-router-dom";
import MySegment from "pages/Segment/MySegment";
import config, { API_BASE_URL_KEY } from "config";

export enum SegmentType {
  AUTOMATIC = "automatic",
  MANUAL = "manual",
}

export interface INameSegmentForm {
  name: string;
  description: string;
  type: SegmentType;
}

interface NameSegmentProps {
  onSubmit?: (segmentForm: INameSegmentForm) => void;
}

const NameSegment: FC<NameSegmentProps> = ({ onSubmit }) => {
  const navigate = useNavigate();

  const [segmentForm, setSegmentForm] = useState<INameSegmentForm>({
    name: "",
    description: "",
    type: SegmentType.AUTOMATIC,
  });

  const [isAutomaticSegmentModalOpen, setIsAutomaticSegmentModalOpen] =
    useState(false);

  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const handleCSVFile = async (file: File) => {
    if (file.type !== "text/csv") {
      toast.error("File must have .csv extension");
      return;
    }

    const {
      data: { id },
    } = await ApiService.post({ url: "/segments", options: segmentForm });

    const formData = new FormData();
    formData.append("file", file);

    setIsCSVLoading(true);
    try {
      const res = await fetch(
        `${config.get(API_BASE_URL_KEY)}/segments/${id}/importcsv`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${TokenService.getLocalAccessToken()}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error while loading csv");
      const {
        stats: { created, updated, skipped },
      } = await res.json();

      toast.success(
        `Successfully loaded your customers from csv file.\nCreated: ${created}.\nUpdated: ${updated}.\nSkipped: ${skipped}`
      );
      navigate("/segment/" + id);
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

  // Handling Name and Description Fields
  const handleSegmentFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSegmentForm({ ...segmentForm, [e.target.name]: e.target.value });
  };

  const handleType = (value: SegmentType) => {
    setSegmentForm({ ...segmentForm, type: value });
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    onSubmit?.(segmentForm);
  };

  return (
    <div
      className="relative w-full"
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit(e);
      }}
    >
      {isAutomaticSegmentModalOpen ? (
        <MySegment
          isCollapsible={true}
          onClose={() => setIsAutomaticSegmentModalOpen(false)}
          workflowId=""
          defaultTitle={segmentForm.name}
          onSubmit={(segmentId) => navigate("/segment/" + segmentId)}
        />
      ) : isCSVImportModalOpen ? (
        <>
          <div className="rounded-lg bg-white opacity-100">
            {isCSVLoading ? (
              <Progress />
            ) : (
              <div
                className="relative flex items-center justify-center"
                onDragEnter={handleDrag}
              >
                <label
                  htmlFor="dropzone-file"
                  className={`flex flex-col items-center justify-center w-full h-full border-2 ${
                    isCSVDragActive ? "border-cyan-300" : "border-gray-300"
                  } border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      aria-hidden="true"
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-[10px] inline-block">
                      Your csv should include one of these fields, email, sms,
                      slackId. For personalization include First Name, and Last
                      Name and other fields
                    </p>
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
          </div>
        </>
      ) : (
        <div className="flex items-start justify-center">
          <div className="w-full">
            <h3>Name your Segment</h3>
            <Grid container direction={"row"} padding={"10px 0px"}>
              <div className="w-full">
                <Input
                  isRequired
                  value={segmentForm.name}
                  placeholder={"Enter name"}
                  name="name"
                  id="name"
                  className="w-full px-[16px] py-[15px] bg-[#fff] border border-[#D1D5DB] font-[Inter] text-[16px] "
                  onChange={handleSegmentFormChange}
                />
              </div>
              <div className="w-full">
                <Input
                  isRequired
                  value={segmentForm.description}
                  placeholder={"Enter description"}
                  name="description"
                  id="description"
                  className="w-full px-[16px] py-[15px] bg-[#fff] border border-[#D1D5DB] font-[Inter] text-[16px] "
                  onChange={handleSegmentFormChange}
                />
              </div>
              <form
                className="w-auto mt-[20px] flex justify-start items-center"
                onSubmit={handleSubmit}
              >
                <label
                  htmlFor="handleDay"
                  className="font-[Inter] text-[16px] font-medium mr-1"
                >
                  Type of segment:
                </label>
                <Select
                  id="handleDay"
                  name="handleDay"
                  value={segmentForm.type}
                  onChange={handleType}
                  options={[
                    { value: SegmentType.AUTOMATIC },
                    { value: SegmentType.MANUAL },
                  ]}
                  displayEmpty
                />
              </form>
            </Grid>
            <div className="flex justify-end">
              <GenericButton
                id="submitTemplateCreation"
                onClick={() =>
                  segmentForm.type === "automatic"
                    ? setIsAutomaticSegmentModalOpen(true)
                    : setIsCSVImportModalOpen(true)
                }
                style={{
                  maxWidth: "200px",
                }}
                disabled={!segmentForm.name || !segmentForm.type}
              >
                Next
              </GenericButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NameSegment;
