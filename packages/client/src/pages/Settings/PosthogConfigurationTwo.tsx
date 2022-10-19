import { Box, FormControl, Grid, MenuItem, Typography } from "@mui/material";
import Card from "components/Cards/Card";
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
            variant="contained"
            onClick={moveToAdditionalSettingsTwo}
            fullWidth
            sx={{
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
            Posthog Configuration - continued
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "10px",
            }}
          >
            Do you have any email or sms fields on your posthog persons?
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            Often users use field names like $email or email. If you don't have
            these fields, feel free to skip and click next.
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phSms}
                label="Name of SMS / Phone number field on your Posthog person"
                placeholder={"$phoneNumber"}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={(e) => {
                  setPrivateApiKey(e.target.value);
                  handleInputChange("phSms", e.target.value);
                }}
                labelShrink
                inputProps={{
                  style: {
                    padding: "15px 16px 15px 16px",
                    background: "#fff",
                    border: "1px solid #D1D5DB",
                    fontFamily: "Inter",
                    fontWeight: 400,
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
                value={phEmail}
                label="Name of Email address field on your Posthog person"
                placeholder={"$email"}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  handleInputChange("phEmail", e.target.value);
                }}
                labelShrink
                inputProps={{
                  style: {
                    padding: "15px 16px 15px 16px",
                    background: "#fff",
                    border: "1px solid #D1D5DB",
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "16px",
                  },
                }}
              />
            </FormControl>
          </Grid>
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
            {renderButton()}
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
              You're only a few steps away from your first message!
            </Typography>
          </Box>
          <CustomStepper activeStep={3} />
        </Card>
      </Box>
    </Box>
  );
}

export default PosthogConfigurationTwo;
