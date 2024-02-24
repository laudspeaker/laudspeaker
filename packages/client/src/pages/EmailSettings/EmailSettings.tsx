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
import Input from "components/Elements/Inputv2";

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
    name: `Email (${service})`,
    apiKey: "",
    sendingDomain: "",
    sendingOptions: [],
    signingSecret: "",
  });
  const [isNameEditing, setIsNameEditing] = useState(false);
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
