import React, { useState } from "react";
import Header from "components/Header";
import Card from "components/Cards/Card";
import CustomStepper from "./components/CustomStepper";

const EmailConfig = () => {
  const [activeStep] = useState<number>(0);

  return (
    <div className="relative flex flex-column h-[100vh] bg-[#E5E5E5] pt-[154px]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <Card
          sx={{
            padding: "22px",
            width: "100%",
            maxWidth: "930px",
          }}
        >
          <h3 className="text-black">Email Configuration</h3>
          {/* Add Respective component here */}
        </Card>
        <Card
          sx={{
            width: "100%",
            maxWidth: "465px",
            maxHeight: "359px",
          }}
        >
          <div className="p-[20px] flex flex-col gap-[16px]">
            <h3 className="text-black">Your Setup List</h3>
            <p className="text-[#6B7280]" color={"#6B7280"}>
              Get your account ready to send automated message that people like
              to receive.
            </p>
          </div>
          <CustomStepper activeStep={activeStep} />
        </Card>
      </div>
    </div>
  );
};

export default EmailConfig;
