import React, { useState } from "react";
import { FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";

export interface ISendGridConfigureForm {
  apiKey: string;
}

const SendGridConfigure = () => {
  const [sendGridConfigForm, setSendGridConfigForm] =
    useState<ISendGridConfigureForm>({
      apiKey: "",
    });

  const handleSendGridConfigFormChange = (e: any) => {
    setSendGridConfigForm({
      ...sendGridConfigForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
  };

  return (
    <div className="gap-[43px_0px] flex flex-col mt-[43px]">
      <FormControl variant="standard">
        <Input
          label="Private API Key"
          value={sendGridConfigForm.apiKey}
          placeholder={"Enter your Private API Key"}
          name="apiKey"
          id="apiKey"
          type="password"
          onChange={handleSendGridConfigFormChange}
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

export default SendGridConfigure;
