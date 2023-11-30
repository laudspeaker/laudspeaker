import React, { Fragment } from "react";
import { Link } from "@mui/material";
import Select from "../Elements/Select/Select";
import {
  ChevronDownIcon,
  MinusIcon,
  PencilSquareIcon,
  EllipsisHorizontalCircleIcon,
} from "@heroicons/react/20/solid";
import Chip from "components/Elements/Chip";
import { Menu, Transition } from "@headlessui/react";
import { confirmAlert } from "react-confirm-alert";
import { ApiConfig } from "../../constants";
import ApiService from "services/api.service";
import ToggleSwitch from "components/Elements/ToggleSwitch";
import { GenericButton } from "components/Elements";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";

export interface TableDataItem {
  isInsideSegment?: boolean;
  email?: string;
  phEmail?: string;
  phone?: string;
  id?: string | number | null;
  name?: string;
  isActive?: boolean;
  isPaused?: boolean;
  isStopped?: boolean;
  isDeleted?: boolean;
  createdOn?: number;
  createdBy?: number;
  customersEnrolled?: number;
  type?: string;
  audiences?: object[];
  dataSource?: string;
  salient?: string;
}

function renderCorrectColumnNames(
  data: { dataSource: string }[],
  sortOptions?: SortOptions,
  setSortOptions?: (value: SortOptions) => void
) {
  if (data.length < 1) {
    return (
      <>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Name
        </th>
      </>
    );
  } else if (data[0].hasOwnProperty("isActive")) {
    //this is a test for checking if this is the journeys table or the template table
    return (
      <>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 flex"
        >
          Name
          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300 cursor-pointer">
            {sortOptions?.name ? (
              <ChevronDownIcon
                className={`h-5 w-5 ${
                  sortOptions?.name === "desc" ? "rotate-180" : ""
                }`}
                onClick={() => {
                  if (setSortOptions)
                    setSortOptions({
                      name: sortOptions?.name === "asc" ? "desc" : undefined,
                    });
                }}
                aria-hidden="true"
              />
            ) : (
              <MinusIcon
                className={`h-5 w-5`}
                onClick={() => {
                  if (setSortOptions)
                    setSortOptions({
                      name: "asc",
                    });
                }}
              />
            )}
          </span>
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[100px]"
        >
          Status
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[100px]"
        >
          Action
        </th>
      </>
    );
  } else if (data[0].dataSource === "segmentPeople") {
    return (
      <>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Email
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Phone
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[100px]"
        >
          Action
        </th>
      </>
    );
  } else if (data[0].dataSource == "people") {
    //this is a test for checking if this is the journeys table or the template table
    return (
      <>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Id
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Email
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Actions
        </th>
      </>
    );
  } else {
    return (
      <>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 flex"
        >
          Name
          <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300 cursor-pointer">
            <ChevronDownIcon
              className={`h-5 w-5 ${
                sortOptions?.name === "desc" ? "rotate-180" : ""
              }`}
              onClick={() => {
                if (setSortOptions)
                  setSortOptions({
                    name: sortOptions?.name === "desc" ? "asc" : "desc",
                  });
              }}
              aria-hidden="true"
            />
          </span>
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[100px]"
        >
          Type
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[100px]"
        >
          Actions
        </th>
      </>
    );
  }
}

const statusStyles = {
  [JourneyStatus.ACTIVE]: "",
  [JourneyStatus.PAUSED]: "!bg-yellow-200 !text-yellow-600",
  [JourneyStatus.STOPPED]: "!bg-red-200 !text-red-600",
  [JourneyStatus.DELETED]: "!bg-red-200 !text-red-600",
  [JourneyStatus.DRAFT]: "!bg-gray-200 !text-gray-600",
};

function renderSecondColumn(row: TableDataItem) {
  if (row.dataSource == "people") {
    return (
      <>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {row.type || row.email || row.phEmail}
        </td>
      </>
    );
  } else if (row.dataSource === "segmentPeople") {
    return (
      <>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {row.phone}
        </td>
      </>
    );
  } else if (row.isActive != null) {
    //this is a test for checking if this is the journeys table or the template table
    let status: JourneyStatus = JourneyStatus.DRAFT;

    if (row.isActive) status = JourneyStatus.ACTIVE;
    if (row.isPaused) status = JourneyStatus.PAUSED;
    if (row.isStopped) status = JourneyStatus.STOPPED;
    if (row.isDeleted) status = JourneyStatus.DELETED;

    return (
      <>
        <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          <Chip
            wrapperClass={`${statusStyles[status]} w-full`}
            label={status}
          />
        </td>
        {/* <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.createdOn)}
        </td>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.createdBy)}
        </td> */}
      </>
    );
  } else {
    return (
      <>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.type)}
        </td>
        {/* <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.createdOn)}
        </td>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.createdBy)}
        </td> */}
      </>
    );
  }
}

