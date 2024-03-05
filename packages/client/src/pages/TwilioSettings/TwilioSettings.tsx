import { AxiosError } from "axios";
import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";
import Account, { WorkspaceTwilioConnection } from "types/Account";

interface TwilioFormData {
  name: string;
  sid: string;
  token: string;
  from: string;
}

const TwilioSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isCreating = useMemo(() => id === "create", [id]);

  const [isNameEditing, setIsNameEditing] = useState(false);
  const [formData, setFormData] = useState<TwilioFormData>({
    name: "Twilio SMS",
    sid: "",
    token: "",
    from: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [possibleNumbers, setPossibleNumbers] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      if (isCreating) return;

      setIsLoading(true);
      try {
        const { data } = await ApiService.get<WorkspaceTwilioConnection>({
          url: `/workspaces/channels/twilio/${id}`,
        });

        const { name, sid, token, from } = data;
        setFormData({
          name: name || formData.name,
          sid: sid || formData.sid,
          token: token || formData.token,
          from: from || formData.from,
        });
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadPossibleNumbers = async (
    smsAccountSid: string,
    smsAuthToken: string
  ) => {
    const { data } = await ApiService.get({
      url: `/sms/possible-phone-numbers?smsAccountSid=${smsAccountSid}&smsAuthToken=${smsAuthToken}`,
    });

    setPossibleNumbers(data || []);
  };

  useDebounce(
    () => {
      if (formData.sid && formData.token)
        loadPossibleNumbers(formData.sid, formData.token);
    },
    1000,
    [formData]
  );

  const handleConnect = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        await ApiService.post({
          url: "/workspaces/channels/twilio",
          options: { ...formData },
        });
      } else {
        await ApiService.patch({
          url: `/workspaces/channels/twilio/${id}`,
          options: { ...formData },
        });
      }

      navigate("/settings");
    } catch (e) {
      let message = "Unexpected error";

      if (e instanceof AxiosError)
        message = e.response?.data?.message || e.message;

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFulfilled = Boolean(formData.sid && formData.token && formData.from);

  return (
    <div className="p-5 flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          {isNameEditing ? (
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="name"
              onBlur={() => setIsNameEditing(false)}
            />
          ) : (
            <div className="text-[20px] font-semibold leading-[28px] text-black">
              {formData.name}
            </div>
          )}

          {!isNameEditing && (
            <div
              className="cursor-pointer"
              onClick={() => setIsNameEditing(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_2222_57368)">
                  <path
                    d="M3.45921 12.284C3.49492 12.284 3.53064 12.2805 3.56635 12.2751L6.56992 11.7483C6.60564 11.7412 6.63957 11.7251 6.66457 11.6983L14.2342 4.12868C14.2508 4.11216 14.2639 4.09254 14.2729 4.07094C14.2818 4.04934 14.2864 4.02618 14.2864 4.00279C14.2864 3.9794 14.2818 3.95625 14.2729 3.93464C14.2639 3.91304 14.2508 3.89342 14.2342 3.8769L11.2664 0.907254C11.2324 0.873326 11.1878 0.855469 11.1396 0.855469C11.0914 0.855469 11.0467 0.873326 11.0128 0.907254L3.44314 8.4769C3.41635 8.50368 3.40028 8.53583 3.39314 8.57154L2.86635 11.5751C2.84898 11.6708 2.85519 11.7692 2.88443 11.862C2.91368 11.9547 2.96509 12.0389 3.03421 12.1073C3.15207 12.2215 3.30028 12.284 3.45921 12.284ZM4.66278 9.16975L11.1396 2.69475L12.4485 4.00368L5.97171 10.4787L4.38421 10.759L4.66278 9.16975ZM14.5717 13.784H1.42885C1.11278 13.784 0.857422 14.0394 0.857422 14.3555V14.9983C0.857422 15.0769 0.921708 15.1412 1.00028 15.1412H15.0003C15.0789 15.1412 15.1431 15.0769 15.1431 14.9983V14.3555C15.1431 14.0394 14.8878 13.784 14.5717 13.784Z"
                    fill="#6366F1"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_2222_57368">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          )}
        </div>

        <div className="bg-white p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-[5px]">
            <div>Twilio account SID</div>
            <Input
              id="twilio-account-sid-input"
              type="password"
              wrapperClassName="!w-full"
              className="w-full"
              value={formData.sid}
              onChange={(value) => setFormData({ ...formData, sid: value })}
              placeholder="Key number"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <div>Twilio auth token</div>
            <Input
              id="twilio-auth-token-input"
              type="password"
              wrapperClassName="!w-full"
              className="w-full"
              value={formData.token}
              onChange={(value) => setFormData({ ...formData, token: value })}
              placeholder="Auth Token"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <div>SMS from</div>
            <Select
              id="twilio-sms-from-select"
              options={possibleNumbers.map((number) => ({
                key: number,
                title: number,
              }))}
              value={formData.from}
              onChange={(value) => setFormData({ ...formData, from: value })}
              placeholder="Select sending number"
            />
          </div>
        </div>

        {error && (
          <div className="text-[#E11D48] font-inter text-[12px] leading-5">
            {error}
          </div>
        )}

        <Button
          id="twilio-connect-button"
          type={ButtonType.PRIMARY}
          onClick={handleConnect}
          className="w-fit"
          disabled={isSaving || !isFulfilled}
        >
          {isSaving ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </div>
  );
};

export default TwilioSettings;
