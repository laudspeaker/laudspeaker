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
import {
  setSettingData,
  startPosthogImport,
  updateUserData,
} from "reducers/settings";

function AdditionalPosthog() {
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
  const moveToCompletion = async () => {
    console.log("start import pls");
    await startPosthogImport();
    dispatch(setSettingData({ ...settings, eventsCompleted: true }));
    navigate("/settings/network-configuration");
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
            Ready to Sync Posthog users?
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "35px",
            }}
          >
            Once this is done, we will email you on how to add the posthog app
            extension..
          </Typography>
          <Box display={"flex"} marginTop="10%" justifyContent="flex-start">
            <GenericButton
              onClick={moveToCompletion}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Sync
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
          <CustomStepper activeStep={4} />
        </Card>
      </Box>
    </div>
  );
}

export default AdditionalPosthog;
