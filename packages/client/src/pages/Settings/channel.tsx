import {
  Box,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Typography,
} from "@mui/material";
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
import { setSettingData } from "reducers/settings";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";

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
    <Box
      sx={{
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
      }}
    >
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
            Welcome to Laudspeaker 🎉
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "35px",
            }}
          >
            We’ll get you ready to go in no time! Check out our checklist on the
            right and happy marketing!
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={channels}
                onChange={(e) => {
                  setChannels(e.target.value);
                  handleInputChange("channel", e.target.value);
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
              >
                {allChannels.map((channel: any) => {
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
                        tick={channels.includes(channel.title)}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {channels.map((value: string) => (
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
            {channels.map((channel: any) => {
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
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
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
    </Box>
  );
}

export default Channel;
