import React from "react";
import { Link } from "@mui/material";
import Select from "../Elements/Select/Select";
import { MinusIcon } from "@heroicons/react/20/solid";

import { Fragment, useState } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  Bars3CenterLeftIcon,
  BellIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";

const navigation = [
  { name: "Home", href: "#", icon: HomeIcon, current: true },
  { name: "History", href: "#", icon: ClockIcon, current: false },
  { name: "Balances", href: "#", icon: ScaleIcon, current: false },
  { name: "Cards", href: "#", icon: CreditCardIcon, current: false },
  { name: "Recipients", href: "#", icon: UserGroupIcon, current: false },
  { name: "Reports", href: "#", icon: DocumentChartBarIcon, current: false },
];
const secondaryNavigation = [
  { name: "Settings", href: "#", icon: CogIcon },
  { name: "Help", href: "#", icon: QuestionMarkCircleIcon },
  { name: "Privacy", href: "#", icon: ShieldCheckIcon },
];
const cards = [
  { name: "Account balance", href: "#", icon: ScaleIcon, amount: "$30,659.45" },
  // More items...
];
const transactions = [
  {
    id: 1,
    name: "Payment to Molly Sanders",
    href: "#",
    amount: "$20,000",
    currency: "USD",
    status: "success",
    date: "July 11, 2020",
    datetime: "2020-07-11",
  },
  {
    id: 2,
    name: "Payment to Molly Sanders",
    href: "#",
    amount: "$20,000",
    currency: "USD",
    status: "success",
    date: "July 11, 2020",
    datetime: "2020-07-11",
  },
  {
    id: 3,
    name: "Payment to Molly Sanders",
    href: "#",
    amount: "$20,000",
    currency: "USD",
    status: "success",
    date: "July 11, 2020",
    datetime: "2020-07-11",
  },
  // More transactions...
];
const statusStyles = {
  success: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  failed: "bg-gray-100 text-gray-800",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

//to do add datasource here to make rendering much simpler
function createData(
  name: string,
  isActive: boolean,
  createdOn: number,
  createdBy: number,
  customersEnrolled: number,
  type: string,
  dataSource: string
) {
  return {
    name,
    isActive,
    createdOn,
    createdBy,
    customersEnrolled,
    type,
    dataSource,
    audiences: [
      {
        date: "2020-01-05",
        customerId: "11091700",
        amount: 3,
      },
    ],
  };
}

function renderCorrectLink(
  row: ReturnType<typeof createData>,
  isButton = false
) {
  if (row.type == "email") {
    return (
      <Link href={`templates/email/${row.name}`}>
        {isButton ? <div>Edit</div> : row.name}
      </Link>
    );
  } else if (row.type == "sms") {
    return (
      <Link href={`templates/sms/${row.name}`}>
        {isButton ? <div>Edit</div> : row.name}
      </Link>
    );
  } else if (row.type == "slack") {
    return (
      <Link href={`templates/slack/${row.name}`}>
        {isButton ? <div>Edit</div> : row.name}
      </Link>
    );
  } else if (row.dataSource == "people") {
    return (
      <Link href={`person/${row.name}`}>
        {isButton ? <div>Edit</div> : row.name}
      </Link>
    );
  } else {
    return (
      <Link href={`flow/${row.name}${row.isActive ? "/view" : ""}`}>
        {isButton ? <div>Edit</div> : row.name}
      </Link>
    );
  }
}

function renderCorrectColumnNames(
  data: any,
  sortOptions?: any,
  setSortOptions?: (value: any) => void
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
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Active
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Edit
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
          Info
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
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Type
        </th>
        <th
          scope="col"
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Edit
        </th>
      </>
    );
  }
}

