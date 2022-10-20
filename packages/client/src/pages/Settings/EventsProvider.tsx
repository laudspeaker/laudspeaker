import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import { Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setSettingData, setEventsComplete } from "reducers/settings";
import Chip from "components/Elements/Chip";

export const allChannels: any = [
  {
    id: "segment",
    title: "Segment",
    subTitle: "for any campaign or newsletter",
    disabled: true,
  },
  {
    id: "posthog",
    title: "Posthog",
    subTitle: "Campaign: Onboarding Campaign",
    disabled: false,
  },
  {
    id: "rudderstack",
    title: "Rudderstack",
    subTitle: "Campaign: Transactional Receipt",
    disabled: true,
  },
];

function EventsProvider() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [events, setChannels] = useState<any>([]);
  const [friendsList, setFriendsList] = useState<string>("");
  useLayoutEffect(() => {
    dispatch(setSettingData({ ...settings, ["events"]: undefined }));
  }, []);

  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToNetworkConfiguration = () => {
    //navigate("/settings/phconfiguration");
    if (events.length == 0) {
      dispatch(setEventsComplete(true));
    }
    //eventsCompleted = true;
    navigate("/settings/network-configuration");
  };

  const handleNextButtonClick = async () => {
    // await ApiService.patch({
    //   url: ApiConfig.updateUserInfo,
    //   options: { expectedOnboarding: events },
    // });
    moveToNetworkConfiguration();
  };

  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Add your Event Provider
          </h3>
          <p className="text-[18px] mb-[10px]">
            Search for your data integration.
          </p>
          <p className="text-[14px] mb-[10px]">
            If you don't need to add one feel free to skip, and click next
          </p>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={events}
                options={allChannels.map((item: any) => ({
                  title: item.title,
                  value: item.id,
                  disabled: item.disabled,
                  subtitle: item.subTitle,
                }))}
                onChange={(value) => {
                  setChannels(value);
                  handleInputChange("events", value);
                }}
                displayEmpty
                multipleSelections
                renderValue={() => <>Event Integration</>}
                sx={{
                  height: "44px",
                  margin: "20px 0px",
                }}
              />
              {/* {allChannels.map((channel: any) => {
                  return (
                    <MenuItem
                      value={channel.title}
                      disabled={channel.disabled}
                      sx={{
                        height: "auto",
                        "&.Mui-selected": {
                          background: "transparent",
                        },
                        "&.Mui-selected:hover": {
                          background: "transparent",
                        },
                        "&:hover": {
                          background: "transparent",
                        },
                      }}
                    >
                      <ListItem
                        title={channel.title}
                        subtitle={`${channel.subTitle} ${
                          channel.disabled ? "(coming soon)" : ""
                        }`}
                        tick={events.includes(channel.title)}
                      />
                    </MenuItem>
                  );
                })}
              </Select> */}
              <div className="flex flex-wrap gap-[0.5]">
                {events.map((value: string) => (
                  <Chip key={value} label={value} wrapperClass="mt-[16px]" />
                ))}
              </div>
            </FormControl>
          </Grid>
          <div className="flex mt-[40px] justify-start">
            <GenericButton
              onClick={handleNextButtonClick}
              disabled={false}
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

export default EventsProvider;
