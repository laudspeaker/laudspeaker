import Header from "components/Header";
import React, { useState, useEffect, Fragment } from "react";
import ApiService from "services/api.service";
import { DatabaseFormData } from "./Database";
import { Link } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/20/solid";
import { GenericButton } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { confirmAlert } from "react-confirm-alert";
import Chip from "components/Elements/Chip";
import Tooltip from "components/Elements/Tooltip";

enum IntegrationStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  FAILED = "failed",
}

const Integrations = () => {
  const navigate = useNavigate();

  const [integrations, setIntegrations] = useState<
    (DatabaseFormData & {
      id: string;
      status: IntegrationStatus;
      errorMessage?: string;
    })[]
  >([]);

  const loadData = async () => {
    const { data } = await ApiService.get<
      (DatabaseFormData & {
        databricksHost?: string;
        databricksPath?: string;
        databricksToken?: string;
        id: string;
        status: IntegrationStatus;
        errorMessage?: string;
      })[]
    >({
      url: "/integrations/db",
    });
    setIntegrations(
      data?.map((item) => ({
        ...item,
        databricksData: {
          host: item.databricksHost,
          path: item.databricksPath,
          token: item.databricksToken,
        },
      })) || []
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteIntegration = (id: string) => {
    confirmAlert({
      title: "Confirm delete?",
      message: "Are you sure you want to delete integration?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            await ApiService.delete({
              url: "/integrations/" + id,
              options: {},
            });
            loadData();
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  const handlePauseIntegration = async (id: string) => {
    await ApiService.patch({ url: `integrations/${id}/pause` });
    loadData();
  };

  const handleResumeIntegration = async (id: string) => {
    await ApiService.patch({ url: `integrations/${id}/resume` });
    loadData();
  };

  const statusStyles = {
    [IntegrationStatus.ACTIVE]: "",
    [IntegrationStatus.PAUSED]: "!bg-yellow-200 !text-yellow-600",
    [IntegrationStatus.FAILED]: "!bg-red-200 !text-red-600",
  };

  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col">
          <Header />
          <main>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                      Integrations
                    </h1>
                    <GenericButton onClick={() => navigate("/integrations/db")}>
                      Add new DB
                    </GenericButton>
                  </div>
                  <div className="py-6">
                    <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8 overflow-visible">
                      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8 overflow-visible">
                        <div className="overflow-visible shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300 md:rounded-lg">
                            <thead className="bg-gray-50">
                              <tr className="bg-gray-50 px-6 py-3 text-right text-sm font-semibold text-gray-900">
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
                                  Description
                                </th>
                                <th
                                  scope="col"
                                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                >
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {integrations.map((item) => (
                                <tr>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    <Link to={"/integrations/db/" + item.id}>
                                      <h3>{item.name}</h3>
                                    </Link>
                                  </td>
                                  <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    <div>{item.description}</div>
                                  </td>
                                  <td className="w-[100px] whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    <Tooltip
                                      title={
                                        item.status === IntegrationStatus.FAILED
                                          ? (item.errorMessage || "") +
                                            " Please update integration settings."
                                          : ""
                                      }
                                    >
                                      <Chip
                                        wrapperClass={`${
                                          statusStyles[item.status]
                                        } w-full`}
                                        label={
                                          item.status ===
                                          IntegrationStatus.FAILED ? (
                                            <span className="cursor-help underline-offset-2 underline decoration-dashed">
                                              {item.status} <b>ⓘ</b>
                                            </span>
                                          ) : (
                                            item.status
                                          )
                                        }
                                      />
                                    </Tooltip>
                                  </td>
                                  <td className="w-[100px] whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
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
                                        <Menu.Items className="absolute outline-none w-auto flex flex-col bg-gray-50 shadow-md rounded-[8px] border-[1px] border-gray-200 items-center right-1/2 top-full z-[1000]">
                                          {[
                                            <Link
                                              className="!no-underline"
                                              to={"/integrations/db/" + item.id}
                                            >
                                              <div className="w-full">Edit</div>
                                            </Link>,
                                            ...(item.status ===
                                            IntegrationStatus.FAILED
                                              ? []
                                              : [
                                                  <button
                                                    onClick={() =>
                                                      item.status ===
                                                      IntegrationStatus.PAUSED
                                                        ? handleResumeIntegration(
                                                            item.id
                                                          )
                                                        : handlePauseIntegration(
                                                            item.id
                                                          )
                                                    }
                                                    className="w-full text-center cursor-pointer outline-none"
                                                  >
                                                    {item.status ===
                                                    IntegrationStatus.PAUSED
                                                      ? "Resume"
                                                      : "Pause"}
                                                  </button>,
                                                ]),
                                            <button
                                              className="w-full text-center cursor-pointer outline-none text-red-500"
                                              onClick={() => {
                                                if (item.id)
                                                  handleDeleteIntegration(
                                                    item.id
                                                  );
                                              }}
                                              data-delete-button
                                            >
                                              Delete
                                            </button>,
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
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
