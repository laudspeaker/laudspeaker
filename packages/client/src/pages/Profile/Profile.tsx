import { Box } from "@mui/material";
import Header from "../../components/Header";

import Drawer from "../../components/Drawer";
import ProfileForm from "./components/ProfileForm";

const Profile = () => {
  return (
    <Box
      sx={{
        paddingLeft: "154px",
        position: "relative",
        backgroundColor: "#E5E5E5",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "auto",
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
      <Drawer />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "10%",
          paddingTop: "70px",
          justifyContent: "center",
          alightItems: "center",
          width: "100%",
        }}
      >
        <Box
          sx={{
            paddingLeft: "25px",
            paddingRight: "25px",
            minHeight: "calc(100vh - 162px)",
            maxWidth: "930px",
            width: "90%",
            background: "#FFFFFF",
            borderRadius: "20px",
          }}
        >
          <h2>My Settings</h2>
          <ProfileForm />
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
