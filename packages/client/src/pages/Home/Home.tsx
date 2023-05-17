import Header from "components/Header";
import Progress from "components/Progress";
import React, { DragEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import Account from "types/Account";
import TokenService from "../../services/token.service";

const Home = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get<Account>({ url: "/accounts" });

      setFirstName(data?.firstName || "");
    })();
  }, []);

  const handleCSVFile = async (file: File) => {
    if (file.type !== "text/csv") {
      toast.error("File must have .csv extension");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsCSVLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/customers/importcsv`,
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
        `Successfully loaded your customer from csv file.\nCreated: ${created}.\nUpdated: ${updated}.\nSkipped: ${skipped}`
      );
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

  return (
    <div>
      <div className="">
        <div className="mx-auto flex flex-col">
          <main className="relative">
            {isCSVImportModalOpen && (
              <>
                <div
                  className="absolute w-full h-screen bg-black opacity-20 z-[119]"
                  onClick={() => setIsCSVImportModalOpen(false)}
                />
                <div className="fixed z-[121] w-[70%] h-[300px] rounded-lg bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100">
                  {isCSVLoading ? (
                    <Progress />
                  ) : (
                    <div
                      className="relative flex items-center justify-center w-full h-full p-[2px]"
                      onDragEnter={handleDrag}
                    >
                      <label
                        htmlFor="dropzone-file"
                        className={`flex flex-col items-center justify-center w-full h-full border-2 ${
                          isCSVDragActive
                            ? "border-cyan-300"
                            : "border-gray-300"
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
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 px-[10px] inline-block">
                            Your csv should include one of these fields, email,
                            sms, slackId. For personalization include First
                            Name, and Last Name and other fields
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
            )}
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Welcome Home {firstName}
                  </h1>
                </div>
                <div className="px-4 sm:px-6 md:px-0">
                  <div className="py-3">
                    Jump back in where you left off, or start a new journey!
                  </div>
                </div>
                <div className="w-full bg-white flex flex-wrap rounded-md items-stretch justify-center mt-[80px]">
                  <div
                    className="w-1/2 border-r-[1px] border-b-[1px] border-[#E8EAED] p-[20px] cursor-pointer hover:bg-gray-100"
                    onClick={() => navigate("/onboarding")}
                  >
                    <div className="h-[80px] flex justify-between items-start">
                      <div className="text-[#518983] bg-[#F2FDFA] w-10 h-10 rounded-md flex justify-center items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-[#D2D5DA]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Complete onboarding
                      </h1>
                      <ol className="list-decimal pl-[10px] py-[10px] text-[#A8ABB3]">
                        <li>Add messaging channels</li>
                        <li>Set up events</li>
                        <li>Optionally add customers</li>
                      </ol>
                    </div>
                  </div>
                  <div
                    className="w-1/2 border-b-[1px] border-[#E8EAED] p-[20px] cursor-pointer hover:bg-gray-100"
                    onClick={() => navigate("/flow")}
                  >
                    <div className="h-[80px] flex justify-between items-start">
                      <div className="text-[#7635C7] bg-[#F9F5FE] w-10 h-10 rounded-md flex justify-center items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                          />
                        </svg>
                      </div>
                      <div className="text-[#D2D5DA]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Create a journey
                      </h1>
                      <p className="text-[#A8ABB3] py-[10px]">
                        Move on and create your first journey.
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-full border-r-[1px] border-b-[1px] border-[#E8EAED] p-[20px] cursor-pointer hover:bg-gray-100"
                    onClick={() => setIsCSVImportModalOpen(true)}
                  >
                    <div className="h-[80px] flex justify-between items-start">
                      <div className="text-[#076da2] bg-[#f0f9ff] w-10 h-10 rounded-md flex justify-center items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-[#D2D5DA]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Import a csv
                      </h1>
                      <p className="pl-[10px] py-[10px] text-[#A8ABB3]">
                        Import customers using your csv.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Home;
