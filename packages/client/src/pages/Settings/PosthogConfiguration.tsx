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
    navigate("/settings/phconfiguration-two");
    //navigate("/settings/additional-posthog");
  };

  function renderButton() {
    if (phProjectId.length > 0 && phPrivateApiKey.length > 0) {
      return (
        <>
          <GenericButton
            variant="contained"
            onClick={moveToAdditionalSettings}
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
            Posthog Configuration
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={phPrivateApiKey}
                label="Private API Key"
                placeholder={"****  "}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={(e) => {
                  setPrivateApiKey(e.target.value);
                  handleInputChange("phPrivateApiKey", e.target.value);
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
                value={phProjectId}
                label="Project Id"
                placeholder={"****  "}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  handleInputChange("phProjectId", e.target.value);
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
                value={phHostUrl}
                label="Posthog Url"
                placeholder={"https://app.posthog.com"}
                name="name"
                id="name"
                sx={{ width: "530px" }}
                onChange={(e) => {
                  setPhHostUrl(e.target.value);
                  handleInputChange("phHostUrl", e.target.value);
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
              Youre only a few steps away from your first message
            </Typography>
          </Box>
          <CustomStepper activeStep={3} />
        </Card>
      </Box>
    </Box>
  );
}

export default PosthogConfiguration;
