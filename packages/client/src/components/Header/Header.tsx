import React from "react";
import Box from "@mui/material/Box";
import Help from "../../assets/images/Help.svg";
import Notification from "../../assets/images/Notification.svg";
import Profile from "../../assets/images/Profile.svg";
import "./Header.css";
import { Menu, MenuItem } from "@mui/material";

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState<Element>();

  const helpClick = () => {};
  const notificationClick = () => {};
  const profileClick = (e: React.MouseEvent) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(undefined);
  };
  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "";
    window.location.reload();
  };
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "18px 30px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #D3D3D3",
        cursor: "pointer",
      }}
    >
      <Box>
        <img
          src={Help}
          alt="help"
          onClick={helpClick}
          style={{ padding: "0 8px" }}
        />
        <img
          src={Notification}
          alt="notification"
          onClick={notificationClick}
          style={{ padding: "0 8px" }}
        />
        <img
          src={Profile}
          alt="profile"
          onClick={profileClick}
          style={{ padding: "0 8px" }}
        />
      </Box>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Box>
  );
};

export default Header;
