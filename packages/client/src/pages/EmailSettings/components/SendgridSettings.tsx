import Input from "components/Elements/Inputv2";
import React, { FC } from "react";
import { SendingServiceSettingsProps } from "../EmailSettings";

const SendgridSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>SendGrid API Key</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendgridApiKey}
          onChange={(value) =>
            setFormData({ ...formData, sendgridApiKey: value })
          }
          placeholder="Key number"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>SendGrid email</div>
        <Input
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.sendgridFromEmail}
          onChange={(value) =>
            setFormData({ ...formData, sendgridFromEmail: value })
          }
          placeholder="sender@example.com"
        />
      </div>
    </>
  );
};

export default SendgridSettings;
