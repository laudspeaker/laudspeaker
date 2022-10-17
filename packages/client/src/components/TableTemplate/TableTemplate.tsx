import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Link } from "@mui/material";

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

function renderCorrectColumnNames(data: any) {
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
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Name
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
          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
        >
          Name
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

export default function TableTemplate({
  data,
  pagesCount = 1,
  setCurrentPage = 0,
  currentPage = 0,
  itemsPerPage,
  setItemsPerPage,
}: any) {
  const isSkipped = (num?: number) => {
    if (!num) return false;
    return Math.abs(currentPage - num) > 1 && num > 2 && num < pagesCount - 3;
  };

  return (
    <div className="mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>{renderCorrectColumnNames(data)}</tr>
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
        <div className="mr-[50px] mb-[15px] mt-[10px] flex">
          {itemsPerPageOptions.map((option, i) => (
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
                  : "border-[#E5E5E5] border-[2px]"
              } 
              flex relative justify-center items-center px-[17px] py-[5px] cursor-pointer max-w-[57px] max-h-[36px] font-[Poppins] font-medium text-[14px] leading-[26px] text-center text-[color]`}
              onClick={() => setItemsPerPage(option)}
            >
              {itemsPerPage === option && (
                <div
                  className={`h-full w-full absolute p-[2px]               ${
                    i === 0 && `rounded-bl-[6px] rounded-tl-[6px]`
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
          ))}
        </div>
      </div>
    </div>
  );
}

//export default TableTemplate;
