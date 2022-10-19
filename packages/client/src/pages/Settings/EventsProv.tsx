import { Box, FormControl, Grid, MenuItem, Typography } from "@mui/material";
import Card from "components/Cards/Card";
import Header from "components/Header";
import Drawer from "components/Drawer";
import { Input, Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import ListItem from "./components/ListItem";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setSettingData, setEventsComplete } from "reducers/settings";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
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

function EventsProv() {
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
      {/* sx={{
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
          "&:disabled": {
            background: "#EEE !important",
          },
        },
        "& .MuiInputLabel-root": {
          fontSize: "16px",
          fontFamily: "Inter",
        },
        "& .MuiFormControl-root": {
          maxWidth: "529px",
        },
      }} */}
      <Header />
      <Box
        justifyContent={"space-around"}
        display={"flex"}
        margin={"72px 50px 72px 50px"}
        gap={"30px"}
      >
        <Card
          sx={{
            padding: "30px",
            width: "100%",
            maxWidth: "930px",
          }}
        >
          <Typography
            variant="h3"
            display={"flex"}
            alignItems="center"
            gap="10px"
            sx={{
              fontSize: "25px",
              fontWeight: 600,
              lineHeight: "40px",
              marginBottom: "10px",
            }}
          >
            Add your Event Provider
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "10px",
            }}
          >
            Search for your data integration.
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            If you don't need to add one feel free to skip, and click next
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={events}
                options={allChannels.map((item: any) => item.title)}
                onChange={(e) => {
                  setChannels(e.target.value);
                  handleInputChange("events", e.target.value);
                }}
                displayEmpty
                multipleSelections
                renderValue={() => <>Event Integration</>}
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
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {events.map((value: string) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            </FormControl>
          </Grid>
          {/* <Grid
            container
            direction={"row"}
            padding={"0px 0px"}
            marginBottom="20px"
          >
            {events.map((channel: any) => {
              return (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    marginRight: "20px",
                  }}
                >
                  <Chip key={channel} label={channel} />
                </Box>
              );
            })}
          </Grid> */}
          <Box display={"flex"} marginTop="40px" justifyContent="flex-start">
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
          </Box>
        </Card>
        <Card
          sx={{
            width: "100%",
            maxWidth: "465px",
            maxHeight: "auto",
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
              Youre only a few steps away from your first message
            </Typography>
          </Box>
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
        </Card>
      </Box>
    </div>
  );
}

export default EventsProv;
