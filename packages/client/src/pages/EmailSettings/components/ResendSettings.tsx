import Input from "components/Elements/Inputv2";
import React, { FC, useEffect, useState } from "react";
import { SendingServiceSettingsProps } from "../EmailSettings";
import { useAppDispatch } from "store/hooks";
import Select from "components/Elements/Selectv2";
import {
  setResendDomainsList,
  setResendSettingsPrivateApiKey,
} from "reducers/settings.reducer";

const ResendSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  const dispatch = useAppDispatch();

  const [possibleDomains, setPossibleDomains] = useState<string[]>([]);

  const callDomains = async () => {
    if (formData.resendAPIKey) {
      dispatch(setResendSettingsPrivateApiKey(formData.resendAPIKey));
      const response = await dispatch(
        setResendDomainsList(formData.resendAPIKey)
      );
      if (response?.data) {
        setPossibleDomains(
          response?.data?.map((item: { name: string }) => item.name) || []
        );
      }
    }
  };

  useEffect(() => {
    callDomains();
  }, [formData.resendAPIKey]);
  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Resend API Key</div>
        <Input
          id="resend-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.resendAPIKey}
          onChange={(value) =>
            setFormData({ ...formData, resendAPIKey: value })
          }
          type="password"
          placeholder="API Key"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Webhook Signing Secret</div>
        <Input
          id="resend-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.resendSigningSecret}
          onChange={(value) =>
            setFormData({ ...formData, resendSigningSecret: value })
          }
          type="password"
          placeholder="Signing Secret"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Domain</div>
        <Select
          id="resend-domain-select"
          options={possibleDomains.map((domain) => ({
            key: domain,
            title: domain,
          }))}
          value={formData.resendSendingDomain}
          onChange={(value) =>
            setFormData({ ...formData, resendSendingDomain: value })
          }
          placeholder="Email domain"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Sending name</div>
        <Input
          id="resend-sending-name-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.resendSendingName}
          onChange={(value) =>
            setFormData({ ...formData, resendSendingName: value })
          }
          placeholder="Display name"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <div>Sending email</div>
        <Input
          id="resend-sending-email-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.resendSendingEmail}
          onChange={(value) =>
            setFormData({ ...formData, resendSendingEmail: value })
          }
          placeholder="sender@example.com"
        />
      </div>
    </>
  );
};

export default ResendSettings;