function renderSecondColumn(row: ReturnType<typeof createData>) {
  if (row.dataSource == "people") {
    return (
      <>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {row.type}
        </td>
      </>
    );
    //journey vs template
  } else if (row.isActive != null) {
    //this is a test for checking if this is the journeys table or the template table
    return (
      <>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {String(row.isActive)}
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

function Row(props: { row: ReturnType<typeof createData> }) {
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

const rows = [
  createData("Frozen yoghurt", false, 6.0, 24, 4.0, "email", "other"),
  createData("Ice cream sandwich", true, 9.0, 37, 4.3, "slack", "other"),
  createData("Eclair", true, 16.0, 24, 6.0, "email", "other"),
  createData("Cupcake", false, 3.7, 67, 4.3, "email", "other"),
  createData("Gingerbread", true, 16.0, 49, 3.9, "slack", "other"),
];

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
function transformJourneyData(data: any) {
  const result = [];
  for (const element of data) {
    //people table
    // if (data[0].hasOwnProperty("salient")) {
    //   result.push({
    //     name: data[i].id,
    //     isActive: null,
    //     type: null,
    //     createdOn: null,
    //     createdBy: data[i].salient,
    //     customersEnrolled: null,
    //     audiences: null,
    //     dataSource: "people",
    //   });
    // } else {
    //   // journey or templates
    //   result.push({
    //     name: data[i].name,
    //     isActive: data[i].isActive,
    //     type: data[i].type,
    //     createdOn: data[i].createdOn,
    //     createdBy: data[i].createdBy,
    //     customersEnrolled: data[i].customersEnrolled,
    //     audiences: data[i].audiences,
    //     datasource: (data[0].hasOwnProperty("salient")? "people" :),
    //   });
    // }
    result.push({
      name: element.hasOwnProperty("salient") ? element.id : element.name,
      isActive: element.isActive,
      type: element.hasOwnProperty("salient") ? element.salient : element.type,
      createdOn: element.createdOn,
      createdBy: element.createdBy,
      customersEnrolled: element.customersEnrolled,
      audiences: element.audiences,
      dataSource: element.hasOwnProperty("salient") ? "people" : "j",
    });
  }
  return result;
}

const itemsPerPageOptions = [10, 20, 50, 80, 100];

export default function TableTemplateBeta({
  data,
  pagesCount = 1,
  setCurrentPage = 0,
  currentPage = 0,
  itemsPerPage,
  setItemsPerPage,
  sortOptions,
  setSortOptions,
}: any) {
  const isSkipped = (num?: number) => {
    if (!num) return false;
    return Math.abs(currentPage - num) > 1 && num > 2 && num < pagesCount - 3;
  };

  //to do here
  return (
    <>
      <div className="shadow sm:hidden">
        <ul
          role="list"
          className="mt-2 divide-y divide-gray-200 overflow-hidden shadow sm:hidden"
        >
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <a
                href={transaction.href}
                className="block bg-white px-4 py-4 hover:bg-gray-50"
              >
                <span className="flex items-center space-x-4">
                  <span className="flex flex-1 space-x-2 truncate">
                    <BanknotesIcon
                      className="h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="flex flex-col truncate text-sm text-gray-500">
                      <span className="truncate">{transaction.name}</span>
                      <span>
                        <span className="font-medium text-gray-900">
                          {transaction.amount}
                        </span>{" "}
                        {transaction.currency}
                      </span>
                      <time dateTime={transaction.datetime}>
                        {transaction.date}
                      </time>
                    </span>
                  </span>
                  <ChevronRightIcon
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3"
          aria-label="Pagination"
        >
          <div className="flex flex-1 justify-between">
            <a
              href="#"
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Previous
            </a>
            <a
              href="#"
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Next
            </a>
          </div>
        </nav>
      </div>
      {/* Activity table (small breakpoint and up) */}
      <div className="hidden sm:block">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mt-2 flex flex-col">
            <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      className="bg-gray-50 px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      scope="col"
                    >
                      Transaction
                    </th>
                    <th
                      className="bg-gray-50 px-6 py-3 text-right text-sm font-semibold text-gray-900"
                      scope="col"
                    >
                      Amount
                    </th>
                    <th
                      className="hidden bg-gray-50 px-6 py-3 text-left text-sm font-semibold text-gray-900 md:block"
                      scope="col"
                    >
                      Status
                    </th>
                    <th
                      className="bg-gray-50 px-6 py-3 text-right text-sm font-semibold text-gray-900"
                      scope="col"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="bg-white">
                      <td className="w-full max-w-0 whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <div className="flex">
                          <a
                            href={transaction.href}
                            className="group inline-flex space-x-2 truncate text-sm"
                          >
                            <BanknotesIcon
                              className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                              aria-hidden="true"
                            />
                            <p className="truncate text-gray-500 group-hover:text-gray-900">
                              {transaction.name}
                            </p>
                          </a>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {transaction.amount}
                        </span>
                        {transaction.currency}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 md:block">
                        <span
                          className={classNames(
                            "Success",
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          )}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                        <time dateTime={transaction.datetime}>
                          {transaction.date}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <nav
                className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
                aria-label="Pagination"
              >
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to
                    <span className="font-medium">10</span> of{" "}
                    <span className="font-medium">20</span> results
                  </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end">
                  <a
                    href="#"
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </a>
                  <a
                    href="#"
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  {
    /*
    <div className="mt-8 flex flex-col">
      <div className="relative mr-[50px] mb-[15px] mt-[10px] flex items-center justify-end">
        <div className="flex justify-center items-center gap-[10px]">
          Items per page:
          <Select
            id="items_per_page_select"
            value={itemsPerPage}
            options={itemsPerPageOptions.map((item) => ({ value: item }))}
            onChange={(value) => setItemsPerPage(value)}
          />
        </div>    
      </div>
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {renderCorrectColumnNames(data, sortOptions, setSortOptions)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {transformJourneyData(data).map((row) => (
                  <Row key={row.name} row={row} />
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
              fill-rule="evenodd"
              clip-rule="evenodd"
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
                      ? "bg-[linear-gradient(96.63deg,_#6BCDB5_10.79%,_#307179_67.24%,_#122F5C_87.43%)] !bg-clip-text text-transparent"
                      : ""
                  }  font-[Poppins] font-medium text-[14px] leading-[26px]`}
                >
                  {content}
                </span>
                <div
                  className={`${
                    !isSelected && "opacity-0"
                  } transition-all absolute top-[-1px] h-[2px] left-0 w-full bg-[linear-gradient(96.63deg,_#6BCDB5_10.79%,_#307179_67.24%,_#122F5C_87.43%)]`}
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
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
    */
  }
}

//export default TableTemplate;
