import {
  BranchType,
  WaitUntilNodeData,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import EventBranchView from "pages/FlowBuilderv2/SidePanel/components/EventBranchView";
import MaxTimeBranchView from "pages/FlowBuilderv2/SidePanel/components/MaxTimeBranchView";
import Table from "components/Tablev2";
import { useNavigate } from "react-router-dom";
import Pagination from "components/Pagination";
import ApiService from "services/api.service";

enum WaitUntilViewerTab {
  CONFIGURATION = "configuration",
  CUSTOMER_DATA = "customerData",
}

const waitUntilViewerTabsToShow = [
  WaitUntilViewerTab.CONFIGURATION,
  WaitUntilViewerTab.CUSTOMER_DATA,
];

const ITEMS_PER_PAGE = 5;

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

const WaitUntilViewer: FC<SidePanelComponentProps<WaitUntilNodeData>> = ({
  nodeData,
}) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(WaitUntilViewerTab.CONFIGURATION);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<
    {
      id: string;
      email?: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomerData = async () => {
    if (!nodeData.stepId) return;

    setIsLoading(true);

    try {
      const {
        data: { data, totalPages: newTotalPages },
      } = await ApiService.get({
        url: `/customers/in-step/${
          nodeData.stepId
        }?take=${ITEMS_PER_PAGE}&skip=${(currentPage - 1) * ITEMS_PER_PAGE}`,
      });

      setCustomers(data);
      setTotalPages(newTotalPages);
    } catch (e) {
      console.error("Failed to load customers for step", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== WaitUntilViewerTab.CUSTOMER_DATA) return;

    loadCustomerData();
  }, [currentPage, activeTab, ITEMS_PER_PAGE]);

  const { branches } = nodeData;

  const tabFixtures: Record<
    WaitUntilViewerTab,
    { name: string; onClick: () => void; content: ReactNode }
  > = {
    [WaitUntilViewerTab.CONFIGURATION]: {
      name: "Configuration",
      onClick: () => setActiveTab(WaitUntilViewerTab.CONFIGURATION),
      content: (
        <>
          {branches.map((branch, i) => (
            <div
              key={branch.id}
              className="mb-5 border-t border-gray-200 pt-5 flex flex-col gap-3 px-5"
            >
              <div className="font-inter font-semibold text-base text-gray-900">
                Branch {i + 1} -{" "}
                {branch.type === BranchType.EVENT ? "Event" : "Max time"}
              </div>
              {branch.type === BranchType.EVENT ? (
                <EventBranchView branch={branch} />
              ) : (
                <MaxTimeBranchView branch={branch} />
              )}
            </div>
          ))}
        </>
      ),
    },
    [WaitUntilViewerTab.CUSTOMER_DATA]: {
      name: "Customer Data",
      onClick: () => setActiveTab(WaitUntilViewerTab.CUSTOMER_DATA),
      content: (
        <div className="p-[20px] flex flex-col gap-[10px]">
          <div className="text-[16px] font-semibold leading-[24px]">
            {compatNumberFormatter.format(nodeData.customersCount || 0)}{" "}
            customers at this Step
          </div>
          <div className="py-[10px] flex flex-col gap-[10px]">
            <div className="border-x-[1px] border-t-[1px] border-[#E5E7EB] rounded-[4px]">
              <Table
                className="w-full"
                headings={[
                  <div className="p-[10px]">Customer ID</div>,
                  <div className="p-[10px]">Email</div>,
                ]}
                rows={customers.map((customer) => [
                  <div
                    className="select-none cursor-pointer text-[#6366F1]"
                    onClick={() => navigate("/person/" + customer.id)}
                  >
                    {customer.id}
                  </div>,
                  <div className="max-w-[180px] overflow-hidden text-ellipsis">
                    {customer.email}
                  </div>,
                ])}
                isLoading={isLoading}
              />
            </div>
            <div className="flex items-center justify-center pt-[10px]">
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div>
      <div className="w-full flex">
        {waitUntilViewerTabsToShow.map((tab, i) => (
          <button
            className={`w-full py-[12px] font-inter text-[16px] leading-[24px] ${
              activeTab === tab
                ? "font-semibold border-b-[2px] border-[#6366F1] text-[#6366F1]"
                : "font-normal border-b-[1px] border-[#E5E7EB]"
            }`}
            key={i}
            onClick={tabFixtures[tab].onClick}
          >
            {tabFixtures[tab].name}
          </button>
        ))}
      </div>
      {tabFixtures[activeTab].content}
    </div>
  );
};

export default WaitUntilViewer;
