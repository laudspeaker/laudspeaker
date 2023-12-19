import axios from "axios";
import Select from "components/Elements/Selectv2";
import UploadCustomersFileForImport from "pages/PeopleImport/UploadCustomersFileForImport";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import tokenService from "services/token.service";
import { ImportParams } from "./PeopleImport";

export enum ImportOptions {
  NEW = "NEW",
  EXISTING = "EXISTING",
  NEW_AND_EXISTING = "NEW_AND_EXISTING",
}

const possibleOptions = [
  {
    key: ImportOptions.NEW_AND_EXISTING,
    title: "Create and update users",
  },
  {
    key: ImportOptions.NEW,
    title: "Create new users only",
  },
  {
    key: ImportOptions.EXISTING,
    title: "Update existing users only",
  },
];

interface ImportTabOneProps {
  fileData?: ImportParams;
  isLoading: boolean;
  importOption: ImportOptions;
  setImportOption: (val: ImportOptions) => void;
  setIsLoading: (val: boolean) => void;
  onUpdate: () => {};
}

const ImportTabOne = ({
  fileData,
  isLoading,
  importOption,
  setImportOption,
  setIsLoading,
  onUpdate,
}: ImportTabOneProps) => {
  return (
    <div className="w-full flex justify-center">
      <div className="py-10 max-w-[800px]">
        <div className="text-[#111827] font-inter text-sm">
          Description description description description description
          description description description description description
          <Link
            className="text-[#6366F1] ml-1"
            target="_blank"
            download
            to="/example.csv"
          >
            example.csv
          </Link>
        </div>
        <div className="text-[#111827] text-base font-inter font-semibold mt-5 mb-[10px]">
          Import users
        </div>
        <Select
          className="max-w-[400px]"
          value={importOption}
          options={possibleOptions}
          onChange={setImportOption}
        />
        <div className="text-[#111827] text-base font-inter font-semibold mt-5 mb-[10px]">
          File selection
        </div>
        <UploadCustomersFileForImport
          mainUploadText="Click or drag file to this area to upload"
          subUploadText="Your CSV should include one of these fields, email, phone, device token. For personalization include First name, and Last name and other fields"
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          fileData={fileData}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
};

export default ImportTabOne;
