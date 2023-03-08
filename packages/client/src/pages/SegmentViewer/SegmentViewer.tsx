import { GenericButton, Input } from "components/Elements";
import Header from "components/Header";
import Progress from "components/Progress";
import { TableTemplate } from "components/TableTemplate";
import React, { DragEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import ApiService from "services/api.service";
import { SegmentType } from "pages/SegmentTable/NameSegment";
import { MySegment } from "pages/Segment";
import TokenService from "../../services/token.service";
import Modal from "components/Elements/Modal";
import SegmentCustomerPicker from "./SegmentCustomerPicker";

const SegmentViewer = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "" });
  const [segmentType, setSegmentType] = useState<SegmentType>();
  const [customers, setCustomers] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOptions, setSortOptions] = useState({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [addCustomerPickedOption, setAddCustomerPickedOption] = useState<
    "csv" | "existing"
  >();

  const [isCSVDragActive, setIsCSVDragActive] = useState(false);
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: segmentData } = await ApiService.get({
        url: `/segments/${id}`,
      });

      const { name, description, type } = segmentData;

      setSegmentForm({ name, description });
      setSegmentType(type);

      const { data: customersData } = await ApiService.get({
        url: `/segments/${id}/customers?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
          Object.values(sortOptions)[0] || ""
        }&showDeleted=${showDeleted}`,
      });
      const { data: fetchedCustomers, totalPages } = customersData;
      setPagesCount(totalPages);
      setCustomers(fetchedCustomers);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemsPerPage, currentPage, sortOptions, showDeleted]);

  const handleSave = async () => {
    setTitleEdit(false);
    setIsSaving(true);
    try {
      await ApiService.patch({ url: "/segments/" + id, options: segmentForm });
    } catch (e) {
      toast.error("Error while saving segment");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomerFromSegment = async (customerId: string) => {
    await ApiService.delete({ url: `/segments/${id}/customers/${customerId}` });
    await loadData();
  };

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
        `${process.env.REACT_APP_API_BASE_URL}/segments/${id}/importcsv`,
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

      setAddCustomerModalOpen(false);
      setAddCustomerPickedOption(undefined);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setIsCSVLoading(false);
      loadData();
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

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );

  if (loading) return <Progress />;

  return (
    <div className="w-full relative">
      <Header />
      <div className="py-[37px] px-[30px]">
        {segmentType === SegmentType.AUTOMATIC ? (
          <div>
            <MySegment
              isCollapsible={true}
              onClose={() => {}}
              workflowId=""
              defaultTitle={segmentForm.name}
              segmentId={id}
            />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center p-[20px] h=[104px]">
              {titleEdit ? (
                <div>
                  <Input
                    name="name"
                    label="name"
                    value={segmentForm.name}
                    onChange={(e) =>
                      setSegmentForm({ ...segmentForm, name: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && setTitleEdit(false)}
                  />
                  <Input
                    name="description"
                    label="description"
                    value={segmentForm.description}
                    onChange={(e) =>
                      setSegmentForm({
                        ...segmentForm,
                        description: e.target.value,
                      })
                    }
                    onKeyDown={(e) => e.key === "Enter" && setTitleEdit(false)}
                  />
                </div>
              ) : (
                <div>
                  <h3 className="font-[Inter] font-semibold text-[25px] leading-[38px] flex items-center">
                    {segmentForm.name}
                    <span
                      className="ml-[10px] cursor-pointer"
                      onClick={() => setTitleEdit(true)}
                    >
                      <PencilIcon width={20} height={20} />
                    </span>
                  </h3>
                  <h6>{segmentForm.description}</h6>
                </div>
              )}

              <div className="flex items-center justify-center gap-[10px]">
                {titleEdit && (
                  <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                    <GenericButton
                      id="createTemplate"
                      customClasses="inline-flex items-center border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md focus:ring-cyan-500"
                      onClick={handleSave}
                      loading={isSaving || loading}
                    >
                      Save Segment
                    </GenericButton>
                  </div>
                )}

                <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                  <GenericButton
                    id="createTemplate"
                    customClasses="inline-flex items-center border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md focus:ring-cyan-500"
                    onClick={() => setAddCustomerModalOpen(true)}
                    loading={isSaving || loading}
                  >
                    Add Customer
                  </GenericButton>
                </div>
              </div>
            </div>

            {customers.length > 0 ? (
              <TableTemplate
                data={customers}
                pagesCount={pagesCount}
                setCurrentPage={setCurrentPage}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                sortOptions={sortOptions}
                setSortOptions={setSortOptions}
                isShowDisabled={showDeleted}
                setIsShowDisabled={setShowDeleted}
                refresh={loadData}
                showDeletedToggle={false}
                deleteCustomerFromSegment={deleteCustomerFromSegment}
              />
            ) : (
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
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          ></path>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-[10px] inline-block">
                          Your csv should include one of these fields, email,
                          sms, slackId. For personalization include First Name,
                          and Last Name and other fields
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
            )}
            <Modal
              isOpen={addCustomerModalOpen}
              onClose={() => {
                setAddCustomerModalOpen(false);
                setAddCustomerPickedOption(undefined);
                loadData();
              }}
              panelClass={`${
                addCustomerPickedOption === "existing"
                  ? "!max-w-full"
                  : "!max-w-auto"
              }`}
            >
              {!addCustomerPickedOption ? (
                <div className="flex items-center justify-center gap-[10px]">
                  <GenericButton
                    customClasses="w-[200px] h-[80px] justify-center"
                    onClick={() => setAddCustomerPickedOption("csv")}
                  >
                    Load from CSV
                  </GenericButton>
                  <GenericButton
                    customClasses="w-[200px] h-[80px] justify-center"
                    onClick={() => setAddCustomerPickedOption("existing")}
                  >
                    Add exististing customer
                  </GenericButton>
                </div>
              ) : addCustomerPickedOption === "csv" ? (
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
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
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
              ) : (
                <SegmentCustomerPicker segmentId={id} />
              )}
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentViewer;
