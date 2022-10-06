import { Box, FormControl, Grid, Typography } from "@mui/material";
import Card from "components/Cards/Card";
import Header from "components/Header";
import Drawer from "components/Drawer";
import { Input, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import { setSettingData, updateUserData } from "reducers/settings";

function AdditionalSettings() {
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
            Email Configuration
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={defaultName}
                label="Default From Name"
                placeholder={"John smith"}
                name="name"
                id="name"
                sx={{ maxWidth: "530px" }}
                onChange={(e) => {
                  setDefaultName(e.target.value);
                  handleInputChange("defaultName", e.target.value);
                }}
                labelShrink
                inputProps={{
                  style: {
                    padding: "15px 16px 15px 16px",
                    background: "#fff",
                    border: "1px solid #D1D5DB",
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "16px",
                  },
                }}
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
                sx={{ maxWidth: "530px" }}
                onChange={(e) => {
                  if (!e.target.value.endsWith(inputEmailDomain)) return;
                  const newValue = e.target.value.replace(inputEmailDomain, "");
                  setDefaultEmail(newValue);
                  handleInputChange("defaultEmail", newValue);
                }}
                labelShrink
                inputProps={{
                  style: {
                    padding: "15px 16px 15px 16px",
                    background: "#fff",
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "16px",
                    border: "1px solid #D1D5DB",
                  },
                }}
              />
            </FormControl>
          </Grid>
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
            <GenericButton
              variant="contained"
              onClick={handleNextButtonClick}
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
              Youre only a few steps away from your first message
            </Typography>
          </Box>
          <CustomStepper activeStep={2} />
        </Card>
      </Box>
    </Box>
  );
}

export default AdditionalSettings;
