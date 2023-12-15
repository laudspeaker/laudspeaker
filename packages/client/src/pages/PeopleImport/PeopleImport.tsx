import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { keyBy } from "lodash";
import FlowBuilderModal from "pages/FlowBuilderv2/Elements/FlowBuilderModal";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AttributeQueryStatement,
  StatementValueType,
} from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import ImportCompletion from "./ImportCompletion";
import ImportTabOne, { ImportOptions } from "./ImportTabOne";
import MappingTab from "./MappingTab";
import MapValidationErrors from "./Modals/MapValidationErrors";

const tabs = [
  { title: "Upload CSV File" },
  { title: "Map data attributes" },
  { title: "Import Completion" },
];

export type AttributeType = Exclude<
  StatementValueType,
  StatementValueType.ARRAY & StatementValueType.OBJECT
>;

export interface ImportAttribute {
  key: string;
  type: AttributeType;
  skip?: boolean;
}

export interface ImportParams {
  headers: Record<string, { header: string; preview: any[] }>;
  file?: {
    fileName: string;
    fileKey: string;
  };
  emptyCount: number;
  primaryAttribute: null | { key: string; type: AttributeType };
}

export type MappingParams = Record<
  string,
  {
    asAttribute?: ImportAttribute;
    isPrimary: boolean;
    doNotOverwrite: boolean;
  }
>;

enum ValidationErrors {
  UNMAPPED_ATTRIBUTES,
  MISSING_ATTRIBUTES_VALUES,
  PRIMARY_REQUIRED,
  PRIMARY_MAP_REQUIRED,
}

export interface PreviewImportResults {
  updated: number;
  created: number;
  skipped: number;
  url: string;
}