// const rows = [
//   createData("Frozen yoghurt", false, 6.0, 24, 4.0, "email", "other"),
//   createData("Ice cream sandwich", true, 9.0, 37, 4.3, "slack", "other"),
//   createData("Eclair", true, 16.0, 24, 6.0, "email", "other"),
//   createData("Cupcake", false, 3.7, 67, 4.3, "email", "other"),
//   createData("Gingerbread", true, 16.0, 49, 3.9, "slack", "other"),
// ];

//example journey template data
//
// [
//   {
//       "id": "6a88b9e2-5b98-4c9c-968e-dfde0163375c",
//       "name": "test",
//       "isActive": false,
//       "audiences": [
//           "31b35cc8-4f9d-468e-8940-6fceab74a8aa",
//           "bc929d7d-949b-448b-aa8b-5c34db96b6e5"
//       ],
//       "rules": [],
//       "visualLayout": {
//           "edges": [],
//           "nodes": [
//               {
//                   "id": "257c4a8f-a66b-4c45-b5b0-88fc6bdef982",
//                   "data": {
//                       "primary": true,
//                       "messages": [],
//                       "triggers": [],
//                       "audienceId": "31b35cc8-4f9d-468e-8940-6fceab74a8aa",
//                       "dataTriggers": []
//                   },
//                   "type": "special",
//                   "width": 350,
//                   "height": 57,
//                   "dragging": false,
//                   "position": {
//                       "x": 181,
//                       "y": 124
//                   },
//                   "selected": false,
//                   "positionAbsolute": {
//                       "x": 181,
//                       "y": 124
//                   }
//               },
//               {
//                   "id": "25a078b2-498f-4ade-a7e9-a2cf6f2e7d9f",
//                   "data": {
//                       "primary": false,
//                       "messages": [],
//                       "triggers": [],
//                       "audienceId": "bc929d7d-949b-448b-aa8b-5c34db96b6e5",
//                       "dataTriggers": []
//                   },
//                   "type": "special",
//                   "width": 350,
//                   "height": 57,
//                   "dragging": false,
//                   "position": {
//                       "x": 124,
//                       "y": 296
//                   },
//                   "selected": true,
//                   "positionAbsolute": {
//                       "x": 124,
//                       "y": 296
//                   }
//               }
//           ]
//       }
//   },
//   {
//       "id": "8b7233bd-70ea-4e8e-a695-cbeff2ad1c6a",
//       "name": "test2",
//       "isActive": false,
//       "audiences": [
//           "6e81b696-3b58-4826-92dd-3a3392ea42ec",
//           "880293f6-9963-4606-a0eb-61128f494dc2"
//       ],
//       "rules": [],
//       "visualLayout": {
//           "edges": [],
//           "nodes": [
//               {
//                   "id": "b3196e82-f8a6-45d8-80aa-397fd3242ec5",
//                   "data": {
//                       "primary": true,
//                       "messages": [],
//                       "triggers": [],
//                       "audienceId": "6e81b696-3b58-4826-92dd-3a3392ea42ec",
//                       "dataTriggers": []
//                   },
//                   "type": "special",
//                   "width": 350,
//                   "height": 57,
//                   "dragging": false,
//                   "position": {
//                       "x": 232,
//                       "y": 153
//                   },
//                   "selected": false,
//                   "positionAbsolute": {
//                       "x": 232,
//                       "y": 153
//                   }
//               },
//               {
//                   "id": "34638597-6104-4879-860b-fb62939e2749",
//                   "data": {
//                       "primary": false,
//                       "messages": [],
//                       "triggers": [],
//                       "audienceId": "880293f6-9963-4606-a0eb-61128f494dc2",
//                       "dataTriggers": []
//                   },
//                   "type": "special",
//                   "width": 350,
//                   "height": 57,
//                   "dragging": false,
//                   "position": {
//                       "x": 191,
//                       "y": 276
//                   },
//                   "selected": true,
//                   "positionAbsolute": {
//                       "x": 191,
//                       "y": 276
//                   }
//               }
//           ]
//       }
//   }
// ]

