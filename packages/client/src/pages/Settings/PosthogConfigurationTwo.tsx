import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import Drawer from "components/Drawer";
import { Input, Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ListItem from "./components/ListItem";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import {
  setSettingData,
  setSettingsPrivateApiKey,
  setDomainsList,
  updateUserData,
} from "reducers/settings";

function PosthogConfigurationTwo() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);

  const [phEmail, setProjectId] = useState<string>(settings.phEmail || "");
  const [phSms, setPrivateApiKey] = useState<string>(settings.phSms || "");
  //const [phHostUrl, setPhHostUrl] = useState<string>(settings.phHostUrl || "");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToAdditionalSettingsTwo = async () => {
    console.log("cliked next in move to ad ph");
    console.log("phSms", phSms);
    console.log("phEmail", phEmail);
    if (phEmail != "" && phSms != "") {
      await dispatch(
        updateUserData({
          posthogSmsKey: phSms,
          posthogEmailKey: phEmail,
          //posthogHostUrl: phHostUrl,
        })
      );
    } else if (phEmail != "") {
      await dispatch(
        updateUserData({
          posthogEmailKey: phEmail,
          //posthogHostUrl: phHostUrl,
        })
      );
    } else if (phSms != "") {
      await dispatch(
        updateUserData({
          posthogSmsKey: phSms,
          //posthogHostUrl: phHostUrl,
        })
      );
    } else {
    }

    console.log("in move to ph additional");
    navigate("/settings/posthog-configuration-three");
  };

  function renderButton() {
    if (true) {
      //if (phEmail.length > 0 && phSms.length > 0) {
      return (
        <>
          <GenericButton
            onClick={moveToAdditionalSettingsTwo}
            style={{
              maxWidth: "200px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
            }}
          >
            Next
          </GenericButton>
        </>
      );
    } else {
      <></>;
    }
  }

  return (
    <div className="relative bg-[#E5E5E5] flex flex-col h-[100vh]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Posthog Configuration - continued
          </h3>
          <p className="text-[18px] mb-[10px]">
            Do you have any email or sms fields on your posthog persons?
          </p>
          <p className="text-[18px] mb-[10px]">
            Often users use field names like $email or email. If you don't have
            these fields, feel free to skip and click next.
          </p>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phSms}
                label="Name of SMS / Phone number field on your Posthog person"
                placeholder={"$phoneNumber"}
                name="name"
                id="name"
                style={{
                  width: "530px",
                  padding: "15px 16px 15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
                onChange={(e) => {
                  setPrivateApiKey(e.target.value);
                  handleInputChange("phSms", e.target.value);
                }}
              />
            </FormControl>
          </Grid>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phEmail}
                label="Name of Email address field on your Posthog person"
                placeholder={"$email"}
                name="name"
                id="name"
                style={{
                  width: "530px",
                  padding: "15px 16px 15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  handleInputChange("phEmail", e.target.value);
                }}
              />
            </FormControl>
          </Grid>
          <div className="flex mt-[10%] justify-start">{renderButton()}</div>
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
          <CustomStepper activeStep={3} />
        </div>
      </div>
    </div>
  );
}

export default PosthogConfigurationTwo;
