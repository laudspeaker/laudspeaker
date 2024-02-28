import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { capitalize } from "lodash";
import {
  DataSource,
  DataSourceType,
  DataSourceStatus,
  dataSourceStatusBadgeStyles,
  DataSourceMappingType,
  UserAttributeMapping,
} from "pages/DataTransferTable/DataTransferTable";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import AceEditor from "react-ace";
import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-json";
import { v4 as uuid } from "uuid";
import CopyIcon from "assets/icons/CopyIcon";
import { StatementValueType } from "reducers/flow-builder.reducer";
import UserAttributeDataMappingCard from "./UserAttributeDataMappingCard";
import EventPropertyDataMapping from "./EventPropertyDataMapping";

const DataTransfer = () => {
  const { id } = useParams();

  const isCreating = id === "create";

  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>({
    id: "1",
    name: "name1",
    status: DataSourceStatus.ACTIVE,
    type: DataSourceType.CREATE_EVENT,
    eventName: "event1",
    mappings: [
      {
        type: DataSourceMappingType.USER_ATTRIBUTE,
        attributeKey: "email",
        attributeType: StatementValueType.EMAIL,
        importedValue: "agag",
        updateSystemAttribute: true,
      },
      {
        type: DataSourceMappingType.USER_ATTRIBUTE,
        attributeKey: "age",
        attributeType: StatementValueType.NUMBER,
        importedValue: "agag2",
        updateSystemAttribute: true,
      },
      {
        type: DataSourceMappingType.EVENT_PROPERTY,
        propertyName: "a",
        importedProperty: "b",
      },
    ],
    transferAddress: "1111",
    createdAt: new Date().toUTCString(),
  });
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [primaryAttribute, setPrimatyAttribute] = useState<Attribute>();
  const [isError, setIsError] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const { data } = await ApiService.get<any[]>({
        url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Boolean&type=Date&type=DateTime`,
      });

      setAttributes(data);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPrimatyAttribute(attributes.find((attribute) => attribute.isPrimary));
  }, [attributes]);

  useEffect(() => {
    if (
      !dataSource.name ||
      (dataSource.type === DataSourceType.CREATE_EVENT &&
        !dataSource.eventName) ||
      !primaryAttribute
    ) {
      setIsError(true);
      return;
    }

    setIsError(false);
  }, [dataSource]);

  const handleAddField = () => {
    setDataSource({
      ...dataSource,
      mappings: [
        ...dataSource.mappings,
        {
          type: DataSourceMappingType.USER_ATTRIBUTE,
          attributeKey: "",
          attributeType: "String",
          importedValue: "",
          updateSystemAttribute: true,
        },
      ] as UserAttributeMapping[],
    });
  };

  const handleCreate = async () => {};

  const handleUpdate = async () => {};

  const handleSave = async () => {
    const save = isCreating ? handleCreate : handleUpdate;

    await save();
  };

  const handleCancel = async () => {
    await loadData();
  };

  const handlePause = () => {};

  const handleResume = () => {};

  const handleDelete = () => {};

  return (
    <div className="flex flex-col text-[#111827] text-[14px] font-inter font-normal leading-[22px] h-full">
      <div className="bg-white h-[100px] border-y border-[#E5E7EB] rounded flex items-center justify-between px-5">
        <div className="flex gap-2.5 items-center">
          <div className="text-[20px] font-semibold leading-[28px]">
            {isCreating ? "Add data transformation" : dataSource.name}
          </div>
          {!isCreating && (
            <div
              className={`rounded-[14px] w-fit px-2.5 py-[2px] ${
                dataSourceStatusBadgeStyles[dataSource.status]
              }`}
            >
              {capitalize(dataSource.status)}
            </div>
          )}
        </div>
        {!isCreating && (
          <div className="flex gap-2.5 items-center">
            <Button
              type={ButtonType.SECONDARY}
              onClick={
                dataSource.status === DataSourceStatus.ACTIVE
                  ? handlePause
                  : handleResume
              }
            >
              {dataSource.status === DataSourceStatus.ACTIVE
                ? "Pause"
                : "Resume"}
            </Button>
            <Button type={ButtonType.DANGEROUS} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>
      <div className="flex h-full">
        <div className="flex flex-col h-full w-full bg-white">
          <div className="border-b border-[#E5E7EB] p-5 flex flex-col gap-2.5">
            <div>
              Description Description Description Description Description
              Description Description Description Description Documentation
            </div>

            {isCreating ? (
              <>
                <div className="text-[16px] font-semibold leading-[24px]">
                  Type
                </div>
                <div className="flex items-center justify-between gap-5 w-full">
                  <div
                    className={`flex flex-col gap-[5px] w-full rounded px-5 py-2.5 select-none cursor-pointer ${
                      dataSource.type === DataSourceType.CREATE_EVENT
                        ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                        : "border border-[#E5E7EB]"
                    }`}
                    onClick={() => {
                      if (dataSource.type === DataSourceType.CREATE_EVENT)
                        return;

                      setDataSource({
                        ...dataSource,
                        type: DataSourceType.CREATE_EVENT,
                        eventName: "",
                        mappings: [...dataSource.mappings],
                      });
                    }}
                  >
                    <div className="font-semibold">Create event</div>
                    <div className="text-[#4B5563]">
                      Description description description
                    </div>
                  </div>

                  <div
                    className={`flex flex-col gap-[5px] w-full rounded px-5 py-2.5 select-none cursor-pointer ${
                      dataSource.type === DataSourceType.UPDATE_ATTRIBUTES
                        ? "border-[2px] border-[#6366F1] bg-[#EEF2FF]"
                        : "border border-[#E5E7EB]"
                    }`}
                    onClick={() => {
                      if (dataSource.type === DataSourceType.UPDATE_ATTRIBUTES)
                        return;

                      setDataSource({
                        ...dataSource,
                        type: DataSourceType.UPDATE_ATTRIBUTES,
                        mappings: [
                          ...(dataSource.mappings.filter(
                            (mapping) =>
                              mapping.type ===
                              DataSourceMappingType.USER_ATTRIBUTE
                          ) as UserAttributeMapping[]),
                        ],
                      });
                    }}
                  >
                    <div className="font-semibold">
                      Update user attributes only
                    </div>
                    <div className="text-[#4B5563]">
                      Description description description
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-[100px]">Type</div>
                <div>
                  {dataSource.type === DataSourceType.CREATE_EVENT ? (
                    <>Create an event</>
                  ) : (
                    <>Update user attributes only</>
                  )}
                </div>
              </div>
            )}

            {dataSource.type === DataSourceType.CREATE_EVENT && (
              <div className="flex gap-2.5 items-center">
                <div className="w-[100px] min-w-[100px]">Event name</div>

                <Input
                  className="!w-full"
                  wrapperClassName="!w-full"
                  value={dataSource.eventName}
                  onChange={(value) =>
                    setDataSource({ ...dataSource, eventName: value })
                  }
                  placeholder="Name this record based on its data source, e.g., Stripe Payments"
                />
              </div>
            )}
          </div>
          <div className="border-b border-[#E5E7EB] bg-white p-5 flex flex-col gap-2.5">
            <div className="text-[16px] font-semibold leading-[24px]">
              Basic info
            </div>

            <div className="flex gap-2.5 items-center">
              <div className="flex flex-col gap-2.5 w-fit">
                <div className="w-[100px] h-[32px] flex items-center">Name</div>
                <div className="w-[100px] h-[32px] flex items-center whitespace-nowrap">
                  Token
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value={dataSource.name}
                  onChange={(value) => {
                    setDataSource({ ...dataSource, name: value });
                  }}
                  placeholder="Name this record based on its data source, e.g., Stripe Payments"
                />
                <div className="w-full relative">
                  <Input
                    wrapperClassName="!w-full"
                    className="!w-full bg-[#F3F4F6]"
                    value={dataSource.transferAddress}
                    onChange={() => {}}
                    disabled
                  />
                  <div
                    className="absolute top-1/2 right-[12px] -translate-y-1/2 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(dataSource.transferAddress);
                    }}
                  >
                    <CopyIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white border-b border-[#E5E7EB] flex flex-col gap-2.5">
            <div className="text-[16px] font-semibold leading-[24px]">
              Map to system fields
            </div>

            {dataSource.mappings.map((mapping, i) => (
              <React.Fragment key={i}>
                {mapping.type === DataSourceMappingType.USER_ATTRIBUTE ? (
                  <UserAttributeDataMappingCard
                    key={i}
                    mapping={mapping}
                    existingAttributes={(
                      dataSource.mappings.filter(
                        (mapping2) =>
                          mapping2.type === DataSourceMappingType.USER_ATTRIBUTE
                      ) as UserAttributeMapping[]
                    ).map((mapping2) => ({
                      key: mapping2.attributeKey,
                      type: mapping2.attributeType,
                    }))}
                    attributes={attributes}
                    dataSourceType={dataSource.type}
                    onChange={(changedMapping) => {
                      dataSource.mappings[i] = changedMapping;
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                    onChangeType={(type) => {
                      if (type === mapping.type) return;

                      dataSource.mappings[i] = {
                        type: DataSourceMappingType.EVENT_PROPERTY,
                        propertyName: "",
                        importedProperty: "",
                      };
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                    onDelete={() => {
                      dataSource.mappings.splice(i, 1);
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                  />
                ) : (
                  <EventPropertyDataMapping
                    mapping={mapping}
                    dataSourceType={dataSource.type}
                    onChange={(changedMapping) => {
                      dataSource.mappings[i] = changedMapping;
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                    onChangeType={(type) => {
                      if (type === mapping.type) return;

                      dataSource.mappings[i] = {
                        type: DataSourceMappingType.USER_ATTRIBUTE,
                        attributeKey: "",
                        attributeType: StatementValueType.STRING,
                        importedValue: "",
                        updateSystemAttribute: true,
                      };
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                    onDelete={() => {
                      dataSource.mappings.splice(i, 1);
                      setDataSource({
                        ...dataSource,
                      });
                    }}
                  />
                )}
              </React.Fragment>
            ))}

            <Button
              className="w-fit"
              type={ButtonType.SECONDARY}
              onClick={handleAddField}
            >
              Add field
            </Button>
          </div>
          <div className="bg-white p-5 flex gap-2.5 items-center">
            <Button
              onClick={handleSave}
              type={ButtonType.PRIMARY}
              disabled={!primaryAttribute || isLoading || isError}
            >
              Save
            </Button>
            {!isCreating && (
              <Button
                onClick={handleCancel}
                type={ButtonType.SECONDARY}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="p-5 h-full max-w-[580px] w-full">
          <div className="w-full h-full flex flex-col gap-5 justify-center">
            <div className="w-full h-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col">
              <div className="px-5 py-2.5 font-semibold">
                Paste example for reference
              </div>

              <div className="w-full h-full">
                <AceEditor
                  aria-label="editor"
                  mode="json"
                  theme="monokai"
                  name="editor"
                  fontSize={12}
                  // minLines={100}
                  // maxLines={40}
                  width="100%"
                  height="100%"
                  showPrintMargin={false}
                  showGutter
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                  }}
                  //value={selectedPosthogEvent?.payload}
                  value={JSON.stringify({ ev: "aaa", a: "C", s: 1 }, null, 2)}
                  onChange={() => {}}
                />
              </div>
            </div>

            <div className="w-full h-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col">
              <div className="px-5 py-2.5 font-semibold">Out event</div>

              <div className="w-full h-full">
                <AceEditor
                  aria-label="editor"
                  mode="json"
                  theme="monokai"
                  name="editor"
                  fontSize={12}
                  // minLines={100}
                  // maxLines={40}
                  width="100%"
                  height="100%"
                  showPrintMargin={false}
                  showGutter
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                  }}
                  //value={selectedPosthogEvent?.payload}
                  value={JSON.stringify({ ev: "aaa", a: "C", s: 1 }, null, 2)}
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransfer;
