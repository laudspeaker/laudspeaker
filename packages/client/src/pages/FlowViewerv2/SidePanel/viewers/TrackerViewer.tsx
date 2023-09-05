import Table from "components/Tablev2";
import {
  Stats,
  TrackerNodeData,
  TrackerVisibility,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import {
  findFirstTrackerAbove,
  trackerStatsToShow,
} from "pages/FlowBuilderv2/Nodes/TrackerNode";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidePanelComponentProps } from "../FlowViewerSidePanel";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import { Node } from "reactflow";
import Tooltip from "components/Elements/Tooltip";

enum TrackerViewerTab {
  METRICS,
  TRACKER_FIELDS,
}

const ITEMS_PER_PAGE = 5;

const TrackerViewer: FC<
  SidePanelComponentProps<TrackerNodeData> & { id: string }
> = ({ nodeData, id }) => {
  const { nodes, edges } = useAppSelector((state) => state.flowBuilder);

  const navigate = useNavigate();

  const [firstTrackerNodeAbove, setFirstTrackerNodeAbove] =
    useState<Node<TrackerNodeData>>();
  const [viewerTab, setViewerTab] = useState(TrackerViewerTab.METRICS);
  const [pickedStat, setPickedStat] = useState<keyof Stats | undefined>(
    trackerStatsToShow?.[0].key
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

  const thisNode = nodes.find((node) => node.id === id);

  useEffect(() => {
    setFirstTrackerNodeAbove(
      thisNode
        ? findFirstTrackerAbove(
            thisNode as Node<TrackerNodeData>,
            thisNode.data as TrackerNodeData,
            nodes,
            edges
          )
        : undefined
    );
  }, [thisNode, nodes, edges]);

  const viewerTabToComponentMap: Record<TrackerViewerTab, ReactNode> = {
    [TrackerViewerTab.METRICS]: (
      <div className="flex flex-col gap-[10px]">
        <div className="flex justify-between gap-[10px]">
          {trackerStatsToShow.map((stat, i) => (
            <div
              key={i}
              className={`w-full rounded-[4px] px-[10px] py-[4px] flex flex-col gap-[9px] border-[1px] border-[#E5E7EB] select-none cursor-pointer ${
                stat.key === pickedStat ? "!border-[#6366F1] !bg-[#EEF2FF]" : ""
              }`}
              onClick={() =>
                setPickedStat(pickedStat === stat.key ? undefined : stat.key)
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
        {pickedStat && (
          <div>
            <div className="flex gap-[136px]">
              <div className="font-semibold whitespace-nowrap">Customer ID</div>
              <div className="font-semibold w-full">Email</div>
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
                  <div className="max-w-[180px] overflow-hidden text-ellipsis">
                    {customer.email}
                  </div>
                </div>
              ))}
              {!statCustomers.length && (
                <p className="py-3 block border-b mb-5 font-inter text-gray-600">
                  0 sent
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
    ),
    [TrackerViewerTab.TRACKER_FIELDS]: (
      <>
        <div className="rounded-[4px] border-t-[1px] border-x-[1px] border-[#E5E7EB]">
          <Table
            className="w-full"
            headings={[
              <div className="px-[20px] py-[10px] min-h-[22px] min-w-[150px]">
                Field
              </div>,
              <div className="px-[20px] py-[10px] min-h-[22px]">Value</div>,
            ]}
            rows={
              !nodeData.tracker || nodeData.tracker.fields.length === 0
                ? [
                    [
                      <div className="min-h-[22px] text-[#4B5563] max-w-[160px]">
                        No field
                      </div>,
                      <div className="min-h-[22px]"></div>,
                    ],
                  ]
                : nodeData.tracker.fields.map((field) => [
                    <div className="flex flex-col gap-[2px] min-h-[22px]">
                      <div className="flex gap-[5px] items-center">
                        {field.value !==
                          firstTrackerNodeAbove?.data.tracker?.fields.find(
                            (f) => f.name === field.name
                          )?.value && (
                          <Tooltip
                            placement="bottom-start"
                            className="bg-[#111827] rounded-none p-[5px] text-white"
                            content="Value changed compared to previous occurrence"
                          >
                            <div className="w-[8px] h-[8px] bg-[#F43F5E] rounded-[100%]" />
                          </Tooltip>
                        )}
                        <div>{field.name}</div>
                      </div>
                      <div className="text-[#4B5563]">{field.type}</div>
                    </div>,
                    <div className="min-h-[22px]">{field.value}</div>,
                  ])
            }
          />
        </div>
      </>
    ),
  };

  return (
    <div className="border-t-[1px] border-[#E5E7EB]">
      {nodeData.tracker ? (
        <div>
          <div className="p-[20px] flex flex-col gap-[10px]">
            <div className="w-full flex justify-between items-center">
              <div>Tracker ID</div>
              <div className="relative w-[200px] font-roboto bg-[#F3F4F6] px-[12px] py-[5px] rounded-[2px] border-[1px] border-[#E5E7EB]">
                <div>{nodeData.tracker.trackerId}</div>

                <button
                  className="absolute right-[12px] top-1/2 -translate-y-1/2"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      nodeData.tracker?.trackerId || ""
                    )
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M11.8125 12.9375V15.4688C11.8125 15.9345 11.4345 16.3125 10.9688 16.3125H3.65625C3.43247 16.3125 3.21786 16.2236 3.05963 16.0654C2.90139 15.9071 2.8125 15.6925 2.8125 15.4688V5.90625C2.8125 5.4405 3.1905 5.0625 3.65625 5.0625H5.0625C5.43943 5.06224 5.81573 5.09335 6.1875 5.1555M11.8125 12.9375H14.3438C14.8095 12.9375 15.1875 12.5595 15.1875 12.0938V8.4375C15.1875 5.0925 12.7552 2.31675 9.5625 1.7805C9.19073 1.71835 8.81443 1.68725 8.4375 1.6875H7.03125C6.5655 1.6875 6.1875 2.0655 6.1875 2.53125V5.1555M11.8125 12.9375H7.03125C6.80747 12.9375 6.59286 12.8486 6.43463 12.6904C6.27639 12.5321 6.1875 12.3175 6.1875 12.0938V5.1555M15.1875 10.125V8.71875C15.1875 8.04742 14.9208 7.40359 14.4461 6.92889C13.9714 6.45419 13.3276 6.1875 12.6562 6.1875H11.5312C11.3075 6.1875 11.0929 6.09861 10.9346 5.94037C10.7764 5.78214 10.6875 5.56753 10.6875 5.34375V4.21875C10.6875 3.88634 10.622 3.55719 10.4948 3.25008C10.3676 2.94298 10.1812 2.66394 9.94611 2.42889C9.71107 2.19384 9.43202 2.00739 9.12492 1.88018C8.81781 1.75297 8.48866 1.6875 8.15625 1.6875H7.3125"
                      stroke="#4B5563"
                      strokeWidth="1.125"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full flex justify-between items-center">
              <div>Tracker template</div>
              <div>{nodeData.tracker.trackerTemplate.name}</div>
            </div>
            <div className="w-full flex justify-between items-center">
              <div>Visibility</div>
              {nodeData.tracker.visibility === TrackerVisibility.SHOW ? (
                <div className="bg-[#DCFCE7] px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] text-[#14532D] font-semibold leading-[20px]">
                  Shown
                </div>
              ) : (
                <div className="bg-[#F3F4F6] px-[10px] py-[2px] rounded-[14px] font-inter text-[12px] text-[#6B7280] font-semibold leading-[20px]">
                  Hidden
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <button
              className={`w-full py-[12px] flex justify-center items-center font-inter text-[16px] leading-[24px] ${
                viewerTab === TrackerViewerTab.METRICS
                  ? "border-b-[3px] border-[#6366F1] text-[#6366F1] font-semibold"
                  : "border-b-[1px] border-[#E5E7EB]"
              }`}
              onClick={() => setViewerTab(TrackerViewerTab.METRICS)}
            >
              Metrics
            </button>
            <button
              className={`w-full py-[12px] flex justify-center items-center font-inter text-[16px] leading-[24px] ${
                viewerTab === TrackerViewerTab.TRACKER_FIELDS
                  ? "border-b-[3px] border-[#6366F1] text-[#6366F1] font-semibold"
                  : "border-b-[1px] border-[#E5E7EB]"
              }`}
              onClick={() => setViewerTab(TrackerViewerTab.TRACKER_FIELDS)}
            >
              Tracker fields
            </button>
          </div>

          <div className="p-[20px]">{viewerTabToComponentMap[viewerTab]}</div>
        </div>
      ) : (
        <>No tracker chosen</>
      )}
    </div>
  );
};

export default TrackerViewer;
