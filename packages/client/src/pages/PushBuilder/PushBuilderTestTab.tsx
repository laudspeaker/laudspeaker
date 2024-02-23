import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { PushBuilderData } from "./PushBuilderContent";
import type { CustomerResponse } from "./SearchUser";
import { SearchUser } from "./SearchUser";

export interface PushBuilderTestTabProps {
  data: PushBuilderData;
  onChange: (data: PushBuilderData) => void;
}

const PushBuilderTestTab = ({ data, onChange }: PushBuilderTestTabProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse>();
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleTest = async () => {
    if (!selectedCustomer) return;

    setIsTestLoading(true);
    try {
      await ApiService.post({
        url: "/events/sendTestPushByCustomer",
        options: { customerId: selectedCustomer.id, pushObject: data },
      });
    } catch (error) {
      if (error instanceof AxiosError)
        toast.error(error.response?.data?.message);
      else toast.error("Unhandled request error");
    }
    setIsTestLoading(false);
  };

  return (
    <div className="max-h-[calc(100vh-106px)] h-full w-full p-5">
      <div
        className={`${
          isTestLoading && "opacity-70 animate-pulse pointer-events-none"
        } w-full pb-[40px] pt-[20px] px-5 bg-white`}
      >
        <div className="font-inter text-base font-semibold text-[#111827]">
          Send / Preview a test push
        </div>
        <div className="font-inter text-sm text-[#111827]">
          Select an individual user
        </div>
        <div className="font-inter text-xs text-[#111827] mt-1 mb-2 opacity-70">
          * Customer should have <b>androidDeviceToken</b> property to test{" "}
          <b>Android</b> notification and <b>iosDeviceToken</b> property to test{" "}
          <b>IOS</b> notification otherwise they won't send.
        </div>
        <SearchUser
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
        />
        <div className="flex">
          <Button
            type={ButtonType.PRIMARY}
            onClick={handleTest}
            className="mr-[10px]"
            disabled={!selectedCustomer || isTestLoading}
          >
            Send test
          </Button>
          <Button type={ButtonType.SECONDARY} onClick={() => {}} disabled>
            Preview as user
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushBuilderTestTab;
