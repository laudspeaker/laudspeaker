import Input from "components/Elements/Inputv2";
import React, { FC } from "react";
import { SendingServiceSettingsProps } from "../EmailSettings";

const MailgunSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Mailgun API Key</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.mailgunAPIKey}
          onChange={(value) =>
            setFormData({ ...formData, mailgunAPIKey: value })
          }
          placeholder="Key number"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Domain</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendingDomain}
          onChange={(value) =>
            setFormData({ ...formData, sendingDomain: value })
          }
          placeholder="Email domain"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Sending name</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendingName}
          onChange={(value) => setFormData({ ...formData, sendingName: value })}
          placeholder="Display name"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Sending email</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendingEmail}
          onChange={(value) =>
            setFormData({ ...formData, sendingEmail: value })
          }
          placeholder="sender@example.com"
        />
      </div>
    </>
  );
};

export default MailgunSettings;
