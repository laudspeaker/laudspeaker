import React, { useState } from "react";
import { Box, FormControl, Typography } from "@mui/material";
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
    <Box
      gap={"43px 0px"}
      display="flex"
      flexDirection="column"
      marginTop="43px"
    >
      <FormControl variant="standard">
        <Input
          label="Private API Key"
          value={sendGridConfigForm.apiKey}
          placeholder={"Enter your Private API Key"}
          name="apiKey"
          id="apiKey"
          type="password"
          fullWidth
          onChange={handleSendGridConfigFormChange}
          labelShrink
          size="small"
        />
      </FormControl>
      <GenericButton
        variant="contained"
        onClick={handleSubmit}
        fullWidth
        sx={{
          maxWidth: "277px",
          "background-image":
            "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
          borderRadius: "8px",
        }}
      >
        <Typography variant="h4" color="#FFFFFF">
          Next
        </Typography>
      </GenericButton>
    </Box>
  );
};

export default SendGridConfigure;