// Example template data:
// [
//   {
//       "id": 1,
//       "name": "q",
//       "text": null,
//       "subject": null,
//       "slackMessage": "fd",
//       "type": "slack"
//   },
//   {
//       "id": 2,
//       "name": "w",
//       "text": null,
//       "subject": null,
//       "slackMessage": "fd",
//       "type": "slack"
//   }
// ]

// to do
// this function takes in the data, figures out is it journey, template or people, sets datasource to that
// then all other rendering is simple
function transformJourneyData(data: TableDataItem[]): TableDataItem[] {
  const result: TableDataItem[] = [];

  for (const element of data) {
    result.push({
      id: element.id,
      name:
        (element.hasOwnProperty("salient")
          ? String(element.id)
          : element.name) || "",
      isActive: element.isActive,
      isPaused: element.isPaused,
      isStopped: element.isStopped,
      isDeleted: element.isDeleted,
      type: element.hasOwnProperty("salient") ? element.salient : element.type,
      createdOn: element.createdOn,
      createdBy: element.createdBy,
      customersEnrolled: element.customersEnrolled,
      audiences: element.audiences,
      dataSource:
        element.dataSource || element.hasOwnProperty("salient")
          ? "people"
          : "j",
      salient: element.salient,
      email: element.email,
      phEmail: element.phEmail,
      phone: element.phone,
      isInsideSegment: element.isInsideSegment,
    });
  }

  return result;
}

const itemsPerPageOptions = [10, 20, 50, 80, 100];

export interface SortOptions {
  name?: "asc" | "desc";
  createdAt?: "asc" | "desc";
}

export interface TableTemplateProps<T extends TableDataItem> {
  data: T[];
  pagesCount?: number;
  setCurrentPage?: (currentPage: number) => void;
  currentPage?: number;
  itemsPerPage: number;
  setItemsPerPage: (itemsPerPage: number) => void;
  isShowDisabled?: boolean;
  setIsShowDisabled?: (isShowDisabled: boolean) => void;
  sortOptions?: SortOptions;
  setSortOptions?: (sortOptions: SortOptions) => void;
  refresh?: () => void;
  setTemplateToDelete?: (name: string) => void;
  showDeletedToggle?: boolean;
  deleteCustomerFromSegment?: (customerId: string) => void;
  setSegmentToDelete?: (segmentId?: string) => void;
  onPersonAdd?: (row: TableDataItem) => void;
  onPersonDelete?: (row: TableDataItem) => void;
  className?: string;
  showDisabledText?: string;
}

