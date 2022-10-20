import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import { Input, Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setSettingData } from "reducers/settings";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import Chip from "components/Elements/Chip";

const allChannels: any = [
  {
    id: "email",
    title: "Email",
    subTitle: "for any campaign or newsletter",
  },
  {
    id: "push",
    title: "Mobile Push",
    subTitle: "Campaign: Onboarding Campaign",
    disabled: true,
  },
  {
    id: "slack",
    title: "Slack",
    subTitle: "Campaign: Transactional Receipt",
  },
  {
    id: "human",
    title: "Human",
    subTitle: "Campaign: Onboarding Campaign",
    disabled: true,
  },
];

function Channel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [channels, setChannels] = useState<any>([]);
  const [friendsList, setFriendsList] = useState<string>("");
  useLayoutEffect(() => {
    dispatch(setSettingData({ ...settings, ["channel"]: undefined }));
  }, []);

  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToNetworkConfiguration = () => {
    navigate("/settings/network-configuration");
  };

  const handleNextButtonClick = async () => {
    await ApiService.patch({
      url: ApiConfig.updateUserInfo,
      options: { expectedOnboarding: channels },
    });
    moveToNetworkConfiguration();
  };

  return (
    <div className="relative flex flex-col h-[100vh] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px] overflow-visible">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Welcome to Laudspeaker 🎉
          </h3>
          <p className="text-[18px] mb-[35px]">
            We’ll get you ready to go in no time! Check out our checklist on the
            right and happy marketing!
          </p>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={channels}
                options={allChannels.map((item: any) => ({
                  value: item.title,
                  subtitle: item.subTitle,
                  disabled: item.disabled,
                }))}
                tick
                onChange={(value) => {
                  setChannels(value);
                  handleInputChange("channel", value);
                }}
                displayEmpty
                multipleSelections
                renderValue={() => <>Add channel</>}
                sx={{
                  height: "44px",
                  margin: "20px 0px",
                }}
                inputProps={{
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    boxShadow: "none",
                    borderRadius: "3px",
                  },
                  sx: {
                    borderRadius: "6px !important",
                  },
                }}
              />
              <div className="flex flex-wrap gap-[0.5]">
                {channels.map((value: string) => (
                  <Chip key={value} label={value} />
                ))}
              </div>
            </FormControl>
          </Grid>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={friendsList}
                label="Invite friends and colleagues(Coming soon)"
                placeholder={"Enter name"}
                name="name"
                id="name"
                style={{
                  maxWidth: "530px",
                  padding: "15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
                disabled
                onChange={(e) => {
                  setFriendsList(e.target.value);
                  handleInputChange("friendsList", e.target.value);
                }}
              />
            </FormControl>
          </Grid>
          <div className="flex mt-[10%] justify-start">
            <GenericButton
              onClick={handleNextButtonClick}
              disabled={!settings.channel || settings.channel.length === 0}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Next
            </GenericButton>
          </div>
        </div>
        <div className="bg-white rounded-3xl w-full max-w-[465px] max-h-[auto]">
          <div className="p-[20px] flex flex-col gap-[16px]">
            <h3 className="text-black">Your Setup List</h3>
            <p className="text-[#6B7280]">
              You're only a few steps away from your first message!
            </p>
          </div>
          <CustomStepper
            steps={[
              "Create Account",
              "Choose Channels",
              "Add Event Integrations",
              "Set Up Channels",
              "Create your first Journey",
            ]}
            activeStep={1}
          />
        </div>
      </div>
    </div>
  );
}

export default Channel;
