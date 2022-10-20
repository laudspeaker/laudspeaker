import { Box, Grid, Typography } from "@mui/material";
import Card from "components/Cards/Card";
import Header from "components/Header";
import Drawer from "components/Drawer";
import CustomStepper from "./components/CustomStepper";
import { resetSetttingsData } from "reducers/settings";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { GenericButton } from "components/Elements";
import { useNavigate } from "react-router-dom";

function Completion() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNext: any = async (e: any) => {
    //e.preventDefault();
    navigate("/flow");
  };

  useEffect(() => {
    dispatch(resetSetttingsData());
  }, []);
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
            Onboarding Complete! 🎉
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "18px",
              marginBottom: "35px",
              fontFamily: "Inter",
            }}
          >
            You can now trigger Journeys!
          </Typography>
          <Grid
            container
            direction={"row"}
            padding={"0px 0px"}
            marginBottom="20px"
          ></Grid>
          <Box display={"flex"} marginTop="30px" justifyContent="flex-start">
            <GenericButton
              variant="contained"
              onClick={() => {
                handleNext();
              }}
              fullWidth
              sx={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Create your first journey
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
              You're only a few steps away from your first message!
            </Typography>
          </Box>
          <CustomStepper activeStep={3} />
        </Card>
      </Box>
    </Box>
  );
}

export default Completion;