const PeopleImport = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fileData, setFileData] = useState<ImportParams>();
  const [mappingSettings, setMappingSettings] = useState<MappingParams>({});
  const [importPreview, setImportPreview] = useState<PreviewImportResults>();
  const [importOption, setImportOption] = useState<ImportOptions>(
    ImportOptions.NEW
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>(
    []
  );
  const [isValidationInProcess, setIsValidationInProcess] = useState(false);
  const [isImportStarting, setIsImportStarting] = useState(false);
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
          emptyCount: data.emptyCount,
          primaryAttribute: data.primaryAttribute,
        });

        setMappingSettings(
          keyBy(
            Object.keys(data.headers).map((el) => ({
              head: el,
              asAttribute: undefined,
              isPrimary: false,
              doNotOverwrite: false,
            })),
            "head"
          )
        );
      }
    } catch (error) {}
    setIsLoading(false);
  };

  const validationContent = {
    [ValidationErrors.UNMAPPED_ATTRIBUTES]: {
      title: "You have unmapped attributes",
      desc: "Unmapped attributes will not be imported. Do you want to proceed without mapping these attributes?",
      cancel: "Go Back and Map",
      confirm: "Proceed",
    },
    [ValidationErrors.MISSING_ATTRIBUTES_VALUES]: {
      title: "Missing attribute values",
      desc: "Some users have missing values for mapped attributes and won't be imported. Do you want to skip these users?",
      cancel: "Cancel",
      confirm: "Skip Users",
    },
    [ValidationErrors.PRIMARY_REQUIRED]: {
      title: "Primary key missing",
      desc: "You don't have primary key specified, without it you can't proceed, please specify primary key.",
      cancel: "",
      confirm: "Got it",
    },
    [ValidationErrors.PRIMARY_MAP_REQUIRED]: {
      title: "Primary key attribute not mapped",
      desc: `You don't have filed that mapping to your primary key (${fileData?.primaryAttribute?.key}), it's required to map your data properly.`,
      cancel: "",
      confirm: "Got it",
    },
  };

  const handleMappingSettingsUpdate = (val: MappingParams) => {
    setMappingSettings((prev) => ({ ...prev, ...val }));
  };

  const tabToComponent: Record<number, React.ReactNode> = {
    0: (
      <ImportTabOne
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        fileData={fileData}
        importOption={importOption}
        setImportOption={setImportOption}
        onUpdate={() => loadData()}
      />
    ),
    1: (
      <MappingTab
        setIsLoading={setIsLoading}
        mappingSettings={mappingSettings}
        isLoading={isLoading}
        updateSettings={handleMappingSettingsUpdate}
        fileData={fileData}
      />
    ),
    2: <ImportCompletion preview={importPreview} />,
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

  const handle2TabValidation = async () => {
    const pk = Object.values(mappingSettings).find(
      (el) =>
        el.isPrimary &&
        el.asAttribute?.key &&
        el.asAttribute?.type &&
        !el.asAttribute.skip
    );
    const errors: ValidationErrors[] = [];

    if (!pk && !fileData?.primaryAttribute) {
      errors.push(ValidationErrors.PRIMARY_REQUIRED);
    }
    if (!pk && fileData?.primaryAttribute) {
      errors.push(ValidationErrors.PRIMARY_MAP_REQUIRED);
    }
    if (
      Object.values(mappingSettings).some(
        (el) => !el.asAttribute?.key || !el.asAttribute?.type
      )
    ) {
      errors.push(ValidationErrors.UNMAPPED_ATTRIBUTES);
    }
    if (fileData?.emptyCount) {
      errors.push(ValidationErrors.MISSING_ATTRIBUTES_VALUES);
    }

    setValidationErrors(errors);
  };

  const handleValidationCancel = () => {
    setValidationErrors([]);
  };

  const handleValidationProcess = async () => {
    setIsValidationInProcess(true);
    try {
      const { data } = await ApiService.post({
        url: `customers/attributes/count-import-preview`,
        options: {
          mapping: mappingSettings,
          importOption: importOption,
          fileKey: fileData?.file?.fileKey,
        },
      });
      setImportPreview({ ...data });
      setTabIndex(tabIndex + 1);
    } catch (error) {
      if (error instanceof AxiosError) {
        // @ts-ignore
        toast.error(error.response?.data?.message);
      }
    }
    setIsValidationInProcess(false);
  };

  const handleStartImport = async () => {
    setIsImportStarting(true);
    try {
      await ApiService.post({
        url: `customers/attributes/start-import`,
        options: {
          mapping: mappingSettings,
          importOption: importOption,
          fileKey: fileData?.file?.fileKey,
        },
      });
      toast.success("Imported started");
      navigate("/people");
    } catch (error) {
      if (error instanceof AxiosError) {
        // @ts-ignore
        toast.error(error.response?.data?.message);
      }
    }
    setIsImportStarting(false);
  };

  const handleValidationConfirm = async () => {
    const currentError = validationErrors[0];

    if (
      currentError === ValidationErrors.PRIMARY_REQUIRED ||
      currentError === ValidationErrors.PRIMARY_MAP_REQUIRED
    ) {
      setValidationErrors([]);
      return;
    }

    const errors = [...validationErrors];

    if (currentError === ValidationErrors.UNMAPPED_ATTRIBUTES) {
      errors.shift();
      setValidationErrors([...errors]);
    }

    if (currentError === ValidationErrors.MISSING_ATTRIBUTES_VALUES) {
      errors.shift();
      setValidationErrors([...errors]);
    }

    if (!errors.length) {
      handleValidationProcess();
    }
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
          <div
            className={`${
              tabIndex !== 1 ? "max-w-[800px]" : "max-w-full px-5"
            } flex mx-auto w-full justify-end gap-[10px]`}
          >
            <Button
              type={ButtonType.SECONDARY}
              className="text-[#6366F1] border-[#6366F1] disabled:grayscale"
              disabled={isLoading}
              onClick={() => {
                if (tabIndex === 0) handleDelete();
                else setTabIndex(tabIndex - 1);
              }}
            >
              {tabIndex === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              type={ButtonType.PRIMARY}
              className="disabled:grayscale"
              disabled={isLoading || (tabIndex === 0 && !fileData?.file)}
              onClick={() => {
                if (tabIndex === 0) setTabIndex(tabIndex + 1);
                else if (tabIndex === 1) handle2TabValidation();
                else if (tabIndex === 2) handleStartImport();
              }}
            >
              {tabIndex === 2 ? "Import" : "Next"}
            </Button>
          </div>
          {validationErrors.length > 0 && (
            <MapValidationErrors
              isOpen={!!validationErrors.length}
              title={validationContent[validationErrors[0]].title}
              desc={validationContent[validationErrors[0]].desc}
              cancelText={validationContent[validationErrors[0]].cancel}
              confirmText={validationContent[validationErrors[0]].confirm}
              onClose={handleValidationCancel}
              onConfirm={handleValidationConfirm}
            />
          )}
          <FlowBuilderModal isOpen={isValidationInProcess}>
            <div className="w-full flex flex-col items-center justify-center">
              <div className="relative bg-transparent border-t-transparent  border-[#6366F1] border-4 rounded-full w-10 h-10 animate-spin" />
              <div className="my-2 text-base text-center font-roboto text-[#4B5563] animate-pulse">
                Preforming calculation...
              </div>
            </div>
          </FlowBuilderModal>
          <FlowBuilderModal isOpen={isImportStarting}>
            <div className="w-full flex flex-col items-center justify-center">
              <div className="relative bg-transparent border-t-transparent  border-[#6366F1] border-4 rounded-full w-10 h-10 animate-spin" />
              <div className="my-2 text-center text-base font-roboto text-[#4B5563] animate-pulse">
                Starting import
              </div>
            </div>
          </FlowBuilderModal>
        </div>
      </div>
    </div>
  );
};

export default PeopleImport;
