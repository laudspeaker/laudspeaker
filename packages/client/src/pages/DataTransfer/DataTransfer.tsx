import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { capitalize } from "lodash";
import {
  DataSource,
  DataSourceStatus,
  dataSourceStatusBadgeStyles,
} from "pages/DataTransferTable/DataTransferTable";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import DataMappingCard from "./DataMappingCard";
import AceEditor from "react-ace";
import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-json";
import { v4 as uuid } from "uuid";

const DataTransfer = () => {
  const { id } = useParams();

  const isCreating = id === "create";

  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>({
    id: "1",
    name: "name1",
    status: DataSourceStatus.ACTIVE,
    mapping: {
      "email::Email": "",
      "event::String": "",
    },
    createdAt: new Date().toUTCString(),
  });
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [primaryAttribute, setPrimatyAttribute] = useState<Attribute>();

  const loadData = async () => {
    setIsLoading(true);

    try {
      const { data } = await ApiService.get<any[]>({
        url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Date&type=DateTime&isArray=false`,
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

  const handleAddField = () => {
    setDataSource({
      ...dataSource,
      mapping: { ...dataSource.mapping, [uuid()]: "" },
    });
  };

  return (
    <div className="flex flex-col text-[#111827] text-[14px] font-inter font-normal leading-[22px] h-full">
      <div className="bg-white h-[100px] border-y border-[#E5E7EB] rounded flex items-center justify-between px-5">
        <div className="flex gap-2.5 items-center">
          <div className="text-[20px] font-semibold leading-[28px]">
            {dataSource.name}
          </div>
          <div
            className={`rounded-[14px] w-fit px-2.5 py-[2px] ${
              dataSourceStatusBadgeStyles[dataSource.status]
            }`}
          >
            {capitalize(dataSource.status)}
          </div>
        </div>
        <div className="flex gap-2.5 items-center">
          <Button type={ButtonType.SECONDARY} onClick={() => {}}>
            Pause
          </Button>
          <Button type={ButtonType.DANGEROUS} onClick={() => {}}>
            Delete
          </Button>
        </div>
      </div>
      <div className="flex h-full">
        <div className="flex flex-col h-full bg-white">
          <div className="border-b border-[#E5E7EB] bg-white p-5 flex flex-col gap-2.5">
            <div>
              Description Description Description Description Description
              Description Description Description Description Documentation
            </div>

            <div className="flex gap-2.5 items-center">
              <div className="flex flex-col gap-2.5 w-fit">
                <div className="h-[32px] flex items-center">Name</div>
                <div className="h-[32px] flex items-center whitespace-nowrap">
                  Transfer address
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value=""
                  onChange={() => {}}
                  placeholder="Name this record based on its data source, e.g., Stripe Payments"
                />
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full bg-[#F3F4F6]"
                  value="111111"
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>
          </div>
          <div className="p-5 bg-white border-b border-[#E5E7EB] flex flex-col gap-2.5">
            <div className="text-[16px] font-semibold leading-[24px]">
              Map to system fields
            </div>

            {Object.keys(dataSource.mapping).map((mappingKey, i) => (
              <DataMappingCard
                key={i}
                mapping={dataSource.mapping}
                mappingKey={mappingKey}
                attributes={attributes}
                onChange={({ field, attribute }) => {
                  const newDataSource = {
                    ...dataSource,
                    mapping: { ...dataSource.mapping },
                  };

                  if (attribute !== mappingKey) {
                    delete newDataSource.mapping[mappingKey];
                    newDataSource.mapping[attribute] = field;
                  } else {
                    newDataSource.mapping[mappingKey] = field;
                  }

                  setDataSource(newDataSource);
                }}
                handleDelete={() => {
                  const newDataSource = {
                    ...dataSource,
                    mapping: { ...dataSource.mapping },
                  };

                  delete newDataSource.mapping[mappingKey];
                  setDataSource(newDataSource);
                }}
              />
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
            <Button onClick={() => {}} type={ButtonType.PRIMARY} disabled>
              Save
            </Button>
            <Button onClick={() => {}} type={ButtonType.SECONDARY} disabled>
              Cancel
            </Button>
          </div>
        </div>
        <div className="p-5 h-full">
          <div className="w-[540px] h-full flex justify-center">
            <div className="w-full h-fit bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col">
              <div className="px-5 py-2.5 font-semibold">
                Paste example for reference
              </div>

              <div className="w-full h-full">
                <AceEditor
                  aria-label="editor"
                  mode="json"
                  theme="github"
                  name="editor"
                  fontSize={12}
                  // minLines={15}
                  maxLines={40}
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
