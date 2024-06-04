import { RadioGroup } from "@headlessui/react";
import CheckBox from "components/Checkbox/Checkbox";
import Select from "components/Elements/Selectv2";
import RadioOption from "components/Radio/RadioOption";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import AddAttributeModal from "./Modals/AddAttributeModal";
import {
  AttributeType,
  ImportAttribute,
  ImportParams,
  MappingParams,
} from "./PeopleImport";

interface MappingTabProps {
  fileData?: ImportParams;
  isLoading: boolean;
  mappingSettings: MappingParams;
  updateSettings: (val: MappingParams) => void;
  setIsLoading: (val: boolean) => void;
}

const MappingTab = ({
  fileData,
  mappingSettings,
  updateSettings,
  isLoading,
  setIsLoading,
}: MappingTabProps) => {
  const [search, setSearch] = useState<
    Record<string, { search: string; isLoading: boolean }>
  >({});
  const [activeHead, setActiveHead] = useState<string>();
  const [possibleKeys, setPossibleKeys] = useState<
    { key: string; type: AttributeType; dateFormat?: string }[]
  >([]);

  const handleSearchUpdate = (head: string) => (value: string) => {
    const newSearch = { ...search };

    if (!newSearch[head]) {
      newSearch[head] = {
        search: "",
        isLoading: false,
      };
    }

    newSearch[head] = {
      ...newSearch[head],
      search: value,
    };

    setSearch(newSearch);
  };

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Boolean&type=Email&type=Date&type=DateTime`,
    });

    if (
      fileData?.primaryAttribute &&
      !Object.values(mappingSettings).find((el) => el.isPrimary)
    ) {
      const pk = data.find((el) => el.isPrimary);
      if (
        fileData?.primaryAttribute.key === pk.key &&
        fileData?.primaryAttribute.type === pk.type
      ) {
        const suggestedFieldForPK = Object.keys(fileData.headers).find(
          (el: string) => el.toLowerCase().includes(pk.key.toLowerCase())
        );
        if (suggestedFieldForPK) {
          updateSettings({
            [suggestedFieldForPK]: {
              ...mappingSettings[suggestedFieldForPK],
              asAttribute: {
                key: pk.key,
                type: pk.type,
                dateFormat: pk.dateFormat,
                skip: false,
              },
              isPrimary: true,
            },
          });
        }
      }
    }

    setPossibleKeys(data);
  };

  const handleSelectChange = (head: string) => (selectKey: string) => {
    if (selectKey === "_NEW_RECORD_;-;_NEW_RECORD_") {
      setActiveHead(head);
      return;
    }

    const [key, type, dateFormat] = selectKey.split(";-;");

    if (!key || !type) return;

    if (
      Object.values(mappingSettings).some(
        (el) => el.asAttribute?.key === key && el.asAttribute?.type === type
      ) &&
      type !== "_SKIP_RECORD_"
    ) {
      toast.error("This attribute already in use");
      return;
    }

    updateSettings({
      [head]: {
        ...mappingSettings[head],
        asAttribute: {
          key: key,
          type: type as AttributeType,
          dateFormat,
          skip: selectKey === "_SKIP_RECORD_;-;_SKIP_RECORD_",
        },
        isPrimary:
          selectKey === "_SKIP_RECORD_;-;_SKIP_RECORD_" ||
          (fileData?.primaryAttribute &&
            fileData?.primaryAttribute.key !== key &&
            fileData?.primaryAttribute.type !== type)
            ? false
            : fileData?.primaryAttribute &&
              fileData?.primaryAttribute.key === key &&
              fileData?.primaryAttribute.type === type
            ? true
            : mappingSettings[head].isPrimary,
      },
    });
  };

  const handlePrimaryKeyChange = (selectKey: string) => {
    const [key, type] = selectKey.split(";-;");
    if (
      fileData?.primaryAttribute ||
      !key ||
      !type ||
      key === "_SKIP_RECORD_" ||
      type === "_SKIP_RECORD_"
    )
      return;

    const newSettings = { ...mappingSettings };

    Object.keys(mappingSettings).forEach((el) => {
      if (
        newSettings[el].asAttribute?.key === key &&
        newSettings[el].asAttribute?.type === type
      ) {
        newSettings[el].isPrimary = true;
        newSettings[el].doNotOverwrite = true;
      } else {
        newSettings[el].isPrimary = false;
      }
    });

    updateSettings({
      ...newSettings,
    });
  };

  const handleOverwriteUpdate = (head: string) => (checked: boolean) => {
    if (mappingSettings[head].isPrimary) return;

    const newSettings = { ...mappingSettings };
    newSettings[head].doNotOverwrite = checked;
    updateSettings(newSettings);
  };

  const isProperAttribute = (head: string) =>
    !!mappingSettings[head]?.asAttribute &&
    mappingSettings[head].asAttribute?.key !== "_SKIP_RECORD_";

  const primaryKey = Object.values(mappingSettings).find((el) => el.isPrimary);

  useEffect(() => {
    loadPossibleKeys();
  }, []);

  return (
    <div className="py-10 px-5">
      <div className="text-[#111827] font-inter text-sm">
        Map your CSV columns to corresponding attributes in our system.
        Carefully review the auto-suggested matches and make adjustments if
        needed. For any unmatched attributes, manually select the appropriate
        attribute from the dropdown menu or opt to create a new attribute.
      </div>
      <div className="mt-5 flow-root max-h-[calc(100vh-480px)] overflow-y-auto">
        <RadioGroup
          value={
            primaryKey?.asAttribute?.key
              ? `${primaryKey.asAttribute.key};-;${primaryKey.asAttribute.type}`
              : ""
          }
          onChange={handlePrimaryKeyChange}
        >
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-[10.5px] sticky top-0 z-10 border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75 text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
                  >
                    Attributes in the file
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-[10.5px] sticky top-0 z-10 hidden border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:table-cell"
                  >
                    Values
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-[10.5px] sticky top-0 z-10 hidden border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter sm:table-cell"
                  >
                    Import as attributes
                  </th>
                  {!fileData?.primaryAttribute && (
                    <th
                      scope="col"
                      className="px-5 py-[10.5px] sticky top-0 z-10 hidden border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter lg:table-cell"
                    >
                      Primary key
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-5 py-[10.5px] sticky top-0 z-10 border-b border-gray-300 bg-[#F3F4F6] bg-opacity-75  text-left text-sm font-semibold font-inter text-[#111827] backdrop-blur backdrop-filter"
                  >
                    Manage existing values
                  </th>
                </tr>
              </thead>
              {fileData && (
                <tbody>
                  {Object.keys(mappingSettings).map((head, headIndex, arr) => (
                    <tr key={headIndex}>
                      <td
                        className={`
                            ${
                              headIndex !== arr.length - 1
                                ? "border-b border-gray-200"
                                : ""
                            } 
                          whitespace-nowrap overflow-hidden text-ellipsis px-5 py-[6.5px] text-sm font-inter text-[#111827] sm:pl-6 lg:pl-8`}
                      >
                        {head}
                      </td>
                      <td
                        className={`${
                          headIndex !== arr.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        } whitespace-nowrap max-w-[285px] px-5 py-[6.5px] hidden text-sm text-gray-500 sm:table-cell`}
                      >
                        <div className="flex flex-col">
                          {fileData.headers[head].preview
                            .slice(0, 3)
                            .map((prev, prevI) => (
                              <div
                                key={prevI}
                                className="text-[#111827] text-sm font-inter whitespace-nowrap max-w-full overflow-hidden text-ellipsis"
                              >
                                {prevI === 2 ? "..." : prev}
                              </div>
                            ))}
                        </div>
                      </td>
                      <td
                        className={`
                          ${
                            headIndex !== arr.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          } whitespace-nowrap px-5 py-[6.5px] hidden  text-sm text-gray-500 lg:table-cell`}
                      >
                        <Select
                          value={
                            mappingSettings[head]?.asAttribute
                              ? `${mappingSettings[head].asAttribute!.key};-;${
                                  mappingSettings[head].asAttribute!.type
                                };-;${
                                  mappingSettings[head].asAttribute?.dateFormat
                                }`
                              : ""
                          }
                          searchValue={search[head]?.search || ""}
                          onSearchValueChange={handleSearchUpdate(head)}
                          panelClassName="!max-w-[240px]"
                          options={[
                            {
                              key: "_NEW_RECORD_;-;_NEW_RECORD_",
                              title: (
                                <div
                                  className="flex items-center"
                                  id="addNewField"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    className="mr-[5px]"
                                  >
                                    <g clipPath="url(#clip0_37_5980)">
                                      <path
                                        d="M6 4.16667V7.83333M7.83333 6H4.16667M11.5 6C11.5 6.72227 11.3577 7.43747 11.0813 8.10476C10.8049 8.77205 10.3998 9.37836 9.88909 9.88909C9.37836 10.3998 8.77205 10.8049 8.10476 11.0813C7.43747 11.3577 6.72227 11.5 6 11.5C5.27773 11.5 4.56253 11.3577 3.89524 11.0813C3.22795 10.8049 2.62163 10.3998 2.11091 9.88909C1.60019 9.37836 1.19506 8.77205 0.918663 8.10476C0.642262 7.43747 0.5 6.72227 0.5 6C0.5 4.54131 1.07946 3.14236 2.11091 2.11091C3.14236 1.07946 4.54131 0.5 6 0.5C7.45869 0.5 8.85764 1.07946 9.88909 2.11091C10.9205 3.14236 11.5 4.54131 11.5 6Z"
                                        stroke="#111827"
                                        strokeWidth="0.916667"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </g>
                                    <defs>
                                      <clipPath id="clip0_37_5980">
                                        <rect
                                          width="12"
                                          height="12"
                                          fill="white"
                                        />
                                      </clipPath>
                                    </defs>
                                  </svg>
                                  Add new field
                                </div>
                              ),
                            },
                            {
                              key: "_SKIP_RECORD_;-;_SKIP_RECORD_",
                              title: (
                                <div className="relative flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    className="mr-[5px]"
                                    fill="none"
                                  >
                                    <g clipPath="url(#clip0_37_5985)">
                                      <path
                                        d="M9.88909 9.88909C10.9205 8.85764 11.5 7.45869 11.5 6C11.5 4.54131 10.9205 3.14236 9.88909 2.11091C8.85764 1.07946 7.45869 0.5 6 0.5C4.54131 0.5 3.14236 1.07946 2.11091 2.11091M9.88909 9.88909C8.85764 10.9205 7.45869 11.5 6 11.5C4.54131 11.5 3.14236 10.9205 2.11091 9.88909C1.07946 8.85764 0.5 7.45869 0.5 6C0.5 4.54131 1.07946 3.14236 2.11091 2.11091M9.88909 9.88909L2.11091 2.11091"
                                        stroke="#111827"
                                        strokeWidth="0.916661"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </g>
                                    <defs>
                                      <clipPath id="clip0_37_5985">
                                        <rect
                                          width="12"
                                          height="12"
                                          fill="white"
                                        />
                                      </clipPath>
                                    </defs>
                                  </svg>
                                  Do not import the attribute
                                  <div className="absolute -bottom-1 -left-5 w-[calc(100%+40px)] h-[1px] bg-[#E5E7EB]" />
                                </div>
                              ),
                            },
                            ...possibleKeys
                              .filter((el) =>
                                el.key.includes(search[head]?.search || "")
                              )
                              .map((el) => ({
                                key: `${el.key};-;${el.type};-;${el.dateFormat}`,
                                title: el.key,
                              })),
                          ]}
                          placeholder={"Select an attribute"}
                          onChange={handleSelectChange(head)}
                          dataTestId={`mapping-select-${head}`}
                          id={`select-${head}`}
                        />
                      </td>
                      {!fileData.primaryAttribute && (
                        <td
                          className={`
                          ${
                            headIndex !== arr.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          } whitespace-nowrap px-5 py-[6.5px] hidden  text-sm text-gray-500 lg:table-cell`}
                        >
                          <RadioOption
                            value={
                              mappingSettings[head]?.asAttribute
                                ? `${
                                    mappingSettings[head]!.asAttribute!.key
                                  };-;${
                                    mappingSettings[head]!.asAttribute!.type
                                  }`
                                : "-1"
                            }
                            radioText="Primary key"
                            className={`mb-[10px] ${
                              !isProperAttribute(head) &&
                              "opacity-70 pointer-events-none"
                            }`}
                            data-testid={`${head}-primary-key-option`}
                          />
                        </td>
                      )}
                      <td
                        className={`
                          ${
                            headIndex !== arr.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          } whitespace-nowrap px-5 py-[6.5px]  text-sm text-gray-500`}
                      >
                        <CheckBox
                          text={"Don’t overwrite"}
                          propControl
                          initValue={mappingSettings[head].doNotOverwrite}
                          className={`${
                            (mappingSettings[head].isPrimary ||
                              !isProperAttribute(head)) &&
                            "opacity-70 pointer-events-none"
                          }`}
                          onCheck={handleOverwriteUpdate(head)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </RadioGroup>
      </div>
      <AddAttributeModal
        isOpen={!!activeHead}
        onClose={() => setActiveHead(undefined)}
        onAdded={(
          keyName: string,
          keyType: AttributeType,
          dateFormat?: string
        ) => {
          loadPossibleKeys();

          if (!activeHead) return;
          updateSettings({
            [activeHead]: {
              ...mappingSettings[activeHead],
              asAttribute: {
                key: keyName,
                type: keyType,
                dateFormat,
                skip: false,
              },
            },
          });
          setActiveHead(undefined);
        }}
      />
    </div>
  );
};

export default MappingTab;
