import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2/Select";
import React, { ReactNode, useState } from "react";
import MailgunSettings from "./components/MailgunSettings";
import SendgridSettings from "./components/SendgridSettings";

export enum EmailSendingService {
  MAILGUN,
  SENDGRID,
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

  const sendingServiceToComponentMap: Record<EmailSendingService, ReactNode> = {
    [EmailSendingService.MAILGUN]: (
      <MailgunSettings formData={formData} setFormData={setFormData} />
    ),
    [EmailSendingService.SENDGRID]: (
      <SendgridSettings formData={formData} setFormData={setFormData} />
    ),
  };

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

        <Button
          type={ButtonType.SECONDARY}
          onClick={() => {}}
          className="w-fit"
          disabled
        >
          Connect
        </Button>
      </div>
    </div>
  );
};

export default EmailSettings;
