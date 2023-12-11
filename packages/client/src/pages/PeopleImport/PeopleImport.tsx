import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import ImportTabOne from "./ImportTabOne";

const tabs = [
  { title: "Upload CSV File" },
  { title: "Map data attributes" },
  { title: "Import Completion" },
];

export interface ImportParams {
  headers: Record<string, { header: string; preview: any[] }>;
  file?: {
    fileName: string;
    fileKey: string;
  };
}

const PeopleImport = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fileData, setFileData] = useState<ImportParams>();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get({
        url: "/customers/getLastImportCSV",
      });
      if (!data.fileKey) {
        setFileData(undefined);
      } else {
        setFileData({
          headers: data.headers,
          file: {
            fileKey: data.fileKey,
            fileName: data.fileName,
          },
        });
      }
    } catch (error) {}
    setIsLoading(false);
  };

  const tabToComponent: Record<number, React.ReactNode> = {
    0: (
      <ImportTabOne
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        fileData={fileData}
        onUpdate={() => loadData()}
      />
    ),
    1: <></>,
    2: <></>,
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (isLoading) return;

    if (!fileData?.file) {
      navigate("/people");
      return;
    }

    confirmAlert({
      title: "Confirm cancel?",
      message: "Are you sure? After cancel you will have to upload file again!",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            setIsLoading(true);
            try {
              await ApiService.post({
                url: `/customers/imports/delete/${fileData.file!.fileKey}`,
              });
              navigate("/people");
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

  return (
    <div>
      <div className="w-full bg-white py-8 px-10 font-inter font-semibold text-[#111827] text-xl border-t border-b border-[#E5E7EB]">
        Import users
      </div>
      <div className="w-full px-5 mt-4">
        <div className="flex flex-col w-full h-full bg-white py-5">
          <div className="w-full bg-white rounded">
            <div className="flex justify-center items-center gap-4">
              {tabs.map((el, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`text-base font-roboto flex justify-center transition-all items-center min-w-[24px] max-w-[24px] min-h-[24px] max-h-6 rounded-full border ${
                      i == tabIndex
                        ? "bg-[#6366F1] border-[#6366F1] text-white"
                        : i < tabIndex
                        ? "bg-[#22C55E] border-[#22C55E]"
                        : "bg-transparent border-[#9CA3AF] text-[#9CA3AF]"
                    }`}
                  >
                    {i < tabIndex ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="13"
                        viewBox="0 0 12 13"
                        fill="none"
                      >
                        <path
                          d="M11.3578 2.52051H10.4216C10.2904 2.52051 10.1658 2.58078 10.0855 2.6839L4.56358 9.67899L1.91581 6.32408C1.87576 6.27323 1.82471 6.23211 1.76648 6.20381C1.70826 6.17551 1.64439 6.16077 1.57965 6.16069H0.643492C0.55376 6.16069 0.504207 6.26381 0.559117 6.33345L4.22742 10.9808C4.39885 11.1977 4.72831 11.1977 4.90108 10.9808L11.4422 2.69194C11.4971 2.62363 11.4475 2.52051 11.3578 2.52051Z"
                          fill="white"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div
                    className={`${
                      i == tabIndex
                        ? "text-base text-[#111827] font-semibold"
                        : i < tabIndex
                        ? "text-sm text-[#111827]"
                        : "text-sm text-[#9CA3AF]"
                    } mx-2 whitespace-nowrap font-inter transition-all`}
                  >
                    {el.title}
                  </div>
                  {tabs.length - 1 !== i && (
                    <div
                      className={`${
                        i < tabIndex ? "border-[#22C55E]" : "border-[#E5E7EB]"
                      } ml-2 border-t w-[124px] transition-all`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <hr className="border-[#E5E7EB] mt-5" />
          {tabToComponent[tabIndex]}
          <hr className="border-[#E5E7EB] mb-5" />
          <div className="flex max-w-[800px] mx-auto w-full justify-end gap-[10px]">
            <Button
              type={ButtonType.SECONDARY}
              className="text-[#6366F1] border-[#6366F1] disabled:grayscale"
              disabled={isLoading}
              onClick={() => {
                if (tabIndex === 0) handleDelete();
              }}
            >
              {tabIndex === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              type={ButtonType.PRIMARY}
              className="disabled:grayscale"
              disabled={isLoading}
              onClick={() => {}}
            >
              {tabIndex === 2 ? "Save" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleImport;
