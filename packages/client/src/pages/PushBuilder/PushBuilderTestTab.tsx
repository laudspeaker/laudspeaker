import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2";
import ApiConfig from "constants/api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import { PushBuilderData } from "./PushBuilderContent";

export interface PushBuilderTestTabProps {
  data: PushBuilderData;
  onChange: (data: PushBuilderData) => void;
}

interface CustomerResponse {
  id: string;
  email: string;
  phone: string;
}

const PushBuilderTestTab = ({ data, onChange }: PushBuilderTestTabProps) => {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<
    CustomerResponse | undefined
  >(undefined);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleSearchForTest = async () => {
    setIsLoading(true);
    try {
      const { data: ResData } = await ApiService.get<{
        data: CustomerResponse[];
        totalPages: number;
      }>({
        url: `${ApiConfig.searchCustomersForTest}?take=10&skip=${skip}&search=${search}`,
      });
      if (skip === 0) setCustomers(ResData.data);
      else setCustomers((prev) => [...prev, ...ResData.data]);

      setTotalPages(ResData.totalPages);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    handleSearchForTest();
  }, [skip]);

  useDebounce(
    () => {
      setSkip(0);
      handleSearchForTest();
    },
    300,
    [search]
  );

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
          * Customer should have <b>device_token_android</b> property to test{" "}
          <b>Android</b> notification and <b>device_token_ios</b> property to
          test <b>IOS</b> notification otherwise they won't send.
        </div>
        <Select
          placeholder={
            selectedCustomer?.id
              ? `ID: ${selectedCustomer.id}`
              : "Search user’s id, email or phone number"
          }
          value={selectedCustomer?.id}
          className="mb-[10px] max-w-[800px]"
          isLoading={isLoading}
          noDataPlaceholder={search ? "No matching users" : "No users"}
          searchPlaceholder="Search"
          onScrollToEnd={() => {
            if (skip / 10 + 1 <= totalPages) setSkip((prev) => prev + 10);
          }}
          searchValue={search}
          onSearchValueChange={(val) => {
            setSearch(val);
          }}
          options={customers.map((el) => ({
            key: el.id,
            title: "ID: " + el.id,
            additionalData: el,
          }))}
          panelClassName="!max-w-[800px] w-full bg-white"
          renderCustomOption={(props, additionalData) => {
            return (
              <div
                {...props}
                className={`${props.className} !max-w-[800px] w-full hover:!bg-[#EEF2FF]`}
              >
                <div className="text-[#111827] font-semibold font-inter mb-[5px]">
                  ID: {additionalData?.id}
                </div>
                <div className="flex items-center">
                  <div className="flex items-center mr-[10px] gap-[4px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M0.625 3.61255V7.18755C0.625 7.51907 0.756696 7.83701 0.991117 8.07143C1.22554 8.30585 1.54348 8.43755 1.875 8.43755H8.125C8.45652 8.43755 8.77446 8.30585 9.00888 8.07143C9.2433 7.83701 9.375 7.51907 9.375 7.18755V3.61255L5.655 5.9013C5.45802 6.02249 5.23128 6.08665 5 6.08665C4.76872 6.08665 4.54198 6.02249 4.345 5.9013L0.625 3.61255Z"
                        fill="#4B5563"
                      />
                      <path
                        d="M9.375 2.87833V2.8125C9.375 2.48098 9.2433 2.16304 9.00888 1.92862C8.77446 1.6942 8.45652 1.5625 8.125 1.5625H1.875C1.54348 1.5625 1.22554 1.6942 0.991117 1.92862C0.756696 2.16304 0.625 2.48098 0.625 2.8125V2.87833L4.6725 5.36917C4.77099 5.42976 4.88436 5.46184 5 5.46184C5.11564 5.46184 5.22901 5.42976 5.3275 5.36917L9.375 2.87833Z"
                        fill="#4B5563"
                      />
                    </svg>
                    <span className="text-[#4B5563] text-[14px] font-inter leading-[22px]">
                      {additionalData?.email || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-[4px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_77_12346)">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M0.625244 1.875C0.625244 1.54348 0.75694 1.22554 0.991361 0.991117C1.22578 0.756696 1.54372 0.625 1.87524 0.625H2.44691C2.80524 0.625 3.11774 0.869167 3.20483 1.21667L3.66524 3.05958C3.70255 3.20875 3.69502 3.36561 3.64358 3.51051C3.59214 3.65541 3.49909 3.78191 3.37608 3.87417L2.83733 4.27833C2.78108 4.32042 2.76899 4.38208 2.78483 4.425C3.01999 5.06452 3.39133 5.64529 3.87314 6.12711C4.35495 6.60892 4.93572 6.98026 5.57524 7.21542C5.61816 7.23125 5.67941 7.21917 5.72191 7.16292L6.12608 6.62417C6.21833 6.50116 6.34483 6.4081 6.48973 6.35666C6.63464 6.30523 6.79149 6.29769 6.94066 6.335L8.78358 6.79542C9.13108 6.8825 9.37524 7.195 9.37524 7.55375V8.125C9.37524 8.45652 9.24355 8.77446 9.00913 9.00888C8.77471 9.2433 8.45676 9.375 8.12524 9.375H7.18774C3.56358 9.375 0.625244 6.43667 0.625244 2.8125V1.875Z"
                          fill="#4B5563"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_77_12346">
                          <rect width="10" height="10" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span className="text-[#4B5563] text-[14px] font-inter leading-[22px]">
                      {additionalData?.phone || "-"}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
          onChange={(key) => {
            const customer = customers.find((el) => el.id === key);
            if (customer) {
              setSelectedCustomer(customer);
            }
          }}
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
