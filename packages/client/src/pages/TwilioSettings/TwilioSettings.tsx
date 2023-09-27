import { AxiosError } from "axios";
import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";

interface TwilioFormData {
  smsAccountSid: string;
  smsAuthToken: string;
  smsFrom: string;
}

const TwilioSettings = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TwilioFormData>({
    smsAccountSid: "",
    smsAuthToken: "",
    smsFrom: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [possibleNumbers, setPossibleNumbers] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.get({ url: "/accounts" });
        const { smsAccountSid, smsAuthToken, smsFrom } = data;
        setFormData({
          smsAccountSid: smsAccountSid || "",
          smsAuthToken: smsAuthToken || "",
          smsFrom: smsFrom || "",
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
      if (formData.smsAccountSid && formData.smsAuthToken)
        loadPossibleNumbers(formData.smsAccountSid, formData.smsAuthToken);
    },
    1000,
    [formData]
  );

  const handleConnect = async () => {
    setIsSaving(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: { ...formData },
      });
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

  const isFulfilled = Boolean(
    formData.smsAccountSid && formData.smsAuthToken && formData.smsFrom
  );

  return (
    <div className="p-[20px] flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-[20px]">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Twilio SMS
          </div>
        </div>

        <div className="bg-white p-[20px] flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[5px]">
            <div>Twilio account SID</div>
            <Input
              id="twilio-account-sid-input"
              wrapperClassName="!w-full"
              className="w-full"
              type="password"
              value={formData.smsAccountSid}
              onChange={(value) =>
                setFormData({ ...formData, smsAccountSid: value })
              }
              placeholder="Key number"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <div>Twilio auth token</div>
            <Input
              id="twilio-auth-token-input"
              wrapperClassName="!w-full"
              className="w-full"
              type="password"
              value={formData.smsAuthToken}
              onChange={(value) =>
                setFormData({ ...formData, smsAuthToken: value })
              }
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
              value={formData.smsFrom}
              onChange={(value) => setFormData({ ...formData, smsFrom: value })}
              placeholder="Select sending number"
            />
          </div>
        </div>

        {error && (
          <div className="text-[#E11D48] font-inter text-[12px] leading-[20px]">
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
