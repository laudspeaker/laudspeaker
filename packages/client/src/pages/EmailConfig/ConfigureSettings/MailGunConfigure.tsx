import React, { useState } from "react";
import { FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";

export interface IMailGunConfigureForm {
  domain: string;
  smtp: string;
  password: string;
  apiKey: string;
}

const MailGunConfigure = () => {
  const [mailGunConfigForm, setMailGunConfigForm] =
    useState<IMailGunConfigureForm>({
      domain: "",
      smtp: "",
      password: "",
      apiKey: "",
    });

  const handleMailGunConfigFormChange = (e: any) => {
    setMailGunConfigForm({
      ...mailGunConfigForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
  };

  return (
    <div className="gap-[41px_0px] flex flex-col mt-[26px]">
      <FormControl variant="standard">
        <Input
          label="Domain"
          value={mailGunConfigForm.domain}
          placeholder={"Enter your Domain"}
          name="domain"
          id="domain"
          fullWidth
          onChange={handleMailGunConfigFormChange}
        />
      </FormControl>
      <FormControl variant="standard">
        <Input
          label="Default SMTP"
          value={mailGunConfigForm.smtp}
          placeholder={"Enter your Default SMTP"}
          name="smtp"
          id="smtp"
          fullWidth
          onChange={handleMailGunConfigFormChange}
        />
      </FormControl>
      <FormControl variant="standard">
        <Input
          label="Default Password"
          value={mailGunConfigForm.password}
          placeholder={"Enter your Default Password"}
          name="password"
          id="password"
          type="password"
          onChange={handleMailGunConfigFormChange}
        />
      </FormControl>
      <FormControl variant="standard">
        <Input
          label="Private API Key"
          value={mailGunConfigForm.apiKey}
          placeholder={"Enter your Private API Key"}
          name="apiKey"
          id="apiKey"
          type="password"
          onChange={handleMailGunConfigFormChange}
        />
      </FormControl>
      <GenericButton
        onClick={handleSubmit}
        style={{
          maxWidth: "277px",
          borderRadius: "8px",
        }}
      >
        <h4 className="text-white">Next</h4>
      </GenericButton>
    </div>
  );
};

export default MailGunConfigure;
