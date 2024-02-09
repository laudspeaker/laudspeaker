import { Menu, Transition } from "@headlessui/react";
import DotsIcon from "assets/icons/DotsIcon";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { capitalize } from "lodash";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatementValueType } from "reducers/flow-builder.reducer";

export enum DataSourceStatus {
  ACTIVE = "active",
  PAUSED = "paused",
}

export const dataSourceStatusBadgeStyles: Record<DataSourceStatus, string> = {
  [DataSourceStatus.ACTIVE]: "bg-[#DCFCE7] text-[#14532D]",
  [DataSourceStatus.PAUSED]: "bg-[#FEF9C3] text-[#713F12]",
};

export enum DataSourceType {
  CREATE_EVENT = "create-event",
  UPDATE_ATTRIBUTES = "update-attributes",
}

export interface CommonDataSource {
  id: string;
  name: string;
  status: DataSourceStatus;
  transferAddress: string;
  createdAt: string;
}

export enum DataSourceMappingType {
  USER_ATTRIBUTE = "user-attribute",
  EVENT_PROPERTY = "event-property",
}

export interface UserAttributeMapping {
  type: DataSourceMappingType.USER_ATTRIBUTE;
  attributeKey: string;
  attributeType: StatementValueType;
  importedValue: string;
  updateSystemAttribute: boolean;
}

export interface EventPropertyMapping {
  type: DataSourceMappingType.EVENT_PROPERTY;
  propertyName: string;
  importedProperty: string;
}

export type DataSourceMapping = UserAttributeMapping | EventPropertyMapping;

export interface CreateEventDataSource extends CommonDataSource {
  type: DataSourceType.CREATE_EVENT;
  eventName: string;
  mappings: DataSourceMapping[];
}

export interface UpdateAttributesDataSource extends CommonDataSource {
  type: DataSourceType.UPDATE_ATTRIBUTES;
  mappings: UserAttributeMapping[];
}

export type DataSource = CreateEventDataSource | UpdateAttributesDataSource;

const DataTransferTable = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<DataSource[]>([
    {
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
          type: DataSourceMappingType.EVENT_PROPERTY,
          propertyName: "a",
          importedProperty: "b",
        },
      ],
      transferAddress: "1111",
      createdAt: new Date().toUTCString(),
    },
  ]);

  return (
    <div className="p-5 flex flex-col gap-5 text-[#111827] text-[14px] font-inter font-normal leading-[22px]">
      <div className="flex items-center justify-between">
        <div className="text-black font-semibold text-[20px] leading-[28px]">
          Data transfer
        </div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => navigate("/data-transfer/create")}
        >
          Add data
        </Button>
      </div>
      <div className="bg-white p-5 rounded-lg">
        <Table
          className="!w-full"
          rowsData={rows}
          headClassName="bg-[#F3F4F6]"
          headings={[
            <div className="px-5 py-2.5 font-semibold">Data name</div>,
            <div className="px-5 py-2.5 font-semibold">Status</div>,
            <div className="px-5 py-2.5 font-semibold">Created</div>,
            <div className="px-5 py-2.5 font-semibold"></div>,
          ]}
          rows={rows.map((row) => [
            <div
              className="text-[#6366F1] cursor-pointer w-fit"
              onClick={() => navigate(`/data-transfer/${row.id}`)}
            >
              {row.name}
            </div>,
            <div
              className={`rounded-[14px] w-fit px-2.5 py-[2px] ${
                dataSourceStatusBadgeStyles[row.status]
              }`}
            >
              {capitalize(row.status)}
            </div>,
            <div>{format(new Date(row.createdAt), "MM/dd/yyyy HH:mm")}</div>,
            <Menu as="div" className="relative">
              <Menu.Button>
                <button className="px-[5px] py-[11px] rounded">
                  <DotsIcon />
                </button>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute z-[120] right-0 origin-top-right w-[200px] h-[72px] py-[4px] rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`block w-full text-left py-[5px] px-[12px] ${
                          active ? "bg-[#F3F4F6]" : ""
                        }`}
                        onClick={() => {}}
                      >
                        Duplicate
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`block w-full text-left py-[5px] px-[12px] text-[#F43F5E] ${
                          active ? "bg-[#F3F4F6]" : ""
                        }`}
                        onClick={() => {}}
                      >
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>,
          ])}
        />
      </div>
    </div>
  );
};

export default DataTransferTable;
