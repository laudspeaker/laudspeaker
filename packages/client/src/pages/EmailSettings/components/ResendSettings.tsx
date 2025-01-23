import Input from "components/Elements/Inputv2";
import React, { FC, useEffect, useState } from "react";
import { SendingServiceSettingsProps } from "../EmailSettings";
import { useAppDispatch } from "store/hooks";
import Select from "components/Elements/Selectv2";
import {
  setResendDomainsList,
  setResendSettingsPrivateApiKey,
} from "reducers/settings.reducer";
import TrashIcon from "assets/icons/TrashIcon";
import Button, { ButtonType } from "components/Elements/Buttonv2";

const ResendSettings: FC<SendingServiceSettingsProps> = ({
  formData,
  setFormData,
}) => {
  const dispatch = useAppDispatch();

  const [possibleDomains, setPossibleDomains] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ sendingEmail: string[] }>({
    sendingEmail: [],
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const updateSendingEmail = (value: string, index: number) => {
    const newOptions = [...formData.sendingOptions];
    newOptions[index].sendingEmail = value;
    setFormData({ ...formData, sendingOptions: newOptions });

    // Real-time validation
    const newErrors = [...errors.sendingEmail];
    if (!value) {
      newErrors[index] = "Sending email is required.";
    } else if (!validateEmail(value)) {
      newErrors[index] =
        "Sending email must be a valid email format (example@domain).";
    } else {
      newErrors[index] = ""; // Clear error if valid
    }
    setErrors({ sendingEmail: newErrors });
  };

  const callDomains = async () => {
    if (formData.apiKey) {
      dispatch(setResendSettingsPrivateApiKey(formData.apiKey));
      const response = await dispatch(setResendDomainsList(formData.apiKey));
      if (response?.data) {
        setPossibleDomains(
          response?.data?.map((item: { name: string }) => item.name) || []
        );
      }
    }
  };

  useEffect(() => {
    callDomains();
  }, [formData.apiKey]);

  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Resend API Key</div>
        <Input
          id="resend-api-key-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.apiKey}
          onChange={(value) => setFormData({ ...formData, apiKey: value })}
          type="password"
          placeholder="API Key"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <div>Webhook Signing Secret</div>
        <Input
          id="resend-signing-secret-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.signingSecret}
          onChange={(value) =>
            setFormData({ ...formData, signingSecret: value })
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
          value={formData.sendingDomain}
          onChange={(value) =>
            setFormData({ ...formData, sendingDomain: value })
          }
          placeholder="Email domain"
        />
      </div>
      {formData.sendingOptions.map((option, i) => (
        <div className="flex items-center gap-2.5" key={`sending-${i}`}>
          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending email</div>
            <Input
              id={`sending-email-${i}`}
              wrapperClassName="!w-full"
              className="w-full"
              value={option.sendingEmail}
              onChange={(value) => updateSendingEmail(value, i)}
              placeholder="example@domain"
            />
            {errors.sendingEmail[i] && (
              <div className="text-red-500 text-sm">
                {errors.sendingEmail[i]}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[5px] w-full">
            <div>Sending name</div>
            <Input
              id={`sending-name-${i}`}
              wrapperClassName="!w-full"
              className="w-full"
              value={option.sendingName || ""}
              onChange={(value) => {
                formData.sendingOptions[i].sendingName = value;
                setFormData({ ...formData });
              }}
              placeholder="Sending name"
            />
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              formData.sendingOptions.splice(i, 1);
              setFormData({ ...formData });
              const newErrors = [...errors.sendingEmail];
              newErrors.splice(i, 1); // Remove error for the deleted field
              setErrors({ sendingEmail: newErrors });
            }}
          >
            <TrashIcon />
          </div>
        </div>
      ))}
      <Button
        type={ButtonType.SECONDARY}
        onClick={() => {
          setFormData({
            ...formData,
            sendingOptions: [
              ...formData.sendingOptions,
              { sendingEmail: "", sendingName: "" },
            ],
          });
          setErrors({ sendingEmail: [...errors.sendingEmail, ""] }); // Add placeholder for new option's error
        }}
      >
        Add sending option
      </Button>
      {formData.replyToOptions && formData.replyToOptions.length !== 0 && (
        <div className="h-[1px] w-full bg-black" />
      )}
      {formData.replyToOptions?.map((option, i) => (
        <div className="flex items-center gap-2.5" key={`replyto-${i}`}>
          <div className="flex flex-col gap-[5px] w-full">
            <div>Reply-to email</div>
            <Input
              id="sendgrid-replyto-email"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.replyToEmail ?? ""}
              onChange={(value) => {
                if (formData.replyToOptions)
                  formData.replyToOptions[i].replyToEmail = value;
                setFormData({ ...formData });
              }}
              placeholder="Reply-to email"
            />
          </div>

          <div className="flex flex-col gap-[5px] w-full">
            <div>Reply-to name</div>
            <Input
              id="sendgrid-replyto-name"
              wrapperClassName="!w-full"
              className="w-full"
              value={option.replyToName || ""}
              onChange={(value) => {
                if (formData.replyToOptions)
                  formData.replyToOptions[i].replyToName = value;
                setFormData({ ...formData });
              }}
              placeholder="Reply-to name"
            />
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              formData.replyToOptions?.splice(i, 1);
              setFormData({ ...formData });
            }}
          >
            <TrashIcon />
          </div>
        </div>
      ))}
      <Button
        type={ButtonType.SECONDARY}
        onClick={() =>
          setFormData({
            ...formData,
            replyToOptions: [
              ...(formData.replyToOptions || []),
              { replyToEmail: "", replyToName: "" },
            ],
          })
        }
      >
        Add reply-to option
      </Button>{" "}
    </>
  );
};

export default ResendSettings;
