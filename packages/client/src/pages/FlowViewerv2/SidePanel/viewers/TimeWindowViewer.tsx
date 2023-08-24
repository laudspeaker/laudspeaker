import { TimeWindowNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ApiService from "services/api.service";
import Pagination from "components/Pagination";
import Table from "components/Tablev2";

enum TimeWindowViewerTab {
  CONFIGURATION = "configuration",
  CUSTOMER_DATA = "customerData",
}

const timeWindowViewerTabsToShow = [
  TimeWindowViewerTab.CONFIGURATION,
  TimeWindowViewerTab.CUSTOMER_DATA,
];

const ITEMS_PER_PAGE = 5;

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

const TimeWindowViewer: FC<SidePanelComponentProps<TimeWindowNodeData>> = ({
  nodeData,
}) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TimeWindowViewerTab.CONFIGURATION);

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
    if (activeTab !== TimeWindowViewerTab.CUSTOMER_DATA) return;

    loadCustomerData();
  }, [currentPage, activeTab, ITEMS_PER_PAGE]);

  const from = nodeData.from
    ? format(new Date(nodeData.from), "yyyy/MM/dd kk:mm")
    : "not defined";
  const to = nodeData.to
    ? format(new Date(nodeData.to), "yyyy/MM/dd kk:mm")
    : "not defined";

  const tabFixtures: Record<
    TimeWindowViewerTab,
    { name: string; onClick: () => void; content: ReactNode }
  > = {
    [TimeWindowViewerTab.CONFIGURATION]: {
      name: "Configuration",
      onClick: () => setActiveTab(TimeWindowViewerTab.CONFIGURATION),
      content: (
        <div className="p-5">
          <div className="bg-gray-100 border border-gray-200 rounded gap-5 flex py-3 px-7">
            <div className="flex flex-col">
              <span>From</span>
              <span>To</span>
            </div>
            <div className="flex flex-col font-semibold">
              <span>{from}</span>
              <span>{to}</span>
            </div>
          </div>
        </div>
      ),
    },
    [TimeWindowViewerTab.CUSTOMER_DATA]: {
      name: "Customer Data",
      onClick: () => setActiveTab(TimeWindowViewerTab.CUSTOMER_DATA),
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
        {timeWindowViewerTabsToShow.map((tab, i) => (
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

export default TimeWindowViewer;
