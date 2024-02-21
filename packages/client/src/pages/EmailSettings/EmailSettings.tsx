import { AxiosError } from "axios";
import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2/Select";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import Account, { WorkspaceEmailConnection } from "types/Account";
import MailgunSettings from "./components/MailgunSettings";
import SendgridSettings from "./components/SendgridSettings";
import ResendSettings from "./components/ResendSettings";
import { useParams } from "react-router-dom";

export enum EmailSendingService {
  MAILGUN = "mailgun",
  SENDGRID = "sendgrid",
  RESEND = "resend",
}

interface EmailSettingsFormData {
  name: string;
  apiKey: string;
  sendingDomain: string;
  sendingOptions: {
    sendingEmail: string;
    sendingName?: string;
  }[];
  signingSecret: string;
}

export interface SendingServiceSettingsProps {
  formData: EmailSettingsFormData;
  setFormData: (value: EmailSettingsFormData) => void;
}

const EmailSettings = () => {
  const navigate = useNavigate();
  const { service, id } = useParams();

  const isCreating = useMemo(() => id === "create", [id]);

  const isLockedService = useMemo(
    () => Object.values(EmailSendingService).includes(service),
    [service]
  );

  const [sendingService, setSendingService] = useState<EmailSendingService>(
    isLockedService ? service : EmailSendingService.MAILGUN
  );
  const [formData, setFormData] = useState<EmailSettingsFormData>({
    name: "",
    apiKey: "",
    sendingDomain: "",
    sendingOptions: [],
    signingSecret: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const sendingServiceToComponentMap: Record<EmailSendingService, ReactNode> = {
    [EmailSendingService.MAILGUN]: (
      <MailgunSettings formData={formData} setFormData={setFormData} />
    ),
    [EmailSendingService.SENDGRID]: (
      <SendgridSettings formData={formData} setFormData={setFormData} />
    ),
    [EmailSendingService.RESEND]: (
      <ResendSettings formData={formData} setFormData={setFormData} />
    ),
  };

  useEffect(() => {
    (async () => {
      if (isCreating) return;

      setIsLoading(true);
      try {
        const { data } = await ApiService.get<WorkspaceEmailConnection>({
          url: `/workspaces/channels/${service}/${id}`,
        });

        setFormData({ ...formData, ...data });
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const objToSend: Record<string, unknown> = {};
      for (const key of Object.keys(formData)) {
        if (formData[key as keyof typeof formData])
          objToSend[key] = formData[key as keyof typeof formData];
      }

      if (isCreating) {
        await ApiService.post({
          url: `/workspaces/channels/${service}`,
          options: { ...objToSend },
        });
      } else {
        await ApiService.patch({
          url: `/workspaces/channels/${service}/${id}`,
          options: { ...objToSend },
        });
      }

      navigate("/settings");
    } catch (e) {
      let message = "Unexpected error";
      if (e instanceof AxiosError) message = e.response?.data?.message;
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isError = Boolean(error);
  const isFulfilled = Boolean(
    sendingService === EmailSendingService.MAILGUN
      ? formData.apiKey && formData.sendingDomain
      : sendingService === EmailSendingService.SENDGRID
      ? formData.apiKey
      : sendingService === EmailSendingService.RESEND
      ? formData.apiKey && formData.signingSecret && formData.sendingDomain
      : false
  );

  return (
    <div className="p-5 flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Email
          </div>
        </div>

        <div className="bg-white p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-[5px]">
            <div>Sending service</div>
            <Select
              id="sending-service-select"
              options={[
                { key: EmailSendingService.MAILGUN, title: "Mailgun" },
                { key: EmailSendingService.SENDGRID, title: "Sendgrid" },
                { key: EmailSendingService.RESEND, title: "Resend" },
              ]}
              value={sendingService}
              onChange={(value) => setSendingService(value)}
              disabled={isLockedService}
            />
          </div>

          {sendingServiceToComponentMap[sendingService]}
        </div>

        {error && (
          <div className="text-[#E11D48] font-inter text-[12px] leading-5">
            {error}
          </div>
        )}

        <Button
          id="save-email-settings-button"
          type={ButtonType.PRIMARY}
          onClick={handleSave}
          className="w-fit"
          disabled={isSaving || isError || !isFulfilled}
        >
          {isSaving ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </div>
  );
};

export default EmailSettings;
