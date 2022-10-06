import { Box, FormControl, Grid, MenuItem, Typography } from "@mui/material";
import Chip from "@mui/material/Chip";
import Card from "components/Cards/Card";
import Header from "components/Header";
import Drawer from "components/Drawer";
import { Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ListItem from "./components/ListItem";
import { useDispatch } from "react-redux";
import { setSettingData } from "reducers/settings";
import { useTypedSelector } from "hooks/useTypeSelector";

function EventProvider() {
  const allChannels: any = [
    {
      id: "sendgrid",
      title: "Sendgrid",
      subTitle: "for any campaign or newsletter",
      disabled: true,
    },
    {
      id: "mailgun",
      title: "Mailgun",
      subTitle: "Campaign: Onboarding Campaign",
      disabled: false,
    },
    {
      id: "mailchimp",
      title: "Mailchimp",
      subTitle: "Campaign: Transactional Receipt",
      disabled: true,
    },
    {
      id: "smtp",
      title: "SMTP",
      subTitle: "Setup your own email server",
      disabled: true,
    },
  ];
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [eventProvider, setEventProvider] = useState<any>(
    settings.eventProvider || []
  );
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const navigate = useNavigate();
  const moveToEmailConfiguration = () => {
    navigate("/settings/email-configuration");
  };
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
      <Drawer />
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
            Email configuration
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "10px",
            }}
          >
            Search for your email provider
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={eventProvider}
                displayEmpty
                onChange={(e) => {
                  setEventProvider(e.target.value);
                  handleInputChange("eventProvider", e.target.value);
                }}
                multipleSelections={true}
                renderValue={() => <></>}
                sx={{
                  height: "44px",
                  margin: "20px 0px",
                }}
                inputProps={{
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    boxShadow: "none",
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
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            container
            direction={"row"}
            padding={"0px 0px"}
            marginBottom="20px"
          >
            {eventProvider.map((events: any) => {
              return (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    marginRight: "20px",
                  }}
                >
                  <Chip key={events} label={events} />
                </Box>
              );
            })}
          </Grid>
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
            <GenericButton
              variant="contained"
              onClick={moveToEmailConfiguration}
              fullWidth
              sx={{
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
              Get your account ready to send automated message that people like
              to receive.
            </Typography>
          </Box>
          <CustomStepper activeStep={0} />
        </Card>
      </Box>
    </Box>
  );
}

export default EventProvider;
