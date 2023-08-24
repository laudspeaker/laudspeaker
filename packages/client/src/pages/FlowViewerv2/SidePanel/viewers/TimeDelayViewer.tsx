import { TimeDelayNodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import { useNavigate } from "react-router-dom";
import ApiService from "services/api.service";
import Table from "components/Tablev2";
import Pagination from "components/Pagination";

enum TimeDelayViewerTab {
  CONFIGURATION = "configuration",
  CUSTOMER_DATA = "customerData",
}

const timeDelayViewerTabsToShow = [
  TimeDelayViewerTab.CONFIGURATION,
  TimeDelayViewerTab.CUSTOMER_DATA,
];

const ITEMS_PER_PAGE = 5;

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

const TimeDelayViewer: FC<SidePanelComponentProps<TimeDelayNodeData>> = ({
  nodeData,
}) => {
  const { days, hours, minutes } = nodeData.delay;

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TimeDelayViewerTab.CONFIGURATION);

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
    if (activeTab !== TimeDelayViewerTab.CUSTOMER_DATA) return;

    loadCustomerData();
  }, [currentPage, activeTab, ITEMS_PER_PAGE]);

  const tabFixtures: Record<
    TimeDelayViewerTab,
    { name: string; onClick: () => void; content: ReactNode }
  > = {
    [TimeDelayViewerTab.CONFIGURATION]: {
      name: "Configuration",
      onClick: () => setActiveTab(TimeDelayViewerTab.CONFIGURATION),
      content: (
        <div className="gap-3 flex items-center p-5">
          <span>Wait</span>
          <span className="bg-gray-100 border border-gray-200 rounded px-2 py-3 font-semibold">
            {days === hours && hours === minutes && minutes === 0 ? (
              <>...</>
            ) : (
              <>
                {days}day{days === 1 ? "" : "s"} {hours}hour
                {hours === 1 ? "" : "s"} {minutes}min
              </>
            )}
          </span>
        </div>
      ),
    },
    [TimeDelayViewerTab.CUSTOMER_DATA]: {
      name: "Customer Data",
      onClick: () => setActiveTab(TimeDelayViewerTab.CUSTOMER_DATA),
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
        {timeDelayViewerTabsToShow.map((tab, i) => (
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

export default TimeDelayViewer;
