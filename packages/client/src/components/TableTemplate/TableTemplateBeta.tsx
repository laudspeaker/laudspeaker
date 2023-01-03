import React from "react";
import { BanknotesIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

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
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TableTemplateBeta({}: any) {
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
}
