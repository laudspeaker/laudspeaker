import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import Drawer from "components/Drawer";
import Header from "components/Header";
import Card from "components/Cards/Card";
import CustomStepper from "./components/CustomStepper";

const EmailConfig = () => {
  const [activeStep] = useState<number>(0);

  return (
    <Box
      sx={{
        paddingLeft: "154px",
        position: "relative",
        backgroundColor: "#E5E5E5",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        "& .MuiTypography-root": {
          fontFamily: "Inter",
        },
        "& .MuiInputBase-input": {
          background: "#fff",
          border: "1px solid #D1D5DB",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: "16px",
          padding: "12px 16px",
        },
        "& .MuiInputLabel-root": {
          fontSize: "16px",
          fontFamily: "Inter",
        },
        "& .MuiFormControl-root": {
          maxWidth: "529px",
        },
      }}
    >
      <Header />
      <Box
        justifyContent={"space-around"}
        display={"flex"}
        // paddingTop={"72px"}
        margin={"72px 50px 72px 50px"}
        gap={"30px"}
      >
        <Card
          sx={{
            padding: "22px",
            width: "100%",
            maxWidth: "930px",
          }}
        >
          <Typography variant="h3" color="#000000">
            Email Configuration
          </Typography>
          {/* Add Respective component here */}
        </Card>
        <Card
          sx={{
            width: "100%",
            maxWidth: "465px",
            maxHeight: "359px",
          }}
        >
          <Box
            padding="20px"
            display={"flex"}
            flexDirection={"column"}
            gap="16px"
          >
            <Typography variant="h3" color="#000000">
              Your Setup List
            </Typography>
            <Typography variant="body1" color={"#6B7280"}>
              Get your account ready to send automated message that people like
              to receive.
            </Typography>
          </Box>
          <CustomStepper activeStep={activeStep} />
        </Card>
      </Box>
    </Box>
  );
};

export default EmailConfig;
