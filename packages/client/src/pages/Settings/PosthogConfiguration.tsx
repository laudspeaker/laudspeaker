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

function PosthogConfiguration() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);

  const [phProjectId, setProjectId] = useState<string>(
    settings.phProjectId || ""
  );
  const [phPrivateApiKey, setPrivateApiKey] = useState<string>(
    settings.phPrivateApiKey || ""
  );
  const [phHostUrl, setPhHostUrl] = useState<string>(
    settings.phHostUrl || "https://app.posthog.com"
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToAdditionalSettings = async () => {
    await dispatch(
      updateUserData({
        posthogApiKey: phPrivateApiKey,
        posthogProjectId: phProjectId,
        posthogHostUrl: phHostUrl,
      })
    );
    navigate("/settings/posthog-configuration-two");
  };

  function renderButton() {
    if (phProjectId.length > 0 && phPrivateApiKey.length > 0) {
      return (
        <>
          <GenericButton
            onClick={moveToAdditionalSettings}
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
            Posthog Configuration
          </h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phPrivateApiKey}
                label="Private API Key"
                placeholder={"****  "}
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
                  handleInputChange("phPrivateApiKey", e.target.value);
                }}
              />
            </FormControl>
          </Grid>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phProjectId}
                label="Project Id"
                placeholder={"****  "}
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
                  handleInputChange("phProjectId", e.target.value);
                }}
              />
            </FormControl>
          </Grid>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phHostUrl}
                label="Posthog Url"
                placeholder={"https://app.posthog.com"}
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
                  setPhHostUrl(e.target.value);
                  handleInputChange("phHostUrl", e.target.value);
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

export default PosthogConfiguration;
