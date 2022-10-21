import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import { Input, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setSettingData, updateUserData } from "reducers/settings";

function MailgunConfigurationTwo() {
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [defaultName, setDefaultName] = useState<string>(
    settings.defaultName || ""
  );
  const [defaultEmail, setDefaultEmail] = useState<string>(
    settings.defaultEmail || ""
  );
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const navigate = useNavigate();

  const moveToNetworkConfiguration = () => {
    navigate("/settings/network-configuration");
  };

  const handleNextButtonClick = async () => {
    await dispatch(
      updateUserData({
        mailgunAPIKey: settings.privateApiKey,
        sendingEmail: settings.defaultEmail,
        sendingDomain: settings.domainName,
        sendingName: settings.defaultName,
        finishedOnboarding: (settings.channel as string[])[0],
      })
    );
    (settings.channel as string[]).shift();
    dispatch(setSettingData({ ...settings, channel: settings.channel }));
    moveToNetworkConfiguration();
  };

  const inputEmailDomain = `@${settings.domainName.substring(
    0,
    3
  )}*****${settings.domainName.substring(settings.domainName.length - 7)}`;

  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="justify-around flex m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Email Configuration
          </h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={defaultName}
                label="Default From Name"
                placeholder={"John smith"}
                name="name"
                id="name"
                style={{
                  maxWidth: "530px",
                  padding: "15px 16px 15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: "16px",
                }}
                onChange={(e) => {
                  setDefaultName(e.target.value);
                  handleInputChange("defaultName", e.target.value);
                }}
                labelClass="!text-[16px]"
              />
            </FormControl>
          </Grid>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={defaultEmail + inputEmailDomain}
                label="Default From Email"
                placeholder={"smith"}
                name="name"
                id="name"
                style={{
                  maxWidth: "530px",
                  padding: "15px 16px 15px 16px",
                  background: "#fff",
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: "16px",
                  border: "1px solid #D1D5DB",
                }}
                onChange={(e) => {
                  if (!e.target.value.endsWith(inputEmailDomain)) return;
                  const newValue = e.target.value.replace(inputEmailDomain, "");
                  setDefaultEmail(newValue);
                  handleInputChange("defaultEmail", newValue);
                }}
                labelClass="!text-[16px]"
              />
            </FormControl>
          </Grid>
          <div className="flex mt-[40px] justify-start">
            <GenericButton
              onClick={handleNextButtonClick}
              style={{
                maxWidth: "200px",
              }}
            >
              Next
            </GenericButton>
          </div>
        </div>
        <div className="bg-white rounded-3xl w-full max-w-[465px] max-h-[auto]">
          <div className="p-[20px] flex flex-col gap-[16px]">
            <h3 className="text-black font-[Poppins] text-[24px] font-bold">
              Your Setup List
            </h3>
            <p className="text-[#6B7280]">
              You're only a few steps away from your first message!
            </p>
          </div>
          <CustomStepper activeStep={2} />
        </div>
      </div>
    </div>
  );
}

export default MailgunConfigurationTwo;
