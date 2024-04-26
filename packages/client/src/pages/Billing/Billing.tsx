import ExclamationCircleIcon from "assets/icons/ExclamationCircleIcon";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Modal from "components/Elements/Modalv2";
import ProgressBar from "components/ProgressBar";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { capitalize } from "lodash";
import React, { useState } from "react";
import UpgradePlanAlert from "./Modals/UpgradePlanAlert";

interface PlanUsageMetrics {
  name: string;
  current: number;
  maximum: number;
}

enum InvoiceStatus {
  PAID = "paid",
}

interface InvoiceHistoryRow {
  date: string;
  plan: string;
  price: number;
  status: InvoiceStatus;
}

const invoiceStatusToBadgeClassNamesMap: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: "bg-[#DCFCE7] text-[#14532D]",
};

const Billing = () => {
  const [planUsageMetrics, setPlanUsageMetrics] = useState<PlanUsageMetrics[]>([
    { name: "Messages", current: 33, maximum: 100 },
    { name: "Active journeys", current: 2, maximum: 2 },
    { name: "Segments", current: 1, maximum: 2 },
    { name: "Users", current: 80, maximum: 100 },
    { name: "Seats", current: 1, maximum: 1 },
    { name: "Workspaces", current: 2, maximum: 2 },
  ]);

  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryRow[]>([
    {
      date: new Date().toUTCString(),
      plan: "Growth plan",
      price: 100,
      status: InvoiceStatus.PAID,
    },
  ]);
  const [isUpgradePlanAlertOpen, setIsUpgradePlanAlertOpen] = useState(false);

  return (
    <div className="font-inter text-[14px] text-[#111827] font-normal leading-[22px] flex justify-center p-5">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="text-[#000000] font-semibold text-[20px] leading-[28px]">
          Billing and plan
        </div>
        <div className="bg-white rounded w-full p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Current plan
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col gap-2.5">
                <div className="text-[#6366F1] font-semibold text-[16px] leading-[24px]">
                  Growth
                </div>
                <div className="font-roboto text-[24px] font-semibold leading-[32px]">
                  $100 per month
                </div>
                <div>
                  <Button type={ButtonType.LINK} onClick={() => {}}>
                    view plan details
                  </Button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="font-semibold">
                    Your plan renews on January 31, 2024
                  </div>
                  <Button type={ButtonType.LINK} onClick={() => {}}>
                    Cancel plan
                  </Button>
                </div>
              </div>
              <div className="flex items-center h-fit gap-2.5">
                <Button type={ButtonType.SECONDARY} onClick={() => {}}>
                  Compare plans
                </Button>
                <Button type={ButtonType.PRIMARY} onClick={() => {}}>
                  Upgrade plan
                </Button>
              </div>
            </div>
          </div>
          <div className="h-[1px] bg-[#E5E7EB]" />
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Plan Usage
            </div>
            <div className="grid grid-cols-3 gap-x-[15px] gap-y-2.5">
              {planUsageMetrics.map((metric, i) => (
                <div
                  key={i}
                  className="border border-[#E5E7EB] p-2.5 rounded flex flex-col gap-2.5"
                >
                  <div className="flex flex-col gap-[5px]">
                    <div className="font-semibold">{metric.name}</div>
                    <div className="font-roboto font-medium text-[24px] leading-[32px]">
                      {metric.current}/{metric.maximum}
                    </div>
                    <ProgressBar
                      percentage={(metric.current / metric.maximum) * 100}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[1px] bg-[#E5E7EB]" />
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Payment method
            </div>
            <div className="flex items-center gap-2.5"></div>
          </div>
          <div className="h-[1px] bg-[#E5E7EB]" />
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Invoice history
            </div>

            <Table
              rowsData={invoiceHistory}
              headings={[
                <div key="date" className="px-5 py-[10px] select-none">
                  Date
                </div>,
                <div key="plan" className="px-5 py-[10px] select-none">
                  Plan
                </div>,
                <div key="price" className="px-5 py-[10px] select-none">
                  Price
                </div>,
                <div key="status" className="px-5 py-[10px] select-none">
                  Status
                </div>,
                <div
                  key="download"
                  className="px-5 py-[10px] select-none"
                ></div>,
              ]}
              rows={invoiceHistory.map((item) => [
                <div>{format(new Date(item.date), "MM/dd/yyyy HH:mm")}</div>,
                <div>{item.plan}</div>,
                <div>${item.price}</div>,
                <div>
                  <div
                    className={`w-fit rounded-[14px] px-2.5 py-[2px] ${
                      invoiceStatusToBadgeClassNamesMap[item.status]
                    }`}
                  >
                    {capitalize(item.status)}
                  </div>
                </div>,
                <div>
                  <Button type={ButtonType.SECONDARY} onClick={() => {}}>
                    Download
                  </Button>
                </div>,
              ])}
            />
          </div>
        </div>
      </div>

      <UpgradePlanAlert
        isOpen={isUpgradePlanAlertOpen}
        onClose={() => setIsUpgradePlanAlertOpen(false)}
        onUpgrade={() => {
          setIsUpgradePlanAlertOpen(false);
        }}
      />
    </div>
  );
};

export default Billing;
