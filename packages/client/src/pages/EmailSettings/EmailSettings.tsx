import { AxiosError } from "axios";
import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2/Select";
import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import MailgunSettings from "./components/MailgunSettings";
import SendgridSettings from "./components/SendgridSettings";

export enum EmailSendingService {
  MAILGUN = "mailgun",
  SENDGRID = "sendgrid",
}

interface EmailSettingsFormData {
  mailgunAPIKey: string;
  sendingDomain: string;
  sendingName: string;
  sendingEmail: string;
  testSendingName: string;
  testSendingEmail: string;
  sendgridApiKey: string;
  sendgridFromEmail: string;
}

export interface SendingServiceSettingsProps {
  formData: EmailSettingsFormData;
  setFormData: (value: EmailSettingsFormData) => void;
}

const EmailSettings = () => {
  const navigate = useNavigate();

  const [sendingService, setSendingService] = useState(
    EmailSendingService.MAILGUN
  );
  const [formData, setFormData] = useState<EmailSettingsFormData>({
    mailgunAPIKey: "",
    sendingDomain: "",
    sendingName: "",
    sendingEmail: "",
    testSendingName: "",
    testSendingEmail: "",
    sendgridApiKey: "",
    sendgridFromEmail: "",
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
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.get({ url: "/accounts" });
        const {
          mailgunAPIKey,
          sendingDomain,
          sendingName,
          sendingEmail,
          testSendingEmail,
          testSendingName,
          emailProvider: provider,
          verified,
          sendgridApiKey,
          sendgridFromEmail,
        } = data;
        setFormData({
          mailgunAPIKey: mailgunAPIKey || "",
          sendingDomain: sendingDomain || "",
          sendingName: sendingName || "",
          sendingEmail: sendingEmail || "",
          testSendingEmail: testSendingEmail || "",
          testSendingName: testSendingName || "",
          sendgridApiKey: sendgridApiKey || "",
          sendgridFromEmail: sendgridFromEmail || "",
        });
        setSendingService(provider || sendingService);
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
      const objToSend: Record<string, string> = {};
      for (const key of Object.keys(formData)) {
        if (formData[key as keyof typeof formData])
          objToSend[key] = formData[key as keyof typeof formData];
      }
      await ApiService.patch({
        url: "/accounts",
        options: { ...objToSend, emailProvider: sendingService },
      });
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
      ? formData.mailgunAPIKey &&
          formData.sendingDomain &&
          formData.sendingEmail &&
          formData.sendingName
      : sendingService === EmailSendingService.SENDGRID
      ? formData.sendgridApiKey && formData.sendgridFromEmail
      : false
  );

  return (
    <div className="p-[20px] flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-[20px]">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Email
          </div>
        </div>

        <div className="bg-white p-[20px] flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[5px]">
            <div>Sending service</div>
            <Select
              options={[
                { key: EmailSendingService.MAILGUN, title: "Mailgun" },
                { key: EmailSendingService.SENDGRID, title: "Sendgrid" },
              ]}
              value={sendingService}
              onChange={(value) => setSendingService(value)}
            />
          </div>

          {sendingServiceToComponentMap[sendingService]}
        </div>

        {error && (
          <div className="text-[#E11D48] font-inter text-[12px] leading-[20px]">
            {error}
          </div>
        )}

        <Button
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
