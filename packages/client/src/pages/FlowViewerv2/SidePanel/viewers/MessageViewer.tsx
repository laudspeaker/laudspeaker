import { messageFixtures } from "pages/FlowBuilderv2/Nodes/MessageNode";
import { MessageNodeData, Stats } from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "services/api.service";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";

const ITEMS_PER_PAGE = 5;

const MessageViewer: FC<SidePanelComponentProps<MessageNodeData>> = ({
  nodeData,
}) => {
  const navigate = useNavigate();

  const [pickedStat, setPickedStat] = useState<keyof Stats | undefined>(
    Object.keys(nodeData.stats || {})[0] as keyof Stats
  );
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statCustomers, setStatCustomers] = useState<
    {
      id: string;
      email?: string;
    }[]
  >([]);

  const loadStatCustomers = async () => {
    if (!pickedStat || !nodeData.stepId) return;

    const {
      data: { data, totalPages: pagesCount },
    } = await ApiService.get<{
      data: { id: string; email?: string }[];
      totalPages: number;
    }>({
      url: `/customers/stats-from-step?event=${pickedStat}&stepId=${
        nodeData.stepId
      }&take=${ITEMS_PER_PAGE}&skip=${(currentPage - 1) * ITEMS_PER_PAGE}`,
    });

    setStatCustomers(data || []);
    setTotalPages(pagesCount || 1);
  };

  useEffect(() => {
    loadStatCustomers();
  }, [pickedStat]);

  const fixtures = messageFixtures[nodeData.template.type];

  return (
    <div>
      <div className="px-[20px] pb-[20px] border-b-[1px] border-[#E5E7EB]">
        <div className="w-[200px] h-[60px] px-[8px] flex items-center gap-[5px] border-[1px] border-[#4B5563] rounded-[4px]">
          <div className="text-[#4B5563]">{fixtures.icon}</div>
          <div className="font-inter font-normal text-[14px] leading-[22px] text-[#111827]">
            {nodeData.template.selected?.name || "Unknown template"}
          </div>
        </div>
      </div>
      <div className="p-[20px] flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[10px]">
          <div className="font-semibold text-[20px] leading-[28px]">
            Metrics
          </div>
          {fixtures.statsToShow ? (
            <div className="flex justify-between gap-[10px]">
              {fixtures.statsToShow.map((stat, i) => (
                <div
                  key={i}
                  className={`w-full rounded-[4px] px-[10px] py-[4px] flex flex-col gap-[9px] border-[1px] border-[#E5E7EB] select-none cursor-pointer ${
                    stat.key === pickedStat
                      ? "!border-[#6366F1] !bg-[#EEF2FF]"
                      : ""
                  }`}
                  onClick={() =>
                    setPickedStat(
                      pickedStat === stat.key ? undefined : stat.key
                    )
                  }
                >
                  <div className="font-roboto text-[14px] leading-[22px] text-[#6B7280]">
                    {stat.name}
                  </div>
                  <div className="font-roboto text-[24px] leading-[28px]">
                    {stat.renderLabel(nodeData.stats?.[stat.key] || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>Nothing to show here right now...</>
          )}
        </div>
        {pickedStat && (
          <div>
            <div className="flex gap-[46px]">
              <div className="font-semibold">Customer ID</div>
              <div className="font-semibold">Email</div>
            </div>
            <div className="py-[10px]">
              {statCustomers?.map((customer, i) => (
                <div
                  key={i}
                  className="py-[11px] flex justify-between gap-[30px] font-inter font-normal text-[14px] leading-[22px] border-b-[1px] border-[#E5E7EB]"
                >
                  <div
                    className="select-none cursor-pointer text-[#6366F1]"
                    onClick={() => navigate("/person/" + customer.id)}
                  >
                    {customer.id}
                  </div>
                  <div>{customer.email}</div>
                </div>
              ))}
              {!statCustomers.length && (
                <p className="py-3 block border-b mb-5 font-inter text-gray-600">
                  0 emails sent
                </p>
              )}
              <div className="flex items-center justify-center">
                <div
                  className={`p-[6px] cursor-pointer select-none ${
                    currentPage === 1 ? "text-[#D1D5DB]" : ""
                  }`}
                  onClick={
                    currentPage === 1
                      ? undefined
                      : () => setCurrentPage(currentPage - 1)
                  }
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.83986 2.06646V1.03119C8.83986 0.941456 8.73674 0.891902 8.6671 0.946813L2.6296 5.66244C2.5783 5.70233 2.53679 5.75341 2.50824 5.81179C2.47969 5.87016 2.46484 5.93429 2.46484 5.99927C2.46484 6.06425 2.47969 6.12838 2.50824 6.18675C2.53679 6.24512 2.5783 6.29621 2.6296 6.3361L8.6671 11.0517C8.73808 11.1066 8.83986 11.0571 8.83986 10.9673V9.93208C8.83986 9.86646 8.80906 9.80351 8.75817 9.76333L3.93674 5.99994L8.75817 2.23521C8.80906 2.19503 8.83986 2.13208 8.83986 2.06646Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {new Array(totalPages).fill(0, 0, totalPages).map((_, i) => (
                  <div
                    className={`min-w-[24px] h-[24px] flex justify-center items-center rounded-[2px] cursor-pointer select-none ${
                      i + 1 === currentPage
                        ? "border-[1px] border-[#6366F1] text-[#6366F1]"
                        : ""
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </div>
                ))}

                <div
                  className={`p-[6px] cursor-pointer select-none ${
                    currentPage === totalPages ? "text-[#D1D5DB]" : ""
                  }`}
                  onClick={
                    currentPage === totalPages
                      ? undefined
                      : () => setCurrentPage(currentPage + 1)
                  }
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.39777 5.66233L3.36027 0.9467C3.34449 0.93428 3.32553 0.926562 3.30557 0.924431C3.2856 0.9223 3.26544 0.925844 3.2474 0.934655C3.22936 0.943466 3.21417 0.957188 3.20357 0.974243C3.19298 0.991299 3.18741 1.011 3.1875 1.03108V2.06634C3.1875 2.13197 3.2183 2.19491 3.2692 2.23509L8.09063 5.99983L3.2692 9.76456C3.21697 9.80474 3.1875 9.86768 3.1875 9.93331V10.9686C3.1875 11.0583 3.29063 11.1079 3.36027 11.053L9.39777 6.33733C9.44908 6.2973 9.4906 6.2461 9.51915 6.18761C9.5477 6.12913 9.56254 6.06491 9.56254 5.99983C9.56254 5.93475 9.5477 5.87052 9.51915 5.81204C9.4906 5.75356 9.44908 5.70235 9.39777 5.66233Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageViewer;
