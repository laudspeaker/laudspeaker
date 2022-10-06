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
} from "reducers/settings";

function EmailConfiguration() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);

  const [domainName, setDomainName] = useState<any>(settings.domainName || "");
  const [privateApiKey, setPrivateApiKey] = useState<string>(
    settings.privateApiKey || ""
  );
  const [domainList, setDomainList] = useState<any>(domainsList || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToAdditionalSettings = () => {
    navigate("/settings/additional-settings");
  };
  const callDomains = async () => {
    if (privateApiKey) {
      dispatch(setSettingsPrivateApiKey(privateApiKey));
      const response = await dispatch(setDomainsList(privateApiKey));
      if (response?.data) {
        setDomainList(response?.data);
      }
    }
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
            Email Configuration
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={privateApiKey}
                label="Private API Key"
                placeholder={"****  "}
                name="name"
                id="name"
                type="password"
                sx={{ maxWidth: "530px" }}
                onChange={(e) => {
                  setPrivateApiKey(e.target.value);
                  handleInputChange("privateApiKey", e.target.value);
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
                onBlur={callDomains}
              />
            </FormControl>
          </Grid>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "16px",
              marginBottom: "10px",
            }}
          >
            Domain
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={domainName}
                onChange={(e) => {
                  setDomainName(e.target.value);
                  handleInputChange("domainName", e.target.value);
                }}
                displayEmpty
                renderValue={(val: any) => val}
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
                {domainList.map((channel: any) => {
                  return (
                    <MenuItem
                      value={channel.name}
                      disabled={!channel?.state}
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
                        title={channel.name}
                        subtitle={`${channel.type} ${
                          !channel.state ? "(coming soon)" : ""
                        }`}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
            <GenericButton
              variant="contained"
              onClick={moveToAdditionalSettings}
              fullWidth
              disabled={!privateApiKey || !domainName}
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
          <CustomStepper activeStep={1} />
        </Card>
      </Box>
    </Box>
  );
}

export default EmailConfiguration;