export default function TableTemplate<T extends TableDataItem>({
  data,
  onPersonAdd,
  onPersonDelete,
  className,
  pagesCount = 1,
  setCurrentPage = () => {},
  currentPage = 0,
  itemsPerPage,
  setItemsPerPage,
  isShowDisabled = false,
  setIsShowDisabled = () => {},
  sortOptions,
  setSortOptions,
  refresh = () => {},
  setTemplateToDelete = () => {},
  showDeletedToggle = true,
  deleteCustomerFromSegment = () => {},
  setSegmentToDelete = () => {},
  showDisabledText = "Show deleted",
}: TableTemplateProps<T>) {
  const isSkipped = (num?: number) => {
    if (!num) return false;
    return Math.abs(currentPage - num) > 1 && num > 2 && num < pagesCount - 3;
  };

  const handleDeleteJourney = (workflowId: string) => {
    confirmAlert({
      title: "Confirm delete?",
      message: "Are you sure you want to delete journey?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            await ApiService.patch({
              url: "/journeys/delete/" + workflowId,
            });
            refresh();
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  function renderCorrectLink(row: TableDataItem, isButton = false) {
    if (row.type == "email") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/email/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/email/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (data[0].dataSource === "segmentPeople") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link className="!no-underline" href={`/person/${row.id}`}>
                  <div className="w-full">Edit</div>
                </Link>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() =>
                          deleteCustomerFromSegment(String(row.id || ""))
                        }
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`/person/${row.id}`}>{row.email}</Link>
      );
    } else if (row.type == "sms") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/sms/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/sms/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (row.type == "firebase") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/firebase/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/firebase/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (row.type == "slack") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/slack/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/slack/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (row.type == "webhook") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/webhook/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/webhook/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (row.type === "modal") {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`templates/modal/${row.name}`}
                >
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/templates/${row.name}/duplicate`,
                      options: {},
                    });
                    window.location.reload();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) setTemplateToDelete(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`templates/modal/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (["automatic", "manual"].includes(row.type || "")) {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link className="!no-underline" href={`segment/${row.id}`}>
                  <div className="w-full">Edit</div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: `/segments/${row.id}/duplicate`,
                      options: {},
                    });
                    refresh();
                  }}
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => setSegmentToDelete(String(row.id || ""))}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`segment/${row.id}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else if (row.dataSource == "people") {
      return isButton && onPersonAdd && onPersonDelete ? (
        row.isInsideSegment ? (
          <GenericButton
            customClasses="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
            onClick={() => onPersonDelete(row)}
          >
            Delete
          </GenericButton>
        ) : (
          <GenericButton onClick={() => onPersonAdd(row)}>Add</GenericButton>
        )
      ) : (
        <Link href={`/person/${row.name}`}>
          {isButton ? <div>Edit</div> : row.name}
        </Link>
      );
    } else {
      return isButton ? (
        <Menu as="div" className="relative">
          <Menu.Button className="outline-none">
            {row.isStopped || row.isActive ? (
              <EllipsisHorizontalCircleIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
            ) : (
              <PencilSquareIcon className="text-gray-400 hover:text-gray-500 ml-[10px] text-[16px] w-[24px]" />
            )}
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
            <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-lg border border-gray-200 items-center right-1/2 top-full z-[1000]">
              {[
                <Link
                  className="!no-underline"
                  href={`flow/${row.id}${row.isActive ? "/view" : ""}`}
                >
                  <div className="w-full">
                    {row.isStopped || row.isActive ? "View" : "Edit"}
                  </div>
                </Link>,
                <button
                  onClick={async () => {
                    await ApiService.post({
                      url: "/journeys/duplicate/" + row.id,
                      options: {},
                    });
                    window.location.reload();
                  }}
                  data-duplicate-button
                >
                  Duplicate
                </button>,
                ...(row.isDeleted
                  ? []
                  : [
                      <button
                        className="w-full text-center cursor-pointer outline-none text-red-500"
                        onClick={() => {
                          if (row?.id) handleDeleteJourney(row.id as string);
                        }}
                        data-delete-button
                      >
                        Delete
                      </button>,
                    ]),
              ].map((el, i) => (
                <Menu.Item>
                  <div
                    key={i}
                    className="w-full text-center hover:bg-gray-200 transition-all px-[6px] py-[4px] border-b-[1px] border-b-gray-200"
                  >
                    {el}
                  </div>
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <Link href={`flow/${row.id}${row.isActive ? "/view" : ""}`}>
          {row.name}
        </Link>
      );
    }
  }

  function Row(props: { row: TableDataItem }) {
    const { row } = props;

    return (
      <React.Fragment>
        <tr>
          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
            {renderCorrectLink(row)}
          </td>
          {renderSecondColumn(row)}
          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
            {renderCorrectLink(row, true)}
          </td>
        </tr>
      </React.Fragment>
    );
  }

  return (
    <div
      className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 overflow-y-scroll ${className}`}
    >
      {/*<div className="mt-8 flex flex-col">*/}
      <div className="relative mb-[15px] mt-[10px] flex items-center justify-between">
        <div>
          {setIsShowDisabled && showDeletedToggle && (
            <div className="flex items-center justify-center gap-[10px]">
              {showDisabledText}:
              <ToggleSwitch
                checked={isShowDisabled}
                onChange={() => setIsShowDisabled(!isShowDisabled)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-center items-center gap-[10px]">
          Items per page:
          <Select
            id="items_per_page_select"
            value={itemsPerPage}
            options={itemsPerPageOptions.map((item) => ({ value: item }))}
            onChange={(value) => setItemsPerPage(value)}
          />
        </div>

        {/* {itemsPerPageOptions.map((option, i) => (
          <div
            className={`
              ${i === 0 && `rounded-bl-[6px] rounded-tl-[6px]`}
              ${
                i === itemsPerPageOptions.length - 1 &&
                `rounded-br-[6px] rounded-tr-[6px]`
              }
              ${
                itemsPerPage === option
                  ? "bg-[linear-gradient(96.63deg,_#6BCDB5_10.79%,_#307179_67.24%,_#122F5C_87.43%)]"
                  : "border-[#E5E5E5] border-2"
              } 
              flex relative justify-center items-center px-[17px] py-[5px] cursor-pointer max-w-[57px] max-h-[36px] font-[Poppins] font-medium text-[14px] leading-[26px] text-center text-[color]`}
            onClick={() => setItemsPerPage(option)}
          >
            {itemsPerPage === option && (
              <div
                className={`h-full w-full absolute p-[2px] ${
                  i === 0 ? `rounded-bl-[6px] rounded-tl-[6px]` : ""
                } 
                ${
                  i === itemsPerPageOptions.length - 1 &&
                  `rounded-br-[6px] rounded-tr-[6px]`
                }`}
              >
                <div className="bg-white w-full h-full" />
              </div>
            )}
            <span
              className={`${
                itemsPerPage === option
                  ? "bg-[linear-gradient(96.63deg,_#6BCDB5_10.79%,_#307179_67.24%,_#122F5C_87.43%)] !bg-clip-text text-transparent"
                  : ""
              } relative font-[Poppins] font-medium text-[14px] leading-[26px]`}
            >
              {option}
            </span>
          </div>
        ))} */}
      </div>
      <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table
              className={`min-w-full divide-y divide-gray-300 md:rounded-lg`}
            >
              <thead className="bg-gray-50">
                <tr className="bg-gray-50 px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  {renderCorrectColumnNames(
                    data as (T & { dataSource: string })[],
                    sortOptions,
                    setSortOptions
                  )}
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-gray-200 bg-white overflow-y-scroll`}
              >
                {transformJourneyData(data).map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div
          className="isolate !border-none inline-flex -space-x-px rounded-md shadow-sm mx-[50px] mb-[20px] items-end"
          aria-label="Pagination"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cursor-pointer mr-[10px]"
            onClick={() => {
              setCurrentPage(
                currentPage === 0 ? pagesCount - 1 : currentPage - 1
              );
            }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.70711 9.70711C5.31658 10.0976 4.68342 10.0976 4.2929 9.70711L0.292894 5.70711C-0.0976312 5.31658 -0.0976312 4.68342 0.292894 4.29289L4.29289 0.292894C4.68342 -0.0976312 5.31658 -0.0976312 5.70711 0.292894C6.09763 0.683417 6.09763 1.31658 5.70711 1.70711L3.41421 4L15 4C15.5523 4 16 4.44771 16 5C16 5.55228 15.5523 6 15 6L3.41421 6L5.70711 8.29289C6.09763 8.68342 6.09763 9.31658 5.70711 9.70711Z"
              fill="#E5E5E5"
            />
          </svg>
          {[...new Array(pagesCount)].map((_, i) => {
            if (isSkipped(i) && isSkipped(i - 1)) return;
            const content = isSkipped(i) ? "..." : i + 1;
            const isSelected = currentPage === i;
            return (
              <div
                key={i}
                className={`relative flex-row justify-center items-start pt-[16px] px-[16px] cursor-pointer`}
                onClick={() => {
                  setCurrentPage(i);
                }}
              >
                <span
                  className={`${
                    isSelected
                      ? "bg-cyan-500 !bg-clip-text text-transparent"
                      : ""
                  }  font-[Poppins] font-medium text-[14px] leading-[26px]`}
                >
                  {content}
                </span>
                <div
                  className={`${
                    !isSelected && "opacity-0"
                  } transition-all absolute top-[-1px] h-[2px] left-0 w-full bg-cyan-500`}
                />
              </div>
            );
          })}
          <svg
            width="20"
            height="20"
            viewBox="0 0 18 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cursor-pointer ml-[10px]"
            onClick={() => {
              setCurrentPage(
                currentPage === pagesCount - 1 ? 0 : currentPage + 1
              );
            }}
          >
            <path
              d="M13.1667 1.66602L16.5 4.99935M16.5 4.99935L13.1667 8.33268M16.5 4.99935L1.5 4.99935"
              stroke="#E5E5E5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

//export default TableTemplate;
